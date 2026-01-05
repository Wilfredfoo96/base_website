# Driver Registration Guide

## Overview
This guide explains how drivers can register in the Eazy Logistics system. Currently, the system supports two registration methods depending on your setup.

---

## Current System Architecture

### Driver Data Structure
Drivers in the system require:
- `driverId` - Unique identifier (e.g., "driver_123")
- `clerkId` - Clerk authentication ID (from Clerk signup)
- `name` - Driver's full name
- `phone` - Driver's phone number
- `isOnDuty` - Duty status (default: false)
- `codWallet` - Cash on delivery balance (default: 0)

---

## Registration Methods

### Method 1: Admin-Created Drivers (Current Implementation)
**Status:** ✅ Available in Admin Portal

**How it works:**
1. Admin logs into the Admin Portal
2. Admin navigates to a driver management page (if exists) or uses Convex functions directly
3. Admin creates driver record with:
   - Driver ID
   - Clerk ID (from Clerk user account)
   - Name
   - Phone number

**Current Implementation:**
- Convex function: `api.drivers.create` exists
- Requires: `driverId`, `clerkId`, `name`, `phone`

**Limitation:** No UI interface in Admin Portal yet for driver creation

---

### Method 2: Self-Registration (Driver App - Not Yet Built)
**Status:** ⚠️ Not yet implemented (Driver App is separate project)

**Planned Flow:**
1. Driver downloads Driver App
2. Driver signs up through Clerk authentication
3. Driver completes registration form:
   - Name
   - Phone number
   - Vehicle information (optional)
4. System creates driver record automatically
5. Admin approves/activates driver account

**Note:** The Driver App is a separate mobile application that hasn't been built yet.

---

## Step-by-Step: How to Register a Driver (Current Method)

### Option A: Using Admin Portal (If UI exists)

1. **Admin Login**
   - Admin logs into `/dashboard`
   - Navigate to driver management section

2. **Create Driver**
   - Click "Add Driver" or similar button
   - Fill in driver details:
     - Name
     - Phone
     - Clerk ID (from Clerk user account)
   - Submit form

3. **Driver Account Created**
   - Driver record created in database
   - Driver can now log into Driver App (when built)

---

### Option B: Manual Creation via Convex (Current Workaround)

Since there's no UI yet, you can create drivers manually:

1. **Driver Signs Up with Clerk**
   - Driver goes to `/sign-up`
   - Creates Clerk account
   - Gets `clerkId` (e.g., "user_abc123")

2. **Admin Creates Driver Record**
   - Use Convex dashboard or API
   - Call `api.drivers.create` mutation:
   ```typescript
   {
     driverId: "driver_123", // Generate unique ID
     clerkId: "user_abc123", // From Clerk signup
     name: "John Doe",
     phone: "+1234567890"
   }
   ```

3. **Driver Ready**
   - Driver can now log in
   - Driver appears in system
   - Admin can assign orders

---

## Recommended Implementation: Driver Registration UI

### Create Driver Management Page in Admin Portal

**Location:** `/dashboard/drivers/page.tsx`

**Features Needed:**
1. **Driver List**
   - View all registered drivers
   - Filter by duty status
   - Search by name/phone

2. **Add Driver Form**
   - Name input
   - Phone input
   - Clerk ID selector (from existing users) or manual entry
   - Generate unique driverId automatically

3. **Driver Actions**
   - Edit driver details
   - Toggle duty status
   - View driver stats (COD wallet, delivery history)

---

## Quick Implementation Guide

### 1. Create Driver Management Page

```typescript
// website/app/dashboard/drivers/page.tsx
import { DriverList } from '@/components/drivers/DriverList'

export default function DriversPage() {
  return (
    <div>
      <h1>Driver Management</h1>
      <DriverList />
    </div>
  )
}
```

### 2. Create Driver List Component

```typescript
// website/components/drivers/DriverList.tsx
'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { AddDriverModal } from './AddDriverModal'

export function DriverList() {
  const drivers = useQuery(api.drivers.getAll)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setIsAddModalOpen(true)}>
        Add Driver
      </button>
      {/* Driver table/list */}
      <AddDriverModal 
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  )
}
```

### 3. Create Add Driver Modal

```typescript
// website/components/drivers/AddDriverModal.tsx
'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

export function AddDriverModal({ open, onClose }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [clerkId, setClerkId] = useState('')
  const createDriver = useMutation(api.drivers.create)
  const users = useQuery(api.users.getUsers) // Get available Clerk users

  const handleSubmit = async (e) => {
    e.preventDefault()
    const driverId = `driver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await createDriver({
      driverId,
      clerkId,
      name,
      phone,
    })
    
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Input 
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input 
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <Select 
          label="Clerk User"
          value={clerkId}
          onChange={setClerkId}
          options={users?.map(u => ({ value: u.clerkId, label: u.email }))}
          required
        />
        <Button type="submit">Create Driver</Button>
      </form>
    </Dialog>
  )
}
```

---

## Future: Driver App Self-Registration

When the Driver App is built, the registration flow will be:

1. **Driver Downloads App**
2. **Sign Up Screen**
   - Email/Password
   - Creates Clerk account
3. **Registration Form**
   - Name
   - Phone
   - Vehicle type (optional)
   - License number (optional)
4. **Auto-Create Driver Record**
   - System automatically creates driver with `clerkId` from signup
   - Status: "Pending Approval"
5. **Admin Approval**
   - Admin reviews driver application
   - Approves or rejects
   - Driver can start working once approved

---

## Current Workflow Summary

### For Admins:
1. ✅ Driver signs up through Clerk (`/sign-up`)
2. ⚠️ Admin manually creates driver record (no UI yet)
3. ✅ Driver can be assigned orders
4. ✅ Driver can toggle duty status (when Driver App is built)

### For Drivers:
1. ✅ Sign up through Clerk
2. ⚠️ Wait for admin to create driver record
3. ⏳ Download Driver App (when built)
4. ⏳ Log in and start working

---

## Next Steps

### Immediate (Admin Portal):
1. ✅ Create `/dashboard/drivers` page
2. ✅ Create `DriverList` component
3. ✅ Create `AddDriverModal` component
4. ✅ Add "Drivers" to sidebar navigation

### Future (Driver App):
1. ⏳ Build Driver App mobile application
2. ⏳ Implement self-registration flow
3. ⏳ Add admin approval workflow
4. ⏳ Add driver onboarding

---

## Questions?

**Q: Can drivers register themselves?**
A: Not yet. Currently, admins must create driver records. Self-registration will be available when the Driver App is built.

**Q: Do drivers need Clerk accounts?**
A: Yes. Drivers must sign up through Clerk first to get a `clerkId`, which is required for the driver record.

**Q: How do I create a driver right now?**
A: Use the Convex dashboard or API to call `api.drivers.create` with the required fields.

**Q: When will driver self-registration be available?**
A: When the Driver App mobile application is built (separate project).

---

**Last Updated:** [Current Date]
**Status:** Admin-created drivers available, self-registration pending Driver App development

