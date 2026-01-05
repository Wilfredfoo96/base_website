'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { api } from '@/convex/_generated/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface PaymentProofModalProps {
  orderId: string
  onClose: () => void
}

export function PaymentProofModal({ orderId, onClose }: PaymentProofModalProps) {
  const { user } = useUser()
  const order = useQuery(api.orders.getById, { orderId })
  const approvePayment = useMutation(api.payments.approvePayment)
  const rejectPayment = useMutation(api.payments.rejectPayment)

  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

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

  const handleApprove = async () => {
    if (!user?.id) {
      alert('User not authenticated')
      return
    }

    setIsProcessing(true)
    try {
      await approvePayment({
        orderId: order.orderId,
        adminId: user.id,
      })
      onClose()
    } catch (error) {
      console.error('Failed to approve payment:', error)
      alert('Failed to approve payment. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!user?.id) {
      alert('User not authenticated')
      return
    }

    setIsProcessing(true)
    try {
      await rejectPayment({
        orderId: order.orderId,
        reason: rejectionReason || undefined,
        adminId: user.id,
      })
      onClose()
    } catch (error) {
      console.error('Failed to reject payment:', error)
      alert('Failed to reject payment. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Payment Verification</DialogTitle>
              <DialogDescription>Order ID: {order.orderId}</DialogDescription>
            </div>
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Pending Verification
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 mb-1">Customer</p>
              <p className="text-sm font-medium">{order.customerName}</p>
              <p className="text-xs text-gray-400">{order.customerPhone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Amount</p>
              <p className="text-lg font-semibold text-gray-900">
                ${order.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Payment Proof Image */}
          {order.paymentProofUrl ? (
            <div className="space-y-2">
              <Label>Payment Proof</Label>
              <div className="border rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={order.paymentProofUrl}
                  alt="Payment proof"
                  className="w-full h-auto max-h-[500px] object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center bg-gray-50">
              <p className="text-gray-500">No payment proof uploaded</p>
            </div>
          )}

          {/* Rejection Reason */}
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">
              Rejection Reason (Optional)
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Reject Payment
              </>
            )}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve Payment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

