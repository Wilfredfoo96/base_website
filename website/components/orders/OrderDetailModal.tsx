'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { MapPin, Package, User, Phone, Mail, Calendar } from 'lucide-react'

interface OrderDetailModalProps {
  orderId: string
  onClose: () => void
}

const statusColors: Record<string, string> = {
  PENDING_VERIFICATION: 'bg-yellow-500',
  PENDING_DISPATCH: 'bg-blue-500',
  PROCESSING: 'bg-purple-500',
  ASSIGNED: 'bg-indigo-500',
  EN_ROUTE: 'bg-orange-500',
  DELIVERED: 'bg-green-500',
  FAILED: 'bg-red-500',
  RETURNED: 'bg-pink-500',
  CANCELLED: 'bg-gray-500',
}

export function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const order = useQuery(api.orders.getById, { orderId })
  const customer = order
    ? useQuery(api.customers.getById, { customerId: order.customerId })
    : null

  if (!order) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-gray-400">Loading order details...</div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>Order ID: {order.orderId}</DialogDescription>
            </div>
            <Badge
              className={`${statusColors[order.status] || 'bg-gray-500'} text-white`}
            >
              {order.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </h3>
              <div className="pl-6 space-y-1 text-sm">
                <p className="font-medium">{order.customerName}</p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  {order.customerPhone}
                </p>
                {customer?.email && (
                  <p className="text-gray-600 flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {customer.email}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Order Information
              </h3>
              <div className="pl-6 space-y-1 text-sm">
                <p>
                  <span className="text-gray-600">Created:</span>{' '}
                  {format(new Date(order.createdAt), 'PPpp')}
                </p>
                <p>
                  <span className="text-gray-600">Updated:</span>{' '}
                  {format(new Date(order.updatedAt), 'PPpp')}
                </p>
                <p>
                  <span className="text-gray-600">Payment Method:</span>{' '}
                  {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Bank Transfer'}
                </p>
                <p>
                  <span className="text-gray-600">Payment Status:</span>{' '}
                  <Badge variant="outline" className="ml-2">
                    {order.paymentStatus}
                  </Badge>
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Delivery Address
            </h3>
            <div className="pl-6 text-sm space-y-1">
              {order.deliveryAddress.label && (
                <p className="font-medium">{order.deliveryAddress.label}</p>
              )}
              <p className="text-gray-600">
                {order.deliveryAddress.street}
                <br />
                {order.deliveryAddress.city}, {order.deliveryAddress.state}{' '}
                {order.deliveryAddress.zipCode}
              </p>
              {order.deliveryAddress.instructions && (
                <p className="text-gray-500 italic mt-2">
                  Instructions: {order.deliveryAddress.instructions}
                </p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Items
            </h3>
            <div className="pl-6">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Product</th>
                      <th className="px-4 py-2 text-right">Quantity</th>
                      <th className="px-4 py-2 text-right">Unit Price</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{item.productName}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">
                          ${item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          ${item.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right">
                        Total:
                      </td>
                      <td className="px-4 py-2 text-right">
                        ${order.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(order.deliveryNotes ||
            order.failedReason ||
            order.returnReason ||
            order.cancellationReason ||
            order.proofOfDeliveryUrl) && (
            <div className="space-y-2">
              <h3 className="font-semibold">Additional Information</h3>
              <div className="pl-6 space-y-2 text-sm">
                {order.deliveryNotes && (
                  <div>
                    <span className="font-medium">Delivery Notes:</span>
                    <p className="text-gray-600">{order.deliveryNotes}</p>
                  </div>
                )}
                {order.failedReason && (
                  <div>
                    <span className="font-medium text-red-600">Failed Reason:</span>
                    <p className="text-gray-600">{order.failedReason}</p>
                  </div>
                )}
                {order.returnReason && (
                  <div>
                    <span className="font-medium text-pink-600">Return Reason:</span>
                    <p className="text-gray-600">{order.returnReason}</p>
                  </div>
                )}
                {order.cancellationReason && (
                  <div>
                    <span className="font-medium text-gray-600">Cancellation Reason:</span>
                    <p className="text-gray-600">{order.cancellationReason}</p>
                  </div>
                )}
                {order.proofOfDeliveryUrl && (
                  <div>
                    <span className="font-medium">Proof of Delivery:</span>
                    <div className="mt-2">
                      <img
                        src={order.proofOfDeliveryUrl}
                        alt="Proof of Delivery"
                        className="max-w-xs rounded-lg border"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Driver Assignment */}
          {order.assignedDriverId && (
            <div className="space-y-2">
              <h3 className="font-semibold">Driver Assignment</h3>
              <div className="pl-6 text-sm">
                <p>
                  <span className="text-gray-600">Driver ID:</span> {order.assignedDriverId}
                </p>
                {order.routePosition && (
                  <p>
                    <span className="text-gray-600">Route Position:</span>{' '}
                    {order.routePosition}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

