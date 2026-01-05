import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

/**
 * Get setting by key
 */
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first()
  },
})

/**
 * Get all settings
 */
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query('settings').collect()
  },
})

/**
 * Set or update setting
 */
export const set = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first()

    const now = Date.now()

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: now,
        updatedBy: args.updatedBy,
      })
      return { success: true, updated: true }
    } else {
      // Create new
      await ctx.db.insert('settings', {
        key: args.key,
        value: args.value,
        updatedAt: now,
        updatedBy: args.updatedBy,
      })
      return { success: true, updated: false }
    }
  },
})

/**
 * Delete setting
 */
export const remove = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first()

    if (setting) {
      await ctx.db.delete(setting._id)
      return { success: true }
    }

    return { success: false, message: 'Setting not found' }
  },
})

/**
 * Initialize default settings
 */
export const initializeDefaults = mutation({
  args: {
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    // Warehouse location (default to null, should be set by admin)
    const warehouse = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', 'warehouse_location'))
      .first()

    if (!warehouse) {
      await ctx.db.insert('settings', {
        key: 'warehouse_location',
        value: { lat: 0, lng: 0 }, // Should be set by admin
        updatedAt: now,
        updatedBy: args.adminId,
      })
    }

    // Bank details (default to empty, should be set by admin)
    const bankDetails = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', 'bank_details'))
      .first()

    if (!bankDetails) {
      await ctx.db.insert('settings', {
        key: 'bank_details',
        value: {
          bankName: '',
          accountNumber: '',
          accountName: '',
          routingNumber: '',
        },
        updatedAt: now,
        updatedBy: args.adminId,
      })
    }

    // Low stock threshold
    const threshold = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', 'low_stock_threshold'))
      .first()

    if (!threshold) {
      await ctx.db.insert('settings', {
        key: 'low_stock_threshold',
        value: 10,
        updatedAt: now,
        updatedBy: args.adminId,
      })
    }

    return { success: true }
  },
})

