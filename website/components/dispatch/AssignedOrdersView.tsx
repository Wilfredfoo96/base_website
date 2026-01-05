'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Package, User } from 'lucide-react'

export function AssignedOrdersView() {
  const assignedGroups = useQuery(api.dispatch.getAssignedOrders, {})

  if (!assignedGroups) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-gray-400">Loading assigned orders...</div>
      </div>
    )
  }

  if (assignedGroups.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-gray-50">
        <p className="text-gray-500">No assigned orders</p>
        <p className="text-sm text-gray-400 mt-2">
          Orders will appear here once assigned to drivers
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {assignedGroups.map((group) => (
        <div key={group.driverId} className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b">
            <User className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-lg">{group.driverName}</h3>
            <Badge variant="outline" className="ml-auto">
              {group.orders.length} order{group.orders.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="grid gap-3">
            {group.orders.map((order) => (
              <div
                key={order.orderId}
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-mono font-medium">
                      {order.orderId}
                    </span>
                  </div>
                  <Badge variant="secondary">Assigned</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Customer</p>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Amount</p>
                    <p className="font-semibold text-gray-900">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.paymentMethod === 'COD' ? 'COD' : 'Bank Transfer'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Created</p>
                    <p className="text-gray-600">
                      {format(new Date(order.createdAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                {order.deliveryAddress && (
                  <div className="mt-3 pt-3 border-t text-sm">
                    <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                    <p className="text-gray-600">
                      {order.deliveryAddress.street}, {order.deliveryAddress.city}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

