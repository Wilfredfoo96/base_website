import { v } from 'convex/values'
import { query } from './_generated/server'

/**
 * Get stock history (all stock-related audit logs)
 */
export const getStockHistory = query({
  args: {
    productId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all STOCK_RESTOCKED logs
    const restockLogs = await ctx.db
      .query('auditLogs')
      .withIndex('by_action', (q) => q.eq('action', 'STOCK_RESTOCKED'))
      .collect()

    let filtered = restockLogs

    // Filter by productId if provided
    if (args.productId) {
      filtered = filtered.filter((log) => log.targetId === args.productId)
    }

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp)

    // Apply limit
    if (args.limit) {
      return filtered.slice(0, args.limit)
    }

    return filtered
  },
})

