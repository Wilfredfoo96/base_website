# Technical Gotchas & Solutions

## Quick Reference for Implementation

---

## 🗺️ A. Mapbox + Next.js Server Components

### Problem
Mapbox GL JS requires `window` object, which doesn't exist during SSR.

### Solution
```typescript
// components/dashboard/LiveFleetMap.tsx
"use client"
import dynamic from 'next/dynamic'

const MapboxMap = dynamic(() => import('./MapboxMap'), {
  ssr: false,
  loading: () => <div>Loading map...</div>
})

export default function LiveFleetMap() {
  return <MapboxMap />
}
```

### Implementation Checklist
- [ ] Create map component in separate file
- [ ] Add `"use client"` directive at top
- [ ] Wrap in `next/dynamic` with `ssr: false`
- [ ] Add loading state for better UX

---

## 📍 B. Driver Location Throttling

### Problem
20 drivers × 12 updates/min = 240 writes/min = log noise + unnecessary costs

### Solution (Driver App Implementation)
Only send location update if:
- ✅ Driver moved **>20 meters** from last update, OR
- ✅ **30 seconds** passed since last update

### Implementation Logic
```typescript
// In Driver App (when you build it)
const shouldUpdateLocation = (
  currentLocation: { lat, lng },
  lastLocation: { lat, lng, timestamp }
) => {
  const distance = calculateDistance(currentLocation, lastLocation)
  const timeSinceUpdate = Date.now() - lastLocation.timestamp
  
  return distance > 20 || timeSinceUpdate > 30000
}
```

### Notes
- This is a **Driver App requirement**, not Admin Portal
- Document this for Driver App development
- Reduces writes by ~80% for stationary drivers

---

## 🔒 C. Stale Data Prevention in Route Creation

### Problem
Admin builds route → Customer cancels order → Admin creates manifest → Error!

### Solution
Add validation in `createManifest` function:

```typescript
export const createManifest = mutation({
  args: {
    driverId: v.id("drivers"),
    orderIds: v.array(v.id("orders"))
  },
  handler: async (ctx, args) => {
    // 1. Validate driver is on-duty
    const driver = await ctx.db.get(args.driverId)
    if (!driver.isOnDuty) {
      throw new Error("Driver is not on-duty")
    }
    
    // 2. CRITICAL: Re-query orders to check for stale data
    const orders = await Promise.all(
      args.orderIds.map(id => ctx.db.get(id))
    )
    
    // 3. Validate each order
    for (const order of orders) {
      if (order.status === "CANCELLED") {
        throw new Error(`Order ${order.orderId} was cancelled`)
      }
      if (order.assignedDriverId && order.assignedDriverId !== args.driverId) {
        throw new Error(`Order ${order.orderId} already assigned to another driver`)
      }
      if (!["PENDING_DISPATCH", "PROCESSING", "ASSIGNED"].includes(order.status)) {
        throw new Error(`Order ${order.orderId} cannot be assigned (status: ${order.status})`)
      }
    }
    
    // 4. Only then create the route
    const routeId = await ctx.db.insert("routes", {
      driverId: args.driverId,
      orderIds: args.orderIds,
      status: "DRAFT",
      createdAt: Date.now()
    })
    
    // 5. Update orders
    for (const orderId of args.orderIds) {
      await ctx.db.patch(orderId, {
        assignedDriverId: args.driverId,
        status: "ASSIGNED",
        updatedAt: Date.now()
      })
    }
    
    return routeId
  }
})
```

### Implementation Checklist
- [ ] Query orders fresh before manifest creation
- [ ] Check for CANCELLED status
- [ ] Check for existing assignment to other driver
- [ ] Validate order status allows assignment
- [ ] Show user-friendly error messages

---

## 🔄 D. Order Status State Machine

### Critical Rules

#### Stock Deduction
- ✅ **Happens at Order Placement** (immediate, when order is created)
- ❌ NOT at DELIVERED status

#### Stock Restoration
- ✅ Happens at transition to `FAILED`
- ✅ Happens at transition to `RETURNED`
- ✅ Happens at transition to `CANCELLED`

#### COD Wallet Increase
- ✅ Happens **strictly** at transition to `DELIVERED` (if `paymentMethod === COD`)
- ❌ NOT at any other status

