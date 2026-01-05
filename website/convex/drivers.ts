import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

/**
 * Get all drivers
 */
export const getAll = query({
  args: {
    isOnDuty: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.isOnDuty !== undefined) {
      return await ctx.db
        .query('drivers')
        .withIndex('by_isOnDuty', (q) => q.eq('isOnDuty', args.isOnDuty!))
        .collect()
    }
    return await ctx.db.query('drivers').collect()
  },
})

/**
 * Get driver by ID
 */
export const getById = query({
  args: { driverId: v.string() },
  handler: async (ctx, args) => {
    const drivers = await ctx.db.query('drivers').collect()
    return drivers.find((d) => d.driverId === args.driverId)
  },
})

/**
 * Get driver by Clerk ID
 */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const drivers = await ctx.db
      .query('drivers')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkId))
      .first()
    return drivers
  },
})

/**
 * Get available (on-duty) drivers
 */
export const getAvailable = query({
  handler: async (ctx) => {
    return await ctx.db
      .query('drivers')
      .withIndex('by_isOnDuty', (q) => q.eq('isOnDuty', true))
      .collect()
  },
})

/**
 * Create a new driver
 */
export const create = mutation({
  args: {
    driverId: v.string(),
    clerkId: v.string(),
    name: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if driverId already exists
    const existingDriverId = await ctx.db
      .query('drivers')
      .filter((q) => q.eq(q.field('driverId'), args.driverId))
      .first()
    
    if (existingDriverId) {
      throw new Error(`Driver ID ${args.driverId} already exists`)
    }

    // Check if clerkId is already registered as a driver
    const existingClerkId = await ctx.db
      .query('drivers')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkId))
      .first()
    
    if (existingClerkId) {
      throw new Error('This Clerk user is already registered as a driver')
    }

    const driverId = await ctx.db.insert('drivers', {
      driverId: args.driverId,
      clerkId: args.clerkId,
      name: args.name,
      phone: args.phone,
      isOnDuty: false,
      codWallet: 0,
      createdAt: Date.now(),
    })
    return driverId
  },
})

/**
 * Update driver information
 */
export const update = mutation({
  args: {
    driverId: v.string(),
    name: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const drivers = await ctx.db.query('drivers').collect()
    const driver = drivers.find((d) => d.driverId === args.driverId)

    if (!driver) {
      throw new Error(`Driver ${args.driverId} not found`)
    }

    await ctx.db.patch(driver._id, {
      name: args.name,
      phone: args.phone,
    })

    return { success: true }
  },
})

/**
 * Update driver's on-duty status
 */
export const updateDutyStatus = mutation({
  args: {
    driverId: v.string(),
    isOnDuty: v.boolean(),
  },
  handler: async (ctx, args) => {
    const drivers = await ctx.db.query('drivers').collect()
    const driver = drivers.find((d) => d.driverId === args.driverId)

    if (!driver) {
      throw new Error(`Driver ${args.driverId} not found`)
    }

    await ctx.db.patch(driver._id, {
      isOnDuty: args.isOnDuty,
    })

    return { success: true }
  },
})

/**
 * Update driver's current location
 * Note: Driver App should throttle updates (20m or 30s minimum)
 */
export const updateLocation = mutation({
  args: {
    driverId: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const drivers = await ctx.db.query('drivers').collect()
    const driver = drivers.find((d) => d.driverId === args.driverId)

    if (!driver) {
      throw new Error(`Driver ${args.driverId} not found`)
    }

    const now = Date.now()

    await ctx.db.patch(driver._id, {
      currentLocation: {
        lat: args.location.lat,
        lng: args.location.lng,
        timestamp: now,
      },
      lastLocationUpdate: now,
    })

    return { success: true }
  },
})

/**
 * Get driver wallets (COD tracking)
 */
export const getWallets = query({
  handler: async (ctx) => {
    const drivers = await ctx.db.query('drivers').collect()
    
    // Get all settlement logs to find last settlement date
    const settlementLogs = await ctx.db
      .query('auditLogs')
      .withIndex('by_action', (q) => q.eq('action', 'DRIVER_SETTLED'))
      .collect()

    return drivers.map((d) => {
      // Find last settlement for this driver
      const driverSettlements = settlementLogs
        .filter((log) => log.targetId === d.driverId)
        .sort((a, b) => b.timestamp - a.timestamp)
      
      const lastSettlement = driverSettlements.length > 0 
        ? driverSettlements[0].timestamp 
        : null

      return {
        driverId: d.driverId,
        name: d.name,
        codWallet: d.codWallet,
        lastSettlement,
      }
    })
  },
})

/**
 * Settle driver wallet (reset COD balance)
 */
export const settleWallet = mutation({
  args: {
    driverId: v.string(),
    amount: v.optional(v.number()), // Optional partial settlement
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const drivers = await ctx.db.query('drivers').collect()
    const driver = drivers.find((d) => d.driverId === args.driverId)

    if (!driver) {
      throw new Error(`Driver ${args.driverId} not found`)
    }

    const settlementAmount = args.amount || driver.codWallet
    const newBalance = driver.codWallet - settlementAmount

    if (newBalance < 0) {
      throw new Error('Settlement amount exceeds wallet balance')
    }

    const now = Date.now()

    await ctx.db.patch(driver._id, {
      codWallet: newBalance,
    })

    // Log settlement
    await ctx.db.insert('auditLogs', {
      logId: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'DRIVER_SETTLED',
      adminId: args.adminId,
      targetId: args.driverId,
      metadata: { amount: settlementAmount, previousBalance: driver.codWallet },
      timestamp: now,
    })

    return { success: true, newBalance }
  },
})

