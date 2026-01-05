# Admin Portal Implementation Plan

## Overview
This document outlines the complete implementation plan for the Admin Portal of the Logistics Management System. The portal will be built using Next.js 14, Convex (backend), Clerk (authentication), and Tailwind CSS.

## ✅ Plan Review Status
**Last Reviewed:** [Current Date]  
**Status:** Reviewed and Corrected

### Key Corrections Made:
- ✅ Fixed order status enum to match Functions.md exactly
- ✅ Added missing order fields (failedReason, returnReason, customerName, customerPhone)
- ✅ Defined complete order items structure
- ✅ Defined delivery address structure with coordinates
- ✅ Defined customer saved addresses with labels
- ✅ Fixed order board columns to match actual statuses
- ✅ Added settings table for system configuration
- ✅ Added stock restoration logic for RETURNED/FAILED orders
- ✅ Added cancellation support
- ✅ Completed audit log action types
- ✅ Added warehouse location requirement
- ✅ Specified image storage requirements

### Technical Refinements Added:
- ✅ Added `searchTokens` field for optimized search (orderId + customerName + customerPhone)
- ✅ Mapbox + Next.js SSR fix (use client + dynamic import)
- ✅ Driver location throttling strategy (20m or 30s minimum)
- ✅ Stale data prevention in createManifest (validate orders before locking)
- ✅ Order status state machine documentation (stock deduct/restore, COD wallet rules)

**See PLAN_REVIEW.md for detailed review notes.**

---

## Phase 1: Foundation & Data Models

### 1.1 Database Schema (Convex)
**Priority: CRITICAL** | **Estimated Time: 2-3 days**

#### Tables to Create:
- **orders** - Core order management
  - `orderId` (string, unique)
  - `customerId` (string, reference)
  - `customerName` (string - denormalized for quick display)
  - `customerPhone` (string - denormalized for quick access)
  - `status` (enum: PENDING_DISPATCH, PENDING_VERIFICATION, PROCESSING, ASSIGNED, EN_ROUTE, DELIVERED, FAILED, RETURNED)
  - `paymentMethod` (enum: COD, BANK_TRANSFER)
  - `paymentStatus` (enum: PENDING, VERIFIED, REJECTED)
  - `paymentProofUrl` (optional string)
  - `totalAmount` (number)
  - `items` (array of item objects: {productId, productName, quantity, unitPrice, subtotal})
  - `deliveryAddress` (object: {label, street, city, state, zipCode, coordinates: {lat, lng}, instructions})
  - `deliveryNotes` (optional string)
  - `assignedDriverId` (optional string)
  - `routePosition` (number - stop sequence in manifest)
  - `proofOfDeliveryUrl` (optional string)
  - `failedReason` (optional string - "Customer Unreachable", "Wrong Address", "Gate Locked", etc.)
  - `returnReason` (optional string - "Damaged", "Wrong Item", "Customer Refused", etc.)
  - `cancelledAt` (optional number)
  - `cancellationReason` (optional string)
  - `cancelledBy` (optional string - customerId or adminId)
  - `createdAt` (number)
  - `updatedAt` (number)
  - `verifiedBy` (optional string - admin clerkId)
  - `verifiedAt` (optional number)
  - `searchTokens` (string - combined orderId, customerName, customerPhone for fast search)

- **drivers** - Driver management
  - `driverId` (string, unique)
  - `clerkId` (string, reference to users)
  - `name` (string)
  - `phone` (string)
  - `isOnDuty` (boolean)
  - `currentLocation` (optional object: {lat, lng, timestamp})
  - `codWallet` (number - total cash held)
  - `lastLocationUpdate` (optional number)
  - `createdAt` (number)

- **products** - Product catalog
  - `productId` (string, unique)
  - `name` (string)
  - `description` (optional string)
  - `price` (number)
  - `sku` (string, unique)
  - `imageUrl` (optional string)
  - `stockLevel` (number)
  - `category` (optional string)
  - `createdAt` (number)
  - `updatedAt` (number)

- **routes** - Route/Manifest management
  - `routeId` (string, unique)
  - `driverId` (string)
  - `orderIds` (array of strings - ordered sequence)
  - `status` (enum: DRAFT, ACTIVE, COMPLETED)
  - `createdAt` (number)
  - `startedAt` (optional number)
  - `completedAt` (optional number)

