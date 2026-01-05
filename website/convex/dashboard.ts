import { v } from 'convex/values'
import { query } from './_generated/server'

/**
 * Get dashboard statistics
 */
export const getStats = query({
  args: {
    timeRange: v.optional(
      v.union(
        v.literal('today'),
        v.literal('week'),
        v.literal('month'),
        v.literal('custom')
      )
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    let startTime: number
    let endTime: number = now

    // Calculate time range
    switch (args.timeRange) {
      case 'today':
        startTime = new Date().setHours(0, 0, 0, 0)
        break
      case 'week':
        startTime = now - 7 * 24 * 60 * 60 * 1000
        break
      case 'month':
        startTime = now - 30 * 24 * 60 * 60 * 1000
        break
      case 'custom':
        startTime = args.startDate || now - 30 * 24 * 60 * 60 * 1000
        endTime = args.endDate || now
        break
      default:
        startTime = new Date().setHours(0, 0, 0, 0) // Today by default
    }

    // Get all orders in time range
    const allOrders = await ctx.db.query('orders').collect()
    const ordersInRange = allOrders.filter(
      (o) => o.createdAt >= startTime && o.createdAt <= endTime
    )

    // Calculate stats
    const delivered = ordersInRange.filter((o) => o.status === 'DELIVERED')
    const failed = ordersInRange.filter((o) => o.status === 'FAILED')
    const returned = ordersInRange.filter((o) => o.status === 'RETURNED')

    // Financial stats
    const bankTransferOrders = ordersInRange.filter(
      (o) => o.paymentMethod === 'BANK_TRANSFER' && o.paymentStatus === 'VERIFIED'
    )
    const codOrders = delivered.filter((o) => o.paymentMethod === 'COD')

    const totalBankTransfer = bankTransferOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    )
    const totalCOD = codOrders.reduce((sum, o) => sum + o.totalAmount, 0)

    // Previous period comparison (for same duration before startTime)
    const periodDuration = endTime - startTime
    const previousStartTime = startTime - periodDuration
    const previousEndTime = startTime

    const previousOrders = allOrders.filter(
      (o) => o.createdAt >= previousStartTime && o.createdAt < previousEndTime
    )
    const previousDelivered = previousOrders.filter((o) => o.status === 'DELIVERED')
    const previousFailed = previousOrders.filter((o) => o.status === 'FAILED')

    return {
      orders: {
        delivered: delivered.length,
        failed: failed.length,
        returned: returned.length,
        total: ordersInRange.length,
      },
      financial: {
        bankTransfer: totalBankTransfer,
        cod: totalCOD,
        total: totalBankTransfer + totalCOD,
      },
      comparison: {
        deliveredChange:
          previousDelivered.length > 0
            ? ((delivered.length - previousDelivered.length) /
                previousDelivered.length) *
              100
            : 0,
        failedChange:
          previousFailed.length > 0
            ? ((failed.length - previousFailed.length) / previousFailed.length) *
              100
            : 0,
      },
      timeRange: {
        start: startTime,
        end: endTime,
      },
    }
  },
})

/**
 * Get quick stats for dashboard cards
 */
export const getQuickStats = query({
  handler: async (ctx) => {
    // Pending verification orders
    const pendingVerification = await ctx.db
      .query('orders')
      .withIndex('by_paymentStatus', (q) => q.eq('paymentStatus', 'PENDING'))
      .collect()
    const pendingVerificationCount = pendingVerification.filter(
      (o) => o.paymentMethod === 'BANK_TRANSFER'
    ).length

    // Active drivers
    const activeDrivers = await ctx.db
      .query('drivers')
      .withIndex('by_isOnDuty', (q) => q.eq('isOnDuty', true))
      .collect()

    // Orders in transit
    const ordersInTransit = await ctx.db
      .query('orders')
      .withIndex('by_status', (q) => q.eq('status', 'EN_ROUTE'))
      .collect()

    // Low stock products
    const thresholdSetting = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', 'low_stock_threshold'))
      .first()
    const threshold = (thresholdSetting?.value as number) || 10

    const allProducts = await ctx.db.query('products').collect()
    const lowStockProducts = allProducts.filter((p) => p.stockLevel < threshold)

    return {
      pendingVerification: pendingVerificationCount,
      activeDrivers: activeDrivers.length,
      ordersInTransit: ordersInTransit.length,
      lowStockAlerts: lowStockProducts.length,
    }
  },
})

/**
 * Get active drivers with locations for fleet map
 */
export const getActiveDrivers = query({
  handler: async (ctx) => {
    const drivers = await ctx.db
      .query('drivers')
      .withIndex('by_isOnDuty', (q) => q.eq('isOnDuty', true))
      .collect()

    return drivers
      .filter((d) => d.currentLocation) // Only drivers with location data
      .map((d) => ({
        driverId: d.driverId,
        name: d.name,
        location: d.currentLocation!,
        lastUpdate: d.lastLocationUpdate || d.currentLocation!.timestamp,
      }))
  },
})

