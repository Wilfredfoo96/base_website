import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

/**
 * Get all routes
 */
export const getAll = query({
  args: {
    driverId: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal('DRAFT'), v.literal('ACTIVE'), v.literal('COMPLETED'))
    ),
  },
  handler: async (ctx, args) => {
    if (args.driverId) {
      return await ctx.db
        .query('routes')
        .withIndex('by_driverId', (q) => q.eq('driverId', args.driverId!))
        .collect()
    }

    if (args.status) {
      return await ctx.db
        .query('routes')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .collect()
    }

    return await ctx.db.query('routes').collect()
  },
})

/**
 * Get route by ID
 */
export const getById = query({
  args: { routeId: v.string() },
  handler: async (ctx, args) => {
    const routes = await ctx.db.query('routes').collect()
    return routes.find((r) => r.routeId === args.routeId)
  },
})

/**
 * Get active routes
 */
export const getActive = query({
  handler: async (ctx) => {
    return await ctx.db
      .query('routes')
      .withIndex('by_status', (q) => q.eq('status', 'ACTIVE'))
      .collect()
  },
})

/**
 * Get driver's assigned orders (for route building)
 */
export const getDriverAssignedOrders = query({
  args: { driverId: v.string() },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query('orders')
      .withIndex('by_driverId', (q) => q.eq('assignedDriverId', args.driverId))
      .collect()

    // Filter to only orders that are assigned but not yet in a route
    return orders.filter(
      (o) =>
        o.status === 'ASSIGNED' &&
        o.assignedDriverId === args.driverId &&
        !o.routePosition
    )
  },
})

/**
 * Create manifest (route) with stale data validation
 * CRITICAL: Validates orders before locking route
 */
export const createManifest = mutation({
  args: {
    routeId: v.string(),
    driverId: v.string(),
    orderIds: v.array(v.string()),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Validate driver is on-duty
    const drivers = await ctx.db.query('drivers').collect()
    const driver = drivers.find((d) => d.driverId === args.driverId)

    if (!driver) {
      throw new Error(`Driver ${args.driverId} not found`)
    }

    if (!driver.isOnDuty) {
      throw new Error('Driver is not on-duty')
    }

    // 2. CRITICAL: Re-query orders to check for stale data
    const allOrders = await ctx.db.query('orders').collect()
    const orders = allOrders.filter((o) => args.orderIds.includes(o.orderId))

    // Validate all orderIds exist
    if (orders.length !== args.orderIds.length) {
      const foundIds = orders.map((o) => o.orderId)
      const missingIds = args.orderIds.filter((id) => !foundIds.includes(id))
      throw new Error(`Orders not found: ${missingIds.join(', ')}`)
    }

    // 3. Validate each order
    for (const order of orders) {
      if (order.status === 'CANCELLED') {
        throw new Error(`Order ${order.orderId} was cancelled`)
      }
      if (
        order.assignedDriverId &&
        order.assignedDriverId !== args.driverId
      ) {
        throw new Error(
          `Order ${order.orderId} already assigned to another driver`
        )
      }
      if (
        !['PENDING_DISPATCH', 'PROCESSING', 'ASSIGNED'].includes(order.status)
      ) {
        throw new Error(
          `Order ${order.orderId} cannot be assigned (status: ${order.status})`
        )
      }
    }

    // 4. Create the route
    const now = Date.now()
    const routeId = await ctx.db.insert('routes', {
      routeId: args.routeId,
      driverId: args.driverId,
      orderIds: args.orderIds,
      status: 'DRAFT',
      createdAt: now,
    })

    // 5. Update orders with route position
    for (let i = 0; i < args.orderIds.length; i++) {
      const order = orders.find((o) => o.orderId === args.orderIds[i])
      if (order) {
        await ctx.db.patch(order._id, {
          assignedDriverId: args.driverId,
          status: 'ASSIGNED',
          routePosition: i + 1, // Stop 1, Stop 2, etc.
          updatedAt: now,
        })
      }
    }

    // 6. Log route creation
    await ctx.db.insert('auditLogs', {
      logId: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'ROUTE_CREATED',
      adminId: args.adminId,
      targetId: args.routeId,
      metadata: {
        driverId: args.driverId,
        orderCount: args.orderIds.length,
      },
      timestamp: now,
    })

    return routeId
  },
})

/**
 * Optimize route (reorder stops)
 */