- **auditLogs** - Security and tracking
  - `logId` (string, unique)
  - `action` (enum: PAYMENT_APPROVED, PAYMENT_REJECTED, ORDER_ASSIGNED, ORDER_STATUS_CHANGED, ROUTE_CREATED, ROUTE_OPTIMIZED, DRIVER_SETTLED, STOCK_RESTOCKED, PRODUCT_CREATED, PRODUCT_UPDATED, ORDER_CANCELLED)
  - `adminId` (string - clerkId)
  - `targetId` (string - orderId, driverId, productId, etc.)
  - `metadata` (optional object - additional context)
  - `timestamp` (number)

- **customers** - Customer information
  - `customerId` (string, unique)
  - `clerkId` (string, reference)
  - `name` (string)
  - `email` (string)
  - `phone` (string)
  - `savedAddresses` (array of address objects: {addressId, label, street, city, state, zipCode, coordinates: {lat, lng}, isDefault, createdAt})
  - `createdAt` (number)

- **settings** - System configuration
  - `key` (string, unique - e.g., "bank_details", "warehouse_location")
  - `value` (any - flexible value type)
  - `updatedAt` (number)
  - `updatedBy` (optional string - admin clerkId)

#### Indexes Needed:
- Orders: by_status, by_paymentStatus, by_driverId, by_customerId, by_createdAt, by_assignedDriverId, by_search (on searchTokens)
- Drivers: by_clerkId, by_isOnDuty
- Products: by_sku, by_category
- Routes: by_driverId, by_status
- AuditLogs: by_adminId, by_timestamp, by_targetId, by_action
- Settings: by_key

---

## Phase 2: Core Dashboard Features

### 2.1 Dashboard Overview Page
**Priority: HIGH** | **Estimated Time: 3-4 days**

**Location:** `/dashboard/page.tsx` (replace existing)

#### Components Needed:
1. **End-of-Day Summary Card**
   - Time range selector: Today, This Week, This Month, Custom Range
   - Total orders delivered vs. failed
   - Total Bank Transfer verified amount
   - Total COD collected amount
   - Visual chart (bar/line graph)
   - Comparison with previous period

2. **Live Fleet Map**
   - Integration with map library (Google Maps / Mapbox / Leaflet)
   - Real-time markers for all `isOnDuty: true` drivers
   - Show driver name and last update time
   - Auto-refresh every 30 seconds
   - **⚠️ Must use `"use client"` and `next/dynamic` with `ssr: false`** (see Technical Considerations)

3. **Quick Stats Cards**
   - Pending verification orders count
   - Active drivers count
   - Orders in transit count
   - Low stock alerts

4. **Recent Activity Feed**
   - Last 10 audit log entries
   - Real-time updates

**Convex Functions:**
- `getDashboardStats` - Aggregate daily stats
- `getActiveDrivers` - Get all on-duty drivers with locations
- `getRecentActivity` - Get recent audit logs

---

### 2.2 Order Management Board
**Priority: CRITICAL** | **Estimated Time: 4-5 days**

**Location:** `/dashboard/orders/page.tsx`

#### Features:
1. **Kanban Board View** (Default)
   - Columns: Pending Verification, Ready to Assign, Assigned, Out for Delivery, Completed, Failed, Returned
   - Drag-and-drop between columns (updates status)
   - Each card shows: Order ID, Customer Name, Amount, Payment Method, Status Badge

2. **List View** (Toggle option)
   - Sortable table
   - Filters: Status, Payment Method, Date Range, Driver, Customer Name, Order ID, Amount Range
   - Search: By Order ID, Customer Name

3. **Order Detail Modal**
   - Full order information
   - Customer details (name, phone, email)
   - Items list with quantities and prices
   - Delivery address with map pin
   - Status history timeline
   - Proof of delivery image (if delivered)
   - Failed/Return reason (if applicable)
   - Cancellation details (if cancelled)

**Components:**
- `OrderBoard.tsx` - Main kanban board
- `OrderCard.tsx` - Individual order card
- `OrderDetailModal.tsx` - Order details popup
- `OrderFilters.tsx` - Filter controls
- `OrderSearch.tsx` - Global search using searchTokens field

**Convex Functions:**
- `getOrders` - Query orders with filters
- `updateOrderStatus` - Change order status (with stock management - **see State Machine below**)
- `getOrderDetails` - Get full order info
- `cancelOrder` - Cancel order (allowed when status is PENDING_DISPATCH, PENDING_VERIFICATION, or PROCESSING; restore stock if needed)
- `markOrderFailed` - Mark as failed with reason
- `markOrderReturned` - Mark as returned with reason

