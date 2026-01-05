import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

/**
 * Create a new order
 * Stock is deducted immediately upon order creation
 */
export const create = mutation({
  args: {
    orderId: v.string(),
    customerId: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    paymentMethod: v.union(v.literal('COD'), v.literal('BANK_TRANSFER')),
    totalAmount: v.number(),
    items: v.array(
      v.object({
        productId: v.string(),
        productName: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        subtotal: v.number(),
      })
    ),
    deliveryAddress: v.object({
      label: v.optional(v.string()),
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      coordinates: v.object({
        lat: v.number(),
        lng: v.number(),
      }),
      instructions: v.optional(v.string()),
    }),
    deliveryNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Build search tokens for fast search
    const searchTokens = [
      args.orderId,
      args.customerName.toLowerCase(),
      args.customerPhone.replace(/\D/g, ''), // Remove non-digits
    ].join(' ')

    // Determine initial status based on payment method
    const status =
      args.paymentMethod === 'COD'
        ? 'PENDING_DISPATCH'
        : 'PENDING_VERIFICATION'

    const paymentStatus = args.paymentMethod === 'COD' ? 'VERIFIED' : 'PENDING'

    const now = Date.now()

    // Check stock availability BEFORE creating order (Convex mutations are atomic)
    for (const item of args.items) {
      const products = await ctx.db.query('products').collect()
      const product = products.find((p) => p.productId === item.productId)

      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }

      if (product.stockLevel < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.stockLevel}, Requested: ${item.quantity}`
        )
      }
    }

    // Create order and deduct stock (Convex mutations are atomic)
    // Stock was already validated above, so we can safely deduct now
    const orderId = await ctx.db.insert('orders', {
      orderId: args.orderId,
      customerId: args.customerId,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      status,
      paymentMethod: args.paymentMethod,
      paymentStatus,
      totalAmount: args.totalAmount,
      items: args.items,
      deliveryAddress: args.deliveryAddress,
      deliveryNotes: args.deliveryNotes,
      searchTokens,
      createdAt: now,
      updatedAt: now,
    })

    // Deduct stock immediately (stock deduction happens at order creation)
    // Stock was already validated, so this is safe
    for (const item of args.items) {
      const products = await ctx.db.query('products').collect()
      const product = products.find((p) => p.productId === item.productId)

      if (product) {
        await ctx.db.patch(product._id, {
          stockLevel: product.stockLevel - item.quantity,
          updatedAt: now,
        })
      }
    }

    // Create audit log
    await ctx.db.insert('auditLogs', {
      logId: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'ORDER_STATUS_CHANGED',
      adminId: 'system', // System-created order
      targetId: args.orderId,
      metadata: { status, paymentMethod: args.paymentMethod },
      timestamp: now,
    })

    return orderId
  },
})

/**
 * Get all orders with optional filters
 */
export const getAll = query({
  args: {
    status: v.optional(
      v.union(
        v.literal('PENDING_DISPATCH'),
        v.literal('PENDING_VERIFICATION'),
        v.literal('PROCESSING'),
        v.literal('ASSIGNED'),
        v.literal('EN_ROUTE'),
        v.literal('DELIVERED'),
        v.literal('FAILED'),
        v.literal('RETURNED'),
        v.literal('CANCELLED')
      )
    ),
    paymentStatus: v.optional(
      v.union(v.literal('PENDING'), v.literal('VERIFIED'), v.literal('REJECTED'))
    ),
    driverId: v.optional(v.string()),
    customerId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let orders

    if (args.status) {
      orders = await ctx.db
        .query('orders')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .collect()
    } else if (args.paymentStatus) {
      orders = await ctx.db
        .query('orders')
        .withIndex('by_paymentStatus', (q) =>
          q.eq('paymentStatus', args.paymentStatus!)
        )
        .collect()
    } else if (args.driverId) {
      orders = await ctx.db
        .query('orders')
        .withIndex('by_driverId', (q) =>
          q.eq('assignedDriverId', args.driverId!)
        )
        .collect()
    } else if (args.customerId) {
      orders = await ctx.db
        .query('orders')
        .withIndex('by_customerId', (q) =>
          q.eq('customerId', args.customerId!)
        )
        .collect()
    } else {
      // Default: get all orders sorted by createdAt
      orders = await ctx.db.query('orders').collect()
    }

    // Orders are already filtered by the index used above
    // Only apply additional filters if they weren't used in the index query
    let filtered = orders
    if (args.paymentStatus && !args.status && !args.driverId && !args.customerId) {
      // Already filtered by paymentStatus index - no additional filter needed
    } else if (args.paymentStatus) {
      filtered = filtered.filter((o) => o.paymentStatus === args.paymentStatus)
    }
    
    if (args.driverId && !args.status && !args.paymentStatus && !args.customerId) {
      // Already filtered by driverId index - no additional filter needed
    } else if (args.driverId) {
      filtered = filtered.filter((o) => o.assignedDriverId === args.driverId)
    }
    
    if (args.customerId && !args.status && !args.paymentStatus && !args.driverId) {
      // Already filtered by customerId index - no additional filter needed
    } else if (args.customerId) {
      filtered = filtered.filter((o) => o.customerId === args.customerId)
    }

    // Sort by createdAt descending
    filtered.sort((a, b) => b.createdAt - a.createdAt)

    // Apply limit
    if (args.limit) {
      return filtered.slice(0, args.limit)
    }

    return filtered
  },
})

/**
 * Get order by ID
 */
export const getById = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    // Search all orders for matching orderId
    const allOrders = await ctx.db.query('orders').collect()
    return allOrders.find((o) => o.orderId === args.orderId)
  },
})

/**
 * Update order status with stock management and COD wallet logic
 * See TECHNICAL_GOTCHAS.md for state machine rules
 */
export const updateStatus = mutation({
  args: {
    orderId: v.string(),
    newStatus: v.union(
      v.literal('PENDING_DISPATCH'),
      v.literal('PENDING_VERIFICATION'),
      v.literal('PROCESSING'),
      v.literal('ASSIGNED'),
      v.literal('EN_ROUTE'),
      v.literal('DELIVERED'),
      v.literal('FAILED'),
      v.literal('RETURNED'),
      v.literal('CANCELLED')
    ),
    adminId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find order by orderId
    const allOrders = await ctx.db.query('orders').collect()
    const order = allOrders.find((o) => o.orderId === args.orderId)

    if (!order) {
      throw new Error(`Order ${args.orderId} not found`)
    }

    const now = Date.now()

    // STOCK RESTORATION LOGIC
    if (
      args.newStatus === 'FAILED' ||
      args.newStatus === 'RETURNED' ||
      args.newStatus === 'CANCELLED'
    ) {
      // Restore stock for all items
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

      // Log stock restoration
      await ctx.db.insert('auditLogs', {
        logId: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
        action: 'STOCK_RESTOCKED',
        adminId: args.adminId || 'system',
        targetId: args.orderId,
        metadata: { reason: args.newStatus, items: order.items },
        timestamp: now,
      })
    }

    // COD WALLET INCREASE LOGIC
    if (args.newStatus === 'DELIVERED' && order.paymentMethod === 'COD') {
      if (!order.assignedDriverId) {
        throw new Error('Cannot deliver order without assigned driver')
      }

      // assignedDriverId is the driverId, not clerkId
      const drivers = await ctx.db.query('drivers').collect()
      const driver = drivers.find((d) => d.driverId === order.assignedDriverId)
      
      if (driver) {
        await ctx.db.patch(driver._id, {
          codWallet: driver.codWallet + order.totalAmount,
        })
      } else {
        throw new Error(`Driver ${order.assignedDriverId} not found`)
      }
    }

    // UPDATE ORDER STATUS
    await ctx.db.patch(order._id, {
      status: args.newStatus,
      updatedAt: now,
    })

    // LOG STATUS CHANGE
    await ctx.db.insert('auditLogs', {
      logId: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'ORDER_STATUS_CHANGED',
      adminId: args.adminId || 'system',
      targetId: args.orderId,
      metadata: { from: order.status, to: args.newStatus },
      timestamp: now,
    })

    return { success: true }
  },
})

/**
 * Search orders by search tokens (orderId, customerName, phone)
 */
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.searchTerm.toLowerCase().replace(/\D/g, '')

    // Search using the searchTokens index
    const orders = await ctx.db
      .query('orders')
      .withIndex('by_search')
      .collect()

    // Filter by search term
    return orders.filter((order) =>
      order.searchTokens.toLowerCase().includes(normalized)
    )
  },
})

/**
 * Cancel an order (allowed when status is PENDING_DISPATCH, PENDING_VERIFICATION, or PROCESSING)
 */
export const cancel = mutation({
  args: {
    orderId: v.string(),
    reason: v.optional(v.string()),
    cancelledBy: v.string(), // customerId or adminId
  },
  handler: async (ctx, args) => {
    const allOrders = await ctx.db.query('orders').collect()
    const order = allOrders.find((o) => o.orderId === args.orderId)

    if (!order) {
      throw new Error(`Order ${args.orderId} not found`)
    }

    // Check if cancellation is allowed
    const allowedStatuses = [
      'PENDING_DISPATCH',
      'PENDING_VERIFICATION',
      'PROCESSING',
    ]
    if (!allowedStatuses.includes(order.status)) {
      throw new Error(
        `Cannot cancel order with status ${order.status}. Only orders with status PENDING_DISPATCH, PENDING_VERIFICATION, or PROCESSING can be cancelled.`
      )
    }

    const now = Date.now()

    // Restore stock
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

    // Update order
    await ctx.db.patch(order._id, {
      status: 'CANCELLED',
      cancelledAt: now,
      cancellationReason: args.reason,
      cancelledBy: args.cancelledBy,
      updatedAt: now,
    })

    // Log cancellation
    await ctx.db.insert('auditLogs', {
      logId: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'ORDER_CANCELLED',
      adminId: args.cancelledBy,
      targetId: args.orderId,
      metadata: { reason: args.reason },
      timestamp: now,
    })

    return { success: true }
  },
})

/**
 * Mark order as failed with reason
 */
export const markFailed = mutation({
  args: {
    orderId: v.string(),
    reason: v.string(),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const allOrders = await ctx.db.query('orders').collect()
    const order = allOrders.find((o) => o.orderId === args.orderId)

    if (!order) {
      throw new Error(`Order ${args.orderId} not found`)
    }

    const now = Date.now()

    // Restore stock
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

    // Update order
    await ctx.db.patch(order._id, {
      status: 'FAILED',
      failedReason: args.reason,
      updatedAt: now,
    })

    // Log
    await ctx.db.insert('auditLogs', {
      logId: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'ORDER_STATUS_CHANGED',
      adminId: args.adminId,
      targetId: args.orderId,
      metadata: { status: 'FAILED', reason: args.reason },
      timestamp: now,
    })

    return { success: true }
  },
})

/**
 * Mark order as returned with reason
 */
export const markReturned = mutation({
  args: {
    orderId: v.string(),
    reason: v.string(),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const allOrders = await ctx.db.query('orders').collect()
    const order = allOrders.find((o) => o.orderId === args.orderId)

    if (!order) {
      throw new Error(`Order ${args.orderId} not found`)
    }

    const now = Date.now()

    // Restore stock
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

    // Update order
    await ctx.db.patch(order._id, {
      status: 'RETURNED',
      returnReason: args.reason,
      updatedAt: now,
    })

    // Log
    await ctx.db.insert('auditLogs', {
      logId: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'ORDER_STATUS_CHANGED',
      adminId: args.adminId,
      targetId: args.orderId,
      metadata: { status: 'RETURNED', reason: args.reason },
      timestamp: now,
    })

    return { success: true }
  },
})

