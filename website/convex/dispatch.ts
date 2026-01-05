import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Get available drivers with distance from warehouse
 */
export const getAvailableDrivers = query({
  handler: async (ctx) => {
    // Get warehouse location from settings
    const warehouseSetting = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', 'warehouse_location'))
      .first()

    const warehouseLocation = warehouseSetting?.value as
      | { lat: number; lng: number }
      | undefined

    // Get all on-duty drivers
    const drivers = await ctx.db
      .query('drivers')
      .withIndex('by_isOnDuty', (q) => q.eq('isOnDuty', true))
      .collect()

    return drivers.map((driver) => {
      let distanceFromWarehouse: number | null = null

      if (warehouseLocation && driver.currentLocation) {
        distanceFromWarehouse = calculateDistance(
          warehouseLocation.lat,
          warehouseLocation.lng,
          driver.currentLocation.lat,
          driver.currentLocation.lng
        )
      }

      return {
        driverId: driver.driverId,
        name: driver.name,
        phone: driver.phone,
        currentLocation: driver.currentLocation,
        codWallet: driver.codWallet,
        distanceFromWarehouse,
        lastLocationUpdate: driver.lastLocationUpdate,
      }
    })
  },
})

/**
 * Assign orders to a driver
 */
export const assignOrdersToDriver = mutation({
  args: {
    orderIds: v.array(v.string()),
    driverId: v.string(),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify driver exists and is on duty
    const drivers = await ctx.db.query('drivers').collect()
    const driver = drivers.find((d) => d.driverId === args.driverId)

    if (!driver) {
      throw new Error(`Driver ${args.driverId} not found`)
    }

    if (!driver.isOnDuty) {
      throw new Error(`Driver ${args.driverId} is not on duty`)
    }

    // Get all orders
    const allOrders = await ctx.db.query('orders').collect()
    const orders = allOrders.filter((o) => args.orderIds.includes(o.orderId))

    if (orders.length !== args.orderIds.length) {
      throw new Error('Some orders not found')
    }

    const now = Date.now()

    // Update each order
    for (const order of orders) {
      // Validate order can be assigned
      if (order.status === 'CANCELLED') {
        throw new Error(`Order ${order.orderId} is cancelled`)
      }

      if (order.assignedDriverId && order.assignedDriverId !== args.driverId) {
        throw new Error(
          `Order ${order.orderId} is already assigned to another driver`
        )
      }

      // Only assign if status allows
      const allowedStatuses = [
        'PENDING_DISPATCH',
        'PROCESSING',
        'PENDING_VERIFICATION',
      ]
      if (!allowedStatuses.includes(order.status)) {
        throw new Error(
          `Order ${order.orderId} cannot be assigned (status: ${order.status})`
        )
      }

      await ctx.db.patch(order._id, {
        assignedDriverId: args.driverId,
        status: 'ASSIGNED',
        updatedAt: now,
      })

      // Log assignment
      await ctx.db.insert('auditLogs', {
        logId: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
        action: 'ORDER_ASSIGNED',
        adminId: args.adminId,
        targetId: order.orderId,
        metadata: {
          driverId: args.driverId,
          driverName: driver.name,
        },
        timestamp: now,
      })
    }

    return { success: true, assignedCount: orders.length }
  },
})

/**
 * Get assigned orders grouped by driver
 */
export const getAssignedOrders = query({
  args: {
    driverId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.driverId) {
      const orders = await ctx.db
        .query('orders')
        .withIndex('by_driverId', (q) =>
          q.eq('assignedDriverId', args.driverId!)
        )
        .collect()
      const assigned = orders.filter((o) => o.status === 'ASSIGNED')

      if (assigned.length === 0) {
        return []
      }

      const drivers = await ctx.db.query('drivers').collect()
      const driver = drivers.find((d) => d.driverId === args.driverId)

      return [
        {
          driverId: args.driverId!,
          driverName: driver?.name || 'Unknown Driver',
          orders: assigned,
        },
      ]
    } else {
      // Get all orders with assignedDriverId
      const allOrders = await ctx.db.query('orders').collect()
      const assigned = allOrders.filter(
        (o) => o.assignedDriverId && o.status === 'ASSIGNED'
      )

      // Group by driver
      const grouped: Record<
        string,
        {
          driverId: string
          driverName: string
          orders: typeof assigned
        }
      > = {}

      const drivers = await ctx.db.query('drivers').collect()

      for (const order of assigned) {
        if (!order.assignedDriverId) continue

        const driver = drivers.find((d) => d.driverId === order.assignedDriverId)
        const driverName = driver?.name || 'Unknown Driver'

        if (!grouped[order.assignedDriverId]) {
          grouped[order.assignedDriverId] = {
            driverId: order.assignedDriverId,
            driverName,
            orders: [],
          }
        }

        grouped[order.assignedDriverId].orders.push(order)
      }

      return Object.values(grouped)
    }
  },
})

/**
 * Get unassigned orders ready for assignment
 */
export const getUnassignedOrders = query({
  handler: async (ctx) => {
    const orders = await ctx.db
      .query('orders')
      .withIndex('by_status', (q) => q.eq('status', 'PENDING_DISPATCH'))
      .collect()

    // Also include PROCESSING orders that aren't assigned
    const processingOrders = await ctx.db
      .query('orders')
      .withIndex('by_status', (q) => q.eq('status', 'PROCESSING'))
      .collect()

    const unassigned = [
      ...orders,
      ...processingOrders.filter((o) => !o.assignedDriverId),
    ]

    // Sort by createdAt
    unassigned.sort((a, b) => a.createdAt - b.createdAt)

    return unassigned
  },
})