**⚠️ CRITICAL: Order Status State Machine**
The `updateOrderStatus` function must enforce this logic:

**Stock Deduction:**
- ✅ Happens at **Order Placement** (immediate) - when order is created
- ❌ NOT at DELIVERED status

**Stock Restoration:**
- ✅ Happens at transition to `FAILED`
- ✅ Happens at transition to `RETURNED`
- ✅ Happens at transition to `CANCELLED`

**COD Wallet Increase:**
- ✅ Happens **strictly** at transition to `DELIVERED` (if `paymentMethod === COD`)
- ❌ NOT at any other status

**State Transition Rules:**
```
Order Created → Stock Deducted (immediate)
Status → FAILED → Stock Restored
Status → RETURNED → Stock Restored
Status → CANCELLED → Stock Restored
Status → DELIVERED → COD Wallet Increased (if COD)
```

**Implementation Example:**
```typescript
export const updateOrderStatus = mutation({
  args: { orderId: v.id("orders"), newStatus: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    
    // Stock restoration logic
    if (newStatus === "FAILED" || newStatus === "RETURNED" || newStatus === "CANCELLED") {
      // Restore stock for all items
      for (const item of order.items) {
        await restoreStock(ctx, item.productId, item.quantity)
      }
    }
    
    // COD wallet increase logic
    if (newStatus === "DELIVERED" && order.paymentMethod === "COD") {
      await increaseDriverCODWallet(ctx, order.assignedDriverId, order.totalAmount)
    }
    
    // Update order status
    await ctx.db.patch(args.orderId, { status: newStatus, updatedAt: Date.now() })
  }
})
```

---

### 2.3 Bank Transfer Verification
**Priority: CRITICAL** | **Estimated Time: 3-4 days**

**Location:** `/dashboard/verification/page.tsx`

#### Features:
1. **Pending Orders List**
   - Orders with `paymentStatus: PENDING` and `paymentMethod: BANK_TRANSFER`
   - Shows: Order ID, Customer, Amount, Uploaded At

2. **Verification Interface**
   - Click order → Modal opens
   - Display uploaded payment proof image (full screen)
   - Action buttons: "Approve Payment" / "Reject Payment"
   - Rejection reason field (optional)

3. **Audit Trail**
   - Show who verified what and when
   - Filterable by admin, date

**Components:**
- `VerificationQueue.tsx` - List of pending verifications
- `PaymentProofModal.tsx` - Image viewer with approve/reject
- `VerificationHistory.tsx` - Audit log table

**Convex Functions:**
- `getPendingVerifications` - Get unverified bank transfer orders
- `approvePayment` - Approve payment (updates order, creates audit log)
- `rejectPayment` - Reject payment (updates order, creates audit log)
- `getVerificationHistory` - Get audit logs for payments

---

## Phase 3: Dispatch & Route Management

### 3.1 Driver Assignment
**Priority: HIGH** | **Estimated Time: 3-4 days**

**Location:** `/dashboard/dispatch/page.tsx`

#### Features:
1. **Available Drivers List**
   - Shows only `isOnDuty: true` drivers
   - Display: Name, Phone, Current Location (distance from warehouse), COD Wallet Balance
   - Real-time location updates

2. **Order Assignment Interface**
   - Select multiple orders (checkboxes)
   - Select driver from dropdown
   - "Assign Orders" button
   - Confirmation modal

3. **Assigned Orders View**
   - Group by driver
   - Show assigned but not yet in route orders

**Components:**
- `DriverList.tsx` - Available drivers
- `OrderAssignment.tsx` - Assignment interface
- `AssignedOrdersView.tsx` - Current assignments

**Convex Functions:**
- `getAvailableDrivers` - Get on-duty drivers
- `assignOrdersToDriver` - Assign orders to driver
- `getAssignedOrders` - Get orders by driver

---

### 3.2 Route Optimization & Manifest
**Priority: HIGH** | **Estimated Time: 5-6 days**

**Location:** `/dashboard/routes/page.tsx` or `/dashboard/dispatch/routes`

#### Features:
1. **Route Builder**
   - Select driver
   - Shows all assigned orders for that driver
   - Drag-and-drop to reorder stops
   - Visual sequence: Stop 1, Stop 2, Stop 3...

2. **Auto-Optimize Button**
   - Calculate optimal route using coordinates
   - Use distance/time matrix (Google Maps API or similar)
   - Reorder stops automatically
   - Show estimated total distance/time

3. **Manifest Creation**
   - Finalize route sequence
   - "Create Manifest" button
   - Pushes route to Driver App
   - Updates order `routePosition` field