### Implementation Example
```typescript
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    newStatus: v.string()
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) throw new Error("Order not found")
    
    // STOCK RESTORATION LOGIC
    if (newStatus === "FAILED" || newStatus === "RETURNED" || newStatus === "CANCELLED") {
      // Restore stock for all items
      for (const item of order.items) {
        const product = await ctx.db.get(item.productId)
        if (product) {
          await ctx.db.patch(item.productId, {
            stockLevel: product.stockLevel + item.quantity,
            updatedAt: Date.now()
          })
        }
      }
      
      // Log stock restoration
      await ctx.db.insert("auditLogs", {
        action: "STOCK_RESTOCKED",
        adminId: ctx.auth.getUserIdentity()?.tokenIdentifier || "system",
        targetId: args.orderId,
        metadata: { reason: newStatus, items: order.items },
        timestamp: Date.now()
      })
    }
    
    // COD WALLET INCREASE LOGIC
    if (newStatus === "DELIVERED" && order.paymentMethod === "COD") {
      if (!order.assignedDriverId) {
        throw new Error("Cannot deliver order without assigned driver")
      }
      
      const driver = await ctx.db.get(order.assignedDriverId)
      if (driver) {
        await ctx.db.patch(order.assignedDriverId, {
          codWallet: driver.codWallet + order.totalAmount,
          updatedAt: Date.now()
        })
      }
    }
    
    // UPDATE ORDER STATUS
    await ctx.db.patch(args.orderId, {
      status: newStatus,
      updatedAt: Date.now()
    })
    
    // LOG STATUS CHANGE
    await ctx.db.insert("auditLogs", {
      action: "ORDER_STATUS_CHANGED",
      adminId: ctx.auth.getUserIdentity()?.tokenIdentifier || "system",
      targetId: args.orderId,
      metadata: { from: order.status, to: newStatus },
      timestamp: Date.now()
    })
  }
})
```

### State Transition Diagram
```
Order Created → Stock Deducted (immediate)
     ↓
PENDING_DISPATCH / PENDING_VERIFICATION
     ↓
PROCESSING (payment approved)
     ↓
ASSIGNED (to driver)
     ↓
EN_ROUTE (driver started trip)
     ↓
DELIVERED → COD Wallet Increased (if COD)
     OR
FAILED → Stock Restored
     OR
RETURNED → Stock Restored
     OR
CANCELLED → Stock Restored
```

---

## 🔍 E. Search Optimization with searchTokens

### Problem
Searching across multiple fields (orderId, customerName, customerPhone) is slow.

### Solution
Combine fields into single `searchTokens` string for fast single-field search.

### Implementation
```typescript
// When creating an order
export const createOrder = mutation({
  args: { /* order data */ },
  handler: async (ctx, args) => {
    // Build search tokens
    const searchTokens = [
      args.orderId,
      args.customerName.toLowerCase(),
      args.customerPhone.replace(/\D/g, ''), // Remove non-digits
    ].join(' ')
    
    const orderId = await ctx.db.insert("orders", {
      ...args,
      searchTokens,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    
    return orderId
  }
})

// When searching
export const searchOrders = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.searchTerm.toLowerCase().replace(/\D/g, '')
    
    return await ctx.db
      .query("orders")
      .withIndex("by_search", q => 
        q.search("searchTokens", normalized)
      )
      .collect()
  }
})
```

### Usage
- User searches: "john" → finds orders with "john" in customerName
- User searches: "555-0199" → finds orders with that phone
- User searches: "ord_123" → finds order by ID
- All using single index query!

---

## 📋 Implementation Checklist

### Phase 1: Foundation
- [ ] Add `searchTokens` field to orders schema
- [ ] Add `by_search` index to orders table
- [ ] Update order creation to populate `searchTokens`

### Phase 2: Map Integration
- [ ] Create `LiveFleetMap.tsx` with `"use client"`
- [ ] Wrap in `next/dynamic` with `ssr: false`
- [ ] Test map loads correctly in production

### Phase 3: Route Management
- [ ] Add stale data validation to `createManifest`
- [ ] Test with concurrent order cancellation
- [ ] Add user-friendly error messages

### Phase 4: State Machine
- [ ] Implement stock deduction at order creation
- [ ] Implement stock restoration on FAILED/RETURNED/CANCELLED
- [ ] Implement COD wallet increase on DELIVERED
- [ ] Add comprehensive audit logging

### Phase 5: Driver App Requirements (Document)
- [ ] Document location throttling requirements
- [ ] Specify 20m / 30s thresholds
- [ ] Add to Driver App specification

---

## 🎯 Quick Reference

| Issue | Location | Solution |
|-------|----------|----------|
| Mapbox SSR error | Live Fleet Map | `"use client"` + `dynamic` import |
| Too many location writes | Driver App | Throttle: 20m or 30s |
| Stale route data | createManifest | Re-query orders before locking |
| Stock timing | updateOrderStatus | Deduct at creation, restore on failure |
| COD wallet timing | updateOrderStatus | Increase only at DELIVERED |
| Slow search | Global search | Use `searchTokens` field |

---

**Last Updated:** [Current Date]
**Status:** Ready for Implementation

