import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

/**
 * Get pending payment verifications (Bank Transfer orders)
 */
export const getPendingVerifications = query({
  handler: async (ctx) => {
    const orders = await ctx.db
      .query('orders')
      .withIndex('by_paymentStatus', (q) => q.eq('paymentStatus', 'PENDING'))
      .collect()

    // Filter to only Bank Transfer orders
    return orders.filter(
      (o) => o.paymentMethod === 'BANK_TRANSFER' && o.paymentStatus === 'PENDING'
    )
  },
})

/**
 * Approve payment (Bank Transfer verification)
 */
export const approvePayment = mutation({
  args: {
    orderId: v.string(),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const allOrders = await ctx.db.query('orders').collect()
    const order = allOrders.find((o) => o.orderId === args.orderId)

    if (!order) {
      throw new Error(`Order ${args.orderId} not found`)
    }

    if (order.paymentStatus !== 'PENDING') {
      throw new Error(`Order payment is not pending (status: ${order.paymentStatus})`)
    }

    if (order.paymentMethod !== 'BANK_TRANSFER') {
      throw new Error('Can only approve Bank Transfer payments')
    }

    const now = Date.now()

    // Update order
    await ctx.db.patch(order._id, {
      paymentStatus: 'VERIFIED',
      status: 'PROCESSING', // Move to processing after verification
      verifiedBy: args.adminId,
      verifiedAt: now,
      updatedAt: now,
    })

    // Log approval
    await ctx.db.insert('auditLogs', {
      logId: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'PAYMENT_APPROVED',
      adminId: args.adminId,
      targetId: args.orderId,
      metadata: { amount: order.totalAmount },
      timestamp: now,
    })

    return { success: true }
  },
})

/**
 * Reject payment (Bank Transfer verification)
 */
export const rejectPayment = mutation({
  args: {
    orderId: v.string(),
    reason: v.optional(v.string()),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const allOrders = await ctx.db.query('orders').collect()
    const order = allOrders.find((o) => o.orderId === args.orderId)

    if (!order) {
      throw new Error(`Order ${args.orderId} not found`)
    }

    if (order.paymentStatus !== 'PENDING') {
      throw new Error(`Order payment is not pending (status: ${order.paymentStatus})`)
    }

    if (order.paymentMethod !== 'BANK_TRANSFER') {
      throw new Error('Can only reject Bank Transfer payments')
    }

    const now = Date.now()

    // Update order
    await ctx.db.patch(order._id, {
      paymentStatus: 'REJECTED',
      verifiedBy: args.adminId,
      verifiedAt: now,
      updatedAt: now,
    })

    // Restore stock since payment was rejected
    for (const item of order.items) {
      const products = await ctx.db.query('products').collect()
      const product = products.find((p) => p.productId === item.productId)
      if (product) {
        await ctx.db.patch(product._id, {
          stockLevel: product.stockLevel + item.quantity,
          updatedAt: now,
        })
      }
    }

    // Log rejection
    await ctx.db.insert('auditLogs', {
      logId: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'PAYMENT_REJECTED',
      adminId: args.adminId,
      targetId: args.orderId,
      metadata: { reason: args.reason, amount: order.totalAmount },
      timestamp: now,
    })

    return { success: true }
  },
})

/**
 * Get verification history
 */
export const getVerificationHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50

    const approved = await ctx.db
      .query('auditLogs')
      .withIndex('by_action', (q) => q.eq('action', 'PAYMENT_APPROVED'))
      .collect()

    const rejected = await ctx.db
      .query('auditLogs')
      .withIndex('by_action', (q) => q.eq('action', 'PAYMENT_REJECTED'))
      .collect()

    const allLogs = [...approved, ...rejected]
    allLogs.sort((a, b) => b.timestamp - a.timestamp)

    return allLogs.slice(0, limit)
  },
})