4. **Active Routes View**
   - Show all active routes
   - Driver progress (which stop they're on)
   - Estimated completion time

**Components:**
- `RouteBuilder.tsx` - Main route building interface
- `StopList.tsx` - Draggable list of stops
- `RouteMap.tsx` - Visual map with route line
- `ManifestPreview.tsx` - Preview before sending

**Convex Functions:**
- `getDriverAssignedOrders` - Get orders for a driver
- `optimizeRoute` - Calculate optimal route (may need external API)
- `createManifest` - Create route and update orders (validates driver is on-duty + **stale data check**)
- `getActiveRoutes` - Get all active routes
- `updateRouteProgress` - Update driver's current stop
- `editManifest` - Edit route before driver starts (if status is DRAFT)
- `getWarehouseLocation` - Get base location from settings

**⚠️ CRITICAL: Stale Data Risk in Route Optimization**
**Scenario:** Admin A is building a route. Customer B cancels an order. Admin A hits "Create Manifest."

**The Fix - Sanity Check in createManifest:**
Before locking the route, query order statuses one last time to ensure:
- None are `CANCELLED`
- None are already `ASSIGNED` to another driver
- All orders still have `status` that allows assignment

**Implementation:**
```typescript
// In createManifest function
const orders = await ctx.db.query("orders")
  .withIndex("by_orderId", q => q.in("orderId", orderIds))
  .collect()

// Validate all orders
for (const order of orders) {
  if (order.status === "CANCELLED") {
    throw new Error(`Order ${order.orderId} was cancelled`)
  }
  if (order.assignedDriverId && order.assignedDriverId !== driverId) {
    throw new Error(`Order ${order.orderId} already assigned to another driver`)
  }
  // Only then proceed with manifest creation
}
```

**External Dependencies:**
- Google Maps Distance Matrix API (or alternative)
- Route optimization algorithm library (TSP solver or nearest neighbor)

**Route Optimization Details:**
- Starting point: Warehouse/Base location (from settings)
- Algorithm: TSP (Traveling Salesman Problem) or Nearest Neighbor heuristic
- Consider: Distance, Time, Traffic (if API supports)
- Output: Optimized stop sequence
- Show: Total distance, Estimated time, Route preview on map

---

## Phase 4: Inventory Management

### 4.1 Product Management
**Priority: MEDIUM** | **Estimated Time: 3-4 days**

**Location:** `/dashboard/products/page.tsx`

#### Features:
1. **Product List**
   - Table view with: Name, SKU, Price, Stock, Category
   - Search and filter
   - Pagination

2. **Product CRUD**
   - Create new product (modal/form)
   - Edit existing product
   - Delete product (with confirmation)
   - Image upload for products

3. **Bulk Actions**
   - Bulk update stock levels
   - Export product list (CSV)

**Components:**
- `ProductList.tsx` - Product table
- `ProductForm.tsx` - Create/Edit form
- `ProductImageUpload.tsx` - Image upload component

**Convex Functions:**
- `getProducts` - Query products
- `createProduct` - Add new product
- `updateProduct` - Update product
- `deleteProduct` - Delete product
- `updateStock` - Update inventory levels

---

### 4.2 Inventory Control
**Priority: MEDIUM** | **Estimated Time: 2-3 days**

**Location:** `/dashboard/inventory/page.tsx`

#### Features:
1. **Stock Levels Dashboard**
   - Low stock alerts (threshold: <10 items)
   - Stock level by category
   - Recent stock movements

2. **Restock Interface**
   - Select product
   - Enter quantity to add
   - Reason field (e.g., "Returned goods", "New shipment")
   - Update stock level

3. **Stock History**
   - Log of all stock changes
   - Filter by product, date range

**Components:**
- `StockDashboard.tsx` - Overview
- `RestockModal.tsx` - Add stock form
- `StockHistory.tsx` - History table

**Convex Functions:**
- `getLowStockProducts` - Get products below threshold
- `restockProduct` - Add stock and log
- `getStockHistory` - Get stock change logs
- `handleStockOnOrderStatusChange` - Auto-deduct/restore on order status changes

**Stock Management Logic:**
- **Deduct stock** when order is **created/placed** (immediate, not at DELIVERED)
- **Restore stock** when order status changes to `RETURNED` or `FAILED`
- **Restore stock** when order is `CANCELLED` (if stock was reserved)
- All stock changes logged in audit trail

**Note:** Stock deduction happens at order creation, not delivery. See State Machine section above for details.

---

## Phase 5: Financial Reconciliation

### 5.1 Driver Wallets (COD Tracking)
**Priority: HIGH** | **Estimated Time: 2-3 days**

**Location:** `/dashboard/finance/wallets/page.tsx`

#### Features:
1. **Driver Wallet List**
   - Table showing: Driver Name, Total COD Collected, Last Settlement Date
   - Sort by balance (highest first)
   - Filter by driver

2. **Settlement Interface**
   - Select driver
   - Shows current balance
   - "Settle Cash" button
   - Confirmation modal
   - Optional: Settlement amount (partial settlement)
   - Reset wallet to zero (or subtract amount)

3. **Settlement History**
   - Log of all settlements
   - Date, Driver, Amount, Admin who processed

**Components:**
- `DriverWallets.tsx` - Wallet list
- `SettlementModal.tsx` - Settlement form
- `SettlementHistory.tsx` - History table

**Convex Functions:**
- `getDriverWallets` - Get all drivers with COD balances
- `settleDriverWallet` - Process settlement (updates driver, creates log)
- `getSettlementHistory` - Get settlement logs

**Note:** COD balance increases automatically when order with COD is marked as `DELIVERED`

---

## Phase 6: Additional Features & Polish

### 6.1 Navigation & Sidebar Updates
**Priority: HIGH** | **Estimated Time: 1 day**

Update `Sidebar.tsx` with new navigation items:
- Dashboard
- Orders
- Verification
- Dispatch
- Routes
- Products
- Inventory
- Finance
  - Wallets
  - Reports (future)

---

### 6.2 Real-Time Updates
**Priority: MEDIUM** | **Estimated Time: 2-3 days**

Implement real-time subscriptions using Convex:
- Live order status updates
- Driver location updates
- New verification requests
- Active route progress

Use Convex `useQuery` hooks for automatic reactivity.

---

### 6.3 Search & Filtering
**Priority: MEDIUM** | **Estimated Time: 2 days**

Global search functionality:
- Search orders by ID, customer name, phone number (using `searchTokens` field)
- Search products by name, SKU
- Search drivers by name

**Search Optimization:**
- Use `searchTokens` field in orders table for instant search
- Combine `orderId`, `customerName`, `customerPhone` into single string when creating order
- Example: `searchTokens: "ord_123 john doe 555-0199"`
- Query using `by_search` index for fast results

---

### 6.4 Reports & Analytics
**Priority: LOW** | **Estimated Time: 3-4 days**

**Location:** `/dashboard/reports/page.tsx`

- Daily/Weekly/Monthly reports
- Export to PDF/CSV
- Revenue charts
- Delivery success rate
- Driver performance metrics

---

## Implementation Order (Recommended)

### Sprint 1 (Week 1-2): Foundation
1. ✅ Database schema setup (all tables)
2. ✅ Basic dashboard with stats
3. ✅ Order management board (basic view)

### Sprint 2 (Week 3-4): Core Features
4. ✅ Bank transfer verification
5. ✅ Driver assignment
6. ✅ Basic route management

### Sprint 3 (Week 5-6): Advanced Features
7. ✅ Route optimization
8. ✅ Product management
9. ✅ Inventory control

### Sprint 4 (Week 7-8): Financial & Polish
10. ✅ Driver wallets
11. ✅ Real-time updates
12. ✅ UI/UX polish
13. ✅ Testing & bug fixes

---

## Technical Considerations

### Map Integration
**Options:**
- Google Maps (requires API key, paid after free tier)
- Mapbox (generous free tier) ✅ **RECOMMENDED**
- Leaflet + OpenStreetMap (free, open source)

**Recommendation:** Start with Mapbox for cost-effectiveness.

**⚠️ CRITICAL: Mapbox + Next.js Server Components**
Mapbox GL JS relies heavily on the `window` object, which doesn't exist during Next.js server-side rendering.

**The Fix:**
1. Create map components in separate files with `"use client"` directive at the top
2. Use `next/dynamic` to lazy load map components with `ssr: false`
3. Example structure:
   ```typescript
   // components/dashboard/LiveFleetMap.tsx
   "use client"
   import dynamic from 'next/dynamic'
   
   const MapboxMap = dynamic(() => import('./MapboxMap'), {
     ssr: false,
     loading: () => <div>Loading map...</div>
   })
   ```

### Image Storage
**Options:**
- Convex file storage (built-in)
- Cloudinary
- AWS S3

**Recommendation:** Use Convex file storage for simplicity.

**Image Requirements:**
- Payment Proof: Max 5MB, JPG/PNG only
- POD Images: Max 5MB, JPG/PNG only
- Product Images: Max 2MB, JPG/PNG only
- Auto-compress on upload if needed

### Route Optimization
**Options:**
- Google Maps Distance Matrix API
- Mapbox Optimization API
- Custom algorithm (TSP solver)

**Recommendation:** Start with manual drag-and-drop, add auto-optimize later.

### Real-Time Location
- Drivers update location via Driver App
- Store in `drivers.currentLocation` with timestamp
- Admin Portal polls/subscribes to updates
- Consider WebSocket for true real-time (Convex handles this)

**⚠️ CRITICAL: Convex Write Frequency (Driver Locations)**
If 20 drivers update location every 5 seconds = 240 writes/minute. This creates log noise and unnecessary costs.

**The Fix - Throttling Strategy (Driver App Implementation):**
Only send location update if:
- Driver has moved more than **20 meters** from last update, OR
- **30 seconds** have passed since last update

**Do NOT send updates if:**
- Driver is stationary (sitting at traffic light, waiting at stop)
- Movement is less than 20 meters

**Implementation Note:** This throttling logic should be in the Driver App, not Admin Portal. Document this requirement for Driver App development.

---

## File Structure

```
website/
├── app/
│   └── dashboard/
│       ├── layout.tsx (existing)
│       ├── page.tsx (Dashboard overview)
│       ├── orders/
│       │   └── page.tsx
│       ├── verification/
│       │   └── page.tsx
│       ├── dispatch/
│       │   ├── page.tsx
│       │   └── routes/
│       │       └── page.tsx
│       ├── products/
│       │   └── page.tsx
│       ├── inventory/
│       │   └── page.tsx
│       └── finance/
│           └── wallets/
│               └── page.tsx
├── components/
│   └── dashboard/
│       ├── Sidebar.tsx (update)
│       ├── Header.tsx (existing)
│       ├── orders/
│       │   ├── OrderBoard.tsx
│       │   ├── OrderCard.tsx
│       │   └── OrderDetailModal.tsx
│       ├── verification/
│       │   ├── VerificationQueue.tsx
│       │   └── PaymentProofModal.tsx
│       ├── dispatch/
│       │   ├── DriverList.tsx
│       │   ├── RouteBuilder.tsx
│       │   └── StopList.tsx
│       ├── products/
│       │   ├── ProductList.tsx
│       │   └── ProductForm.tsx
│       └── finance/
│           └── DriverWallets.tsx
└── convex/
    ├── schema.ts (update)
    ├── orders.ts
    ├── drivers.ts
    ├── products.ts
    ├── routes.ts
    ├── auditLogs.ts
    ├── customers.ts
    └── settings.ts
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "mapbox-gl": "^3.0.0",  // or "leaflet": "^1.9.4"
    "react-map-gl": "^7.1.0",  // if using Mapbox
    "@dnd-kit/core": "^6.0.0",  // for drag-and-drop
    "@dnd-kit/sortable": "^8.0.0",
    "recharts": "^2.10.0",  // for charts
    "date-fns": "^3.0.0",  // for date formatting
    "react-hot-toast": "^2.4.0"  // for notifications
  }
}
```

---

## Next Steps

1. **Review this plan** and adjust priorities based on business needs
2. **Set up database schema** in Convex
3. **Start with Phase 1** (Foundation)
4. **Iterate** through phases, testing as you go
5. **Gather feedback** from stakeholders after each phase

---

## Questions to Resolve

1. **Map Provider:** Which mapping service to use? (Cost vs. features) ✅ Recommended: Mapbox
2. **Route Optimization:** How sophisticated should auto-optimize be? ✅ Start with manual, add TSP later
3. **Image Storage:** Where to store payment proofs and POD images? ✅ Recommended: Convex file storage
4. **Permissions:** Should there be different admin roles (e.g., dispatcher vs. finance)? ⚠️ Future enhancement
5. **Notifications:** How should admins be notified of new verification requests? ⚠️ Future enhancement
6. **Warehouse Location:** What are the coordinates of the base/warehouse? ⚠️ Needs to be configured in settings
7. **Stock Threshold:** What is the low stock alert threshold? ✅ Default: 10 items (configurable)
8. **Driver Location Updates:** How often should drivers update location? ⚠️ Driver App implementation detail

---

**Last Updated:** [Current Date]
**Status:** Planning Phase

