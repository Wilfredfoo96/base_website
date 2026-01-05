import { v } from 'convex/values'
import { mutation } from './_generated/server'

/**
 * Migration: Fix existing customer records to match new schema
 * This migrates old customer records that have firstName/lastName to the new name field
 * and generates missing customerId and phone fields
 */
export const migrateCustomers = mutation({
  handler: async (ctx) => {
    const customers = await ctx.db.query('customers').collect()
    let migrated = 0
    let errors = 0

    for (const customer of customers) {
      try {
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
      } catch (error) {
        console.error(`Failed to migrate customer ${customer._id}:`, error)
        errors++
      }
    }

    return {
      success: true,
      migrated,
      errors,
      total: customers.length,
    }
  },
})

