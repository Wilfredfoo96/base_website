'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { PaymentProofModal } from './PaymentProofModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Eye, Clock } from 'lucide-react'

export function VerificationQueue() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const pendingOrders = useQuery(api.payments.getPendingVerifications)

  if (!pendingOrders) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-gray-400">Loading pending verifications...</div>
      </div>
    )
  }

  if (pendingOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">No pending verifications</p>
        <p className="text-sm text-gray-400 mt-2">
          All bank transfer payments have been verified
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {pendingOrders.map((order) => (
          <div
            key={order.orderId}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Order ID */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Order ID</p>
                <p className="text-sm font-mono font-medium">{order.orderId}</p>
              </div>

              {/* Customer */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Customer</p>
                <p className="text-sm font-medium">{order.customerName}</p>
                <p className="text-xs text-gray-400">{order.customerPhone}</p>
              </div>

              {/* Amount */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Amount</p>
                <p className="text-sm font-semibold text-gray-900">
                  ${order.totalAmount.toFixed(2)}
                </p>
              </div>

              {/* Uploaded At */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Uploaded</p>
                <p className="text-sm text-gray-600">
                  {order.paymentProofUrl
                    ? format(new Date(order.createdAt), 'MMM d, yyyy HH:mm')
                    : 'No proof uploaded'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="ml-4">
              {order.paymentProofUrl ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrderId(order.orderId)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Proof
                </Button>
              ) : (
                <Badge variant="secondary">No Proof</Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Payment Proof Modal */}
      {selectedOrderId && (
        <PaymentProofModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  )
}

