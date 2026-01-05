'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card } from '@/components/ui/card'
import { OrderCard } from './OrderCard'

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

interface OrderColumnProps {
  id: string
  title: string
  color: string
  orders: Order[]
  onOrderClick: (orderId: string) => void
}

export function OrderColumn({
  id,
  title,
  color,
  orders,
  onOrderClick,
}: OrderColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <Card
      ref={setNodeRef}
      className={`min-w-[280px] transition-colors ${
        isOver ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className={`p-3 ${color} rounded-t-lg`}>
        <h3 className="font-semibold text-sm">
          {title}
          <span className="ml-2 text-xs font-normal">({orders.length})</span>
        </h3>
      </div>
      <div className="p-2 space-y-2 min-h-[400px] max-h-[600px] overflow-y-auto">
        <SortableContext
          items={orders.map((o) => o.orderId)}
          strategy={verticalListSortingStrategy}
        >
          {orders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              onClick={() => onOrderClick(order.orderId)}
            />
          ))}
        </SortableContext>
        {orders.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-8">No orders</div>
        )}
      </div>
    </Card>
  )
}

