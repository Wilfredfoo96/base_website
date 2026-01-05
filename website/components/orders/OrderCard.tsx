'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

type Order = {
  orderId: string
  customerName: string
  customerPhone: string
  status: string
  paymentMethod: 'COD' | 'BANK_TRANSFER'
  paymentStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  totalAmount: number
  createdAt: number
  assignedDriverId?: string
}

interface OrderCardProps {
  order: Order
  onClick?: () => void
  isDragging?: boolean
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

const paymentMethodLabels: Record<string, string> = {
  COD: 'COD',
  BANK_TRANSFER: 'Bank Transfer',
}

export function OrderCard({ order, onClick, isDragging }: OrderCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: order.orderId,
    disabled: isDragging,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="p-3 space-y-2">
        {/* Order ID and Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-gray-600">
            {order.orderId.slice(0, 8)}...
          </span>
          <div
            className={`w-2 h-2 rounded-full ${
              statusColors[order.status] || 'bg-gray-500'
            }`}
          />
        </div>

        {/* Customer Name */}
        <div>
          <p className="text-sm font-medium text-gray-900">
            {order.customerName}
          </p>
          <p className="text-xs text-gray-500">{order.customerPhone}</p>
        </div>

        {/* Amount and Payment */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">
            ${order.totalAmount.toFixed(2)}
          </span>
          <Badge
            variant={
              order.paymentMethod === 'COD'
                ? 'default'
                : order.paymentStatus === 'VERIFIED'
                ? 'default'
                : 'secondary'
            }
            className="text-xs"
          >
            {paymentMethodLabels[order.paymentMethod]}
          </Badge>
        </div>

        {/* Date */}
        <p className="text-xs text-gray-400">
          {format(new Date(order.createdAt), 'MMM d, yyyy')}
        </p>

        {/* Driver Assignment */}
        {order.assignedDriverId && (
          <p className="text-xs text-blue-600">Driver Assigned</p>
        )}
      </div>
    </Card>
  )
}

