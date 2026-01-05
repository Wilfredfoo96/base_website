import { v } from 'convex/values'
import { query } from './_generated/server'

/**
 * Get all audit logs
 */
export const getAll = query({
  args: {
    adminId: v.optional(v.string()),
    targetId: v.optional(v.string()),
    action: v.optional(
      v.union(
        v.literal('PAYMENT_APPROVED'),
        v.literal('PAYMENT_REJECTED'),
        v.literal('ORDER_ASSIGNED'),
        v.literal('ORDER_STATUS_CHANGED'),
        v.literal('ROUTE_CREATED'),
        v.literal('ROUTE_OPTIMIZED'),
        v.literal('DRIVER_SETTLED'),
        v.literal('STOCK_RESTOCKED'),
        v.literal('PRODUCT_CREATED'),
        v.literal('PRODUCT_UPDATED'),
        v.literal('ORDER_CANCELLED')
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logs

    if (args.adminId) {
      logs = await ctx.db
        .query('auditLogs')
        .withIndex('by_adminId', (q) => q.eq('adminId', args.adminId!))
        .collect()
    } else if (args.targetId) {
      logs = await ctx.db
        .query('auditLogs')
        .withIndex('by_targetId', (q) => q.eq('targetId', args.targetId!))
        .collect()
    } else if (args.action) {
      logs = await ctx.db
        .query('auditLogs')
        .withIndex('by_action', (q) => q.eq('action', args.action!))
        .collect()
    } else {
      logs = await ctx.db
        .query('auditLogs')
        .withIndex('by_timestamp')
        .collect()
    }

    // Logs are already filtered by index, no need for additional filtering
    let filtered = logs

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp)

    // Apply limit
    if (args.limit) {
      return filtered.slice(0, args.limit)
    }

    return filtered
  },
})

/**
 * Get recent activity (last N logs)
 */
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10
    const logs = await ctx.db
      .query('auditLogs')
      .withIndex('by_timestamp')
      .collect()

    // Sort by timestamp descending and take limit
    logs.sort((a, b) => b.timestamp - a.timestamp)
    return logs.slice(0, limit)
  },
})

/**
 * Get verification history (payment approvals/rejections)
 */
export const getVerificationHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50
    const logs = await ctx.db
      .query('auditLogs')
      .withIndex('by_action', (q) =>
        q.eq('action', 'PAYMENT_APPROVED')
      )
      .collect()

    const rejectedLogs = await ctx.db
      .query('auditLogs')
      .withIndex('by_action', (q) => q.eq('action', 'PAYMENT_REJECTED'))
      .collect()

    const allLogs = [...logs, ...rejectedLogs]
    allLogs.sort((a, b) => b.timestamp - a.timestamp)

    return allLogs.slice(0, limit)
  },
})

