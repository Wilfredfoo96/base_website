import { v } from 'convex/values'
import { query } from './_generated/server'

/**
 * Get settlement history (all DRIVER_SETTLED audit logs)
 */
export const getSettlementHistory = query({
  args: {
    driverId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all DRIVER_SETTLED logs
    const settlementLogs = await ctx.db
      .query('auditLogs')
      .withIndex('by_action', (q) => q.eq('action', 'DRIVER_SETTLED'))
      .collect()

    let filtered = settlementLogs

    // Filter by driverId if provided
    if (args.driverId) {
      filtered = filtered.filter((log) => log.targetId === args.driverId)
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

