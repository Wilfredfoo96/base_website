import { OrderBoard } from '@/components/orders/OrderBoard'

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Order Management</h1>
        <p className="text-muted-foreground">
          Manage and track all orders through the delivery pipeline
        </p>
      </div>

      {/* Order Board */}
      <OrderBoard />
    </div>
  )
}