export const optimizeRoute = mutation({
  args: {
    routeId: v.string(),
    optimizedOrderIds: v.array(v.string()),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const routes = await ctx.db.query('routes').collect()
    const route = routes.find((r) => r.routeId === args.routeId)

    if (!route) {
      throw new Error(`Route ${args.routeId} not found`)
    }

    if (route.status !== 'DRAFT') {
      throw new Error('Can only optimize routes in DRAFT status')
    }

    // Validate all optimized order IDs are in the original route
    const missingIds = args.optimizedOrderIds.filter(
      (id) => !route.orderIds.includes(id)
    )
    if (missingIds.length > 0) {
      throw new Error(`Order IDs not in route: ${missingIds.join(', ')}`)
    }

    // Validate all original order IDs are in optimized sequence
    const extraIds = route.orderIds.filter(
      (id) => !args.optimizedOrderIds.includes(id)
    )
    if (extraIds.length > 0) {
      throw new Error(`Missing order IDs in optimized sequence: ${extraIds.join(', ')}`)
    }

    const now = Date.now()

    // Update route with optimized order sequence
    await ctx.db.patch(route._id, {
      orderIds: args.optimizedOrderIds,
    })

    // Update order route positions
    for (let i = 0; i < args.optimizedOrderIds.length; i++) {
      const allOrders = await ctx.db.query('orders').collect()
      const order = allOrders.find((o) => o.orderId === args.optimizedOrderIds[i])
      if (order) {
        await ctx.db.patch(order._id, {
          routePosition: i + 1,
          updatedAt: now,
        })
      }
    }

    // Log optimization
    await ctx.db.insert('auditLogs', {
      logId: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'ROUTE_OPTIMIZED',
      adminId: args.adminId,
      targetId: args.routeId,
      metadata: { optimizedOrderIds: args.optimizedOrderIds },
      timestamp: now,
    })

    return { success: true }
  },
})

/**
 * Activate route (push to Driver App)
 */
export const activate = mutation({
  args: {
    routeId: v.string(),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const routes = await ctx.db.query('routes').collect()
    const route = routes.find((r) => r.routeId === args.routeId)

    if (!route) {
      throw new Error(`Route ${args.routeId} not found`)
    }

    if (route.status !== 'DRAFT') {
      throw new Error('Can only activate routes in DRAFT status')
    }

    const now = Date.now()

    await ctx.db.patch(route._id, {
      status: 'ACTIVE',
      startedAt: now,
    })

    return { success: true }
  },
})

/**
 * Update route progress (driver's current stop)
 */
export const updateProgress = mutation({
  args: {
    routeId: v.string(),
    currentStopIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const routes = await ctx.db.query('routes').collect()
    const route = routes.find((r) => r.routeId === args.routeId)

    if (!route) {
      throw new Error(`Route ${args.routeId} not found`)
    }

    // Update order statuses based on progress
    const allOrders = await ctx.db.query('orders').collect()
    
    // Get orders in the same order as route.orderIds
    const routeOrders = route.orderIds
      .map((orderId) => allOrders.find((o) => o.orderId === orderId))
      .filter((o): o is NonNullable<typeof o> => o !== undefined)

    // Validate we have all orders
    if (routeOrders.length !== route.orderIds.length) {
      throw new Error('Some orders in route are missing')
    }

    for (let i = 0; i < routeOrders.length; i++) {
      const order = routeOrders[i]
      if (i < args.currentStopIndex) {
        // Past stops - should be DELIVERED, FAILED, or RETURNED
        // Don't change if already in final state
      } else if (i === args.currentStopIndex) {
        // Current stop - should be EN_ROUTE
        if (order.status === 'ASSIGNED') {
          await ctx.db.patch(order._id, {
            status: 'EN_ROUTE',
            updatedAt: Date.now(),
          })
        }
      }
      // Future stops remain ASSIGNED
    }

    return { success: true }
  },
})

/**
 * Complete route
 */
export const complete = mutation({
  args: {
    routeId: v.string(),
  },
  handler: async (ctx, args) => {
    const routes = await ctx.db.query('routes').collect()
    const route = routes.find((r) => r.routeId === args.routeId)

    if (!route) {
      throw new Error(`Route ${args.routeId} not found`)
    }

    await ctx.db.patch(route._id, {
      status: 'COMPLETED',
      completedAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Get warehouse location from settings
 */
export const getWarehouseLocation = query({
  handler: async (ctx) => {
    const settings = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', 'warehouse_location'))
      .first()

    if (!settings) {
      return null
    }

    return settings.value as { lat: number; lng: number }
  },
})

