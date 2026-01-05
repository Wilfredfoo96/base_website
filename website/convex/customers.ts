import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

/**
 * Get all customers
 */
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query('customers').collect()
  },
})

/**
 * Get customer by ID
 */
export const getById = query({
  args: { customerId: v.string() },
  handler: async (ctx, args) => {
    const customers = await ctx.db.query('customers').collect()
    return customers.find((c) => c.customerId === args.customerId)
  },
})

/**
 * Get customer by Clerk ID
 */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('customers')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkId))
      .first()
  },
})

/**
 * Create a new customer
 */
export const create = mutation({
  args: {
    customerId: v.string(),
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const customerId = await ctx.db.insert('customers', {
      customerId: args.customerId,
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      savedAddresses: [],
      createdAt: Date.now(),
    })
    return customerId
  },
})

/**
 * Migrate existing customer records to new schema format
 * Call this once to fix existing data
 */
export const migrateExistingCustomers = mutation({
  handler: async (ctx) => {
    const customers = await ctx.db.query('customers').collect()
    let migrated = 0

    for (const customer of customers) {
      const updates: any = {}

      // Generate customerId if missing
      if (!customer.customerId) {
        updates.customerId = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      // Convert firstName/lastName to name if needed
      if (!customer.name) {
        if (customer.firstName || customer.lastName) {
          updates.name = [customer.firstName, customer.lastName]
            .filter(Boolean)
            .join(' ')
            .trim() || 'Unknown Customer'
        } else {
          updates.name = 'Unknown Customer'
        }
      }

      // Set default phone if missing
      if (!customer.phone) {
        updates.phone = ''
      }

      // Set default savedAddresses if missing
      if (!customer.savedAddresses) {
        updates.savedAddresses = []
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(customer._id, updates)
        migrated++
      }
    }

    return {
      success: true,
      migrated,
      total: customers.length,
    }
  },
})

/**
 * Add saved address to customer
 */
export const addAddress = mutation({
  args: {
    customerId: v.string(),
    address: v.object({
      addressId: v.string(),
      label: v.string(),
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      coordinates: v.object({
        lat: v.number(),
        lng: v.number(),
      }),
      isDefault: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const customers = await ctx.db.query('customers').collect()
    const customer = customers.find((c) => c.customerId === args.customerId)

    if (!customer) {
      throw new Error(`Customer ${args.customerId} not found`)
    }

    const now = Date.now()
    const newAddress = {
      ...args.address,
      createdAt: now,
    }

    // If this is set as default, unset other defaults
    let addresses = [...customer.savedAddresses]
    if (args.address.isDefault) {
      addresses = addresses.map((addr) => ({ ...addr, isDefault: false }))
    }

    addresses.push(newAddress)

    await ctx.db.patch(customer._id, {
      savedAddresses: addresses,
    })

    return { success: true }
  },
})

/**
 * Update customer address
 */
export const updateAddress = mutation({
  args: {
    customerId: v.string(),
    addressId: v.string(),
    address: v.object({
      label: v.optional(v.string()),
      street: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zipCode: v.optional(v.string()),
      coordinates: v.optional(
        v.object({
          lat: v.number(),
          lng: v.number(),
        })
      ),
      isDefault: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const customers = await ctx.db.query('customers').collect()
    const customer = customers.find((c) => c.customerId === args.customerId)

    if (!customer) {
      throw new Error(`Customer ${args.customerId} not found`)
    }

    const addresses = customer.savedAddresses.map((addr) => {
      if (addr.addressId === args.addressId) {
        return {
          ...addr,
          ...args.address,
        }
      }
      // If setting new default, unset others
      if (args.address.isDefault) {
        return { ...addr, isDefault: false }
      }
      return addr
    })

    await ctx.db.patch(customer._id, {
      savedAddresses: addresses,
    })

    return { success: true }
  },
})

/**
 * Delete customer address
 */
export const deleteAddress = mutation({
  args: {
    customerId: v.string(),
    addressId: v.string(),
  },
  handler: async (ctx, args) => {
    const customers = await ctx.db.query('customers').collect()
    const customer = customers.find((c) => c.customerId === args.customerId)

    if (!customer) {
      throw new Error(`Customer ${args.customerId} not found`)
    }

    const addresses = customer.savedAddresses.filter(
      (addr) => addr.addressId !== args.addressId
    )

    await ctx.db.patch(customer._id, {
      savedAddresses: addresses,
    })

    return { success: true }
  },
})

