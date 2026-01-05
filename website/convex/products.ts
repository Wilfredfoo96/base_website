import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

/**
 * Get all products
 */
export const getAll = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let products

    if (args.category) {
      products = await ctx.db
        .query('products')
        .withIndex('by_category', (q) => q.eq('category', args.category))
        .collect()
    } else {
      products = await ctx.db.query('products').collect()
    }

    // Apply limit
    if (args.limit) {
      return products.slice(0, args.limit)
    }

    return products
  },
})

/**
 * Get product by ID
 */
export const getById = query({
  args: { productId: v.string() },
  handler: async (ctx, args) => {
    const products = await ctx.db.query('products').collect()
    return products.find((p) => p.productId === args.productId)
  },
})

/**
 * Get product by SKU
 */
export const getBySku = query({
  args: { sku: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('products')
      .withIndex('by_sku', (q) => q.eq('sku', args.sku))
      .first()
  },
})

/**
 * Get low stock products (below threshold)
 */
export const getLowStock = query({
  args: { threshold: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const threshold = args.threshold || 10
    const products = await ctx.db.query('products').collect()
    return products.filter((p) => p.stockLevel < threshold)
  },
})

/**
 * Create a new product
 */
export const create = mutation({
  args: {
    productId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    sku: v.string(),
    imageUrl: v.optional(v.string()),
    stockLevel: v.number(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if SKU already exists
    const existing = await ctx.db
      .query('products')
      .withIndex('by_sku', (q) => q.eq('sku', args.sku))
      .first()

    if (existing) {
      throw new Error(`Product with SKU ${args.sku} already exists`)
    }

    const now = Date.now()
    const productId = await ctx.db.insert('products', {
      productId: args.productId,
      name: args.name,
      description: args.description,
      price: args.price,
      sku: args.sku,
      imageUrl: args.imageUrl,
      stockLevel: args.stockLevel,
      category: args.category,
      createdAt: now,
      updatedAt: now,
    })

    // Log creation
    await ctx.db.insert('auditLogs', {
      logId: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'PRODUCT_CREATED',
      adminId: 'system',
      targetId: args.productId,
      metadata: { name: args.name, sku: args.sku },
      timestamp: now,
    })

    return productId
  },
})

/**
 * Update product
 */
export const update = mutation({
  args: {
    productId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db.query('products').collect()
    const product = products.find((p) => p.productId === args.productId)

    if (!product) {
      throw new Error(`Product ${args.productId} not found`)
    }

    const updates: any = {
      updatedAt: Date.now(),
    }

    if (args.name !== undefined) updates.name = args.name
    if (args.description !== undefined) updates.description = args.description
    if (args.price !== undefined) updates.price = args.price
    if (args.imageUrl !== undefined) updates.imageUrl = args.imageUrl
    if (args.category !== undefined) updates.category = args.category

    await ctx.db.patch(product._id, updates)

    // Log update
    await ctx.db.insert('auditLogs', {
      logId: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'PRODUCT_UPDATED',
      adminId: args.adminId,
      targetId: args.productId,
      metadata: updates,
      timestamp: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Delete product
 */
export const remove = mutation({
  args: {
    productId: v.string(),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db.query('products').collect()
    const product = products.find((p) => p.productId === args.productId)

    if (!product) {
      throw new Error(`Product ${args.productId} not found`)
    }

    await ctx.db.delete(product._id)

    return { success: true }
  },
})

/**
 * Restock product
 */
export const restock = mutation({
  args: {
    productId: v.string(),
    quantity: v.number(),
    reason: v.optional(v.string()),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db.query('products').collect()
    const product = products.find((p) => p.productId === args.productId)

    if (!product) {
      throw new Error(`Product ${args.productId} not found`)
    }

    const now = Date.now()

    await ctx.db.patch(product._id, {
      stockLevel: product.stockLevel + args.quantity,
      updatedAt: now,
    })

    // Log restock
    await ctx.db.insert('auditLogs', {
      logId: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'STOCK_RESTOCKED',
      adminId: args.adminId,
      targetId: args.productId,
      metadata: {
        quantity: args.quantity,
        reason: args.reason,
        newStockLevel: product.stockLevel + args.quantity,
      },
      timestamp: now,
    })

    return { success: true, newStockLevel: product.stockLevel + args.quantity }
  },
})

