# Logistics Management System - Functional Specification

## Project Overview
A centralized ecosystem comprising three applications: an Admin Portal, a Driver App, and a Customer App. The system focuses on last-mile delivery, manual payment verification (Bank Transfer/COD), and a unique dual-state tracking system (Queue Position vs. Real-Time ETA).

---

## 1. Admin Portal (Web Dashboard)
**User Role:** Administrator / Dispatcher
**Platform:** Web Browser (Desktop Optimized)

### A. Dashboard & Reporting
* **End-of-Day Summary:**
    * Visual summary of total orders delivered vs. failed.
    * Financial snapshot: Total verified Bank Transfers vs. Total Cash on Delivery (COD) collected.
* **Live Fleet Map:**
    * Real-time map view showing the last known location of all "On-Duty" drivers.

### B. Order Management & Verification
* **Order Board:**
    * Kanban or List view of orders (New, Processing, Out for Delivery, Completed, Returned).
* **Bank Transfer Verification:**
    * Interface to view pending orders paid via Bank Transfer.
    * **Action:** View uploaded proof-of-payment image.
    * **Action:** "Approve Payment" or "Reject/Flag".
* **Audit Logs:**
    * Security log tracking which Admin approved which payment and at what timestamp.

### C. Route & Dispatch Management
* **Driver Assignment:**
    * View list of available (On-Duty) drivers.
    * Assign specific orders to a driver.
* **Route Optimization:**
    * **Manual:** Drag-and-drop interface to reorder the sequence of stops (Stop 1, Stop 2, etc.).
    * **Auto-Optimize:** Optional button to calculate the most efficient path for selected orders.
* **Manifest Creation:**
    * Push the finalized route to the Driver App.

### D. Inventory & Product Management
* **Product CRUD:**
    * Create, Read, Update, Delete products.
    * Fields: Name, Price, Description, Image, SKU.
* **Inventory Control:**
    * Basic stock level tracking (deducts upon order confirmation).
    * **Restock:** Ability to add returned/rejected goods back into inventory.

### E. Financial Reconciliation
* **Driver Wallets (COD Tracking):**
    * View total cash held by each driver.
    * **Settle:** Interface to log when a driver hands over cash to the company, resetting their "debt" to zero.

---

## 2. Driver App (Mobile)
**User Role:** Logistics Driver
**Platform:** Mobile App (Android/iOS)

### A. Duty & Profile
* **Login/Authentication:** Secure login.
* **Status Toggle:**
    * "Go Online" / "Go Offline" switch. (Only Online drivers are visible for assignment).

### B. Task Management (The Manifest)
* **Daily Task List:**
    * Sequential list of stops (Stop 1, Stop 2...).
    * Clear distinct visual states: Pending, En Route, Completed, Failed.
* **Order Details:**
    * View Customer Name, Address, Phone Number, and Items to deliver.
* **Navigation Integration:**
    * Button to launch external map app (Google Maps/Waze) with coordinates pre-filled.

### C. Delivery Workflow (The Core Logic)
* **"Start Trip" Action:**
    * **Trigger:** Driver presses "Start Trip" for a specific order.
    * **Confirmation:** Pop-up dialog "Confirm start trip to [Customer Name]?"
    * **System Event:** Updates status to `EN_ROUTE`. This triggers the Customer App to switch from "Queue View" to "ETA View."
* **Proof of Delivery (POD):**
    * **Action:** Driver arrives at location.
    * **Requirement:** Mandatory photo capture (package at door/signature).
    * **Submission:** Uploads photo to server to mark order as `DELIVERED`.

### D. Exception Handling
* **Failed Delivery:**
    * Option to mark as "Undelivered."
    * Select Reason: "Customer Unreachable," "Wrong Address," "Gate Locked."
* **Reverse Logistics (Returns):**
    * Option to mark items as "Returned/Rejected" if customer refuses goods.
    * Select Reason: "Damaged," "Wrong Item," "Customer Refused."

---

## 3. Customer App (Mobile)
**User Role:** End Consumer
**Platform:** Mobile App (Android/iOS)

### A. Shopping & Ordering
* **Marketplace:** Browse products by category.
* **Cart & Checkout:**
    * Review items and total cost.
    * **Address Management:**
        * **Saved Locations:** Users can save, label (e.g., "Home", "Office"), and edit multiple delivery addresses in their profile.
        * **Checkout Selection:** Quick-select functionality during checkout to choose from saved addresses without re-typing.
        * **Pin-Drop Accuracy:** Mandatory map-pin adjustment when adding a new address to ensure precise GPS coordinates for the Driver.
    * Contact details verification.

### B. Payments
* **Method 1: Cash on Delivery (COD):**
    * Order is placed immediately.
    * Status set to `PENDING_DISPATCH`.
* **Method 2: Bank Transfer:**
    * App displays Company Bank Details.
    * **Upload Receipt:** User must upload a screenshot of the transaction.
    * Status set to `PENDING_VERIFICATION` (locks order until Admin approves).

### C. Dynamic Tracking (The "Smart" Feature)
* **State 1: Queue Mode (Driver hasn't pressed Start):**
    * **Display:** "Order confirmed. You are #3 in the delivery queue."
    * **Logic:** `(Customer Stop Index) - (Driver Current Completed Index) - 1`.
* **State 2: ETA Mode (Driver pressed Start):**
    * **Display:** "Driver is en route! ETA: 12 mins."
    * **Visual:** Live map showing Driver icon moving towards Customer pin.

### D. Order Management
* **Order History:** View past orders and Proof of Delivery photos.
* **Cancellation Rules:**
    * **Allowed:** When status is `PENDING` or `PROCESSING`.
    * **Locked:** Button disabled when status becomes `EN_ROUTE` (Driver pressed Start).

---

## 4. System-Wide Logic Summary

| Action | Admin View | Driver View | Customer View |
| :--- | :--- | :--- | :--- |
| **Order Placed (Bank)** | "New Order - Pending Verification" | (Hidden) | "Verifying Payment" |
| **Payment Approved** | "Ready to Assign" | (Hidden) | "Preparing Order" |
| **Assigned to Route** | "Assigned to Driver John" | Appears in Manifest | "Driver Assigned" |
| **Driver completes Stop 1** | "Driver at Stop 1" | "Stop 1 Done" | "You are 2 stops away" |
| **Driver starts Stop 3 (User)** | "En Route to User" | "Navigating..." | **"ETA: 10 mins" (Live Map)** |
| **Delivery Complete** | "Delivered" (Photo Available) | "Job Done" | "Delivered" (View Photo) |