'use client'

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Order = {
  orderId: string
  customerName: string
  customerPhone: string
  totalAmount: number
  deliveryAddress: {
    street: string
    city: string
    state: string
    coordinates: {
      lat: number
      lng: number
    }
  }
}

interface StopListProps {
  orders: Order[]
  sequence: string[]
  onSequenceChange: (sequence: string[]) => void
}

export function StopList({ orders, sequence, onSequenceChange }: StopListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sequence.indexOf(active.id as string)
    const newIndex = sequence.indexOf(over.id as string)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newSequence = [...sequence]
      const [removed] = newSequence.splice(oldIndex, 1)
      newSequence.splice(newIndex, 0, removed)
      onSequenceChange(newSequence)
    }
  }

  const orderedOrders = sequence
    .map((orderId) => orders.find((o) => o.orderId === orderId))
    .filter((o): o is Order => o !== undefined)

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-4">Route Sequence</h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sequence}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {orderedOrders.map((order, index) => (
              <StopItem
                key={order.orderId}
                order={order}
                stopNumber={index + 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

interface StopItemProps {
  order: Order
  stopNumber: number
}

function StopItem({ order, stopNumber }: StopItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: order.orderId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 hover:shadow-md transition-shadow ${
        isDragging ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-1"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">Stop {stopNumber}</Badge>
            <span className="text-xs font-mono text-gray-600">
              {order.orderId}
            </span>
          </div>
          <p className="font-medium text-sm">{order.customerName}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {order.deliveryAddress.street}, {order.deliveryAddress.city}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            ${order.totalAmount.toFixed(2)}
          </p>
        </div>
      </div>
    </Card>
  )
}

