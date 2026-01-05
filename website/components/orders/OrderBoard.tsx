'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { OrderCard } from './OrderCard'
import { OrderColumn } from './OrderColumn'
import { OrderDetailModal } from './OrderDetailModal'
import { OrderFilters } from './OrderFilters'
import { OrderSearch } from './OrderSearch'
import { Button } from '@/components/ui/button'

type OrderStatus =
  | 'PENDING_VERIFICATION'
  | 'PENDING_DISPATCH'
  | 'PROCESSING'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED'

const COLUMNS: { id: OrderStatus; title: string; color: string }[] = [
  { id: 'PENDING_VERIFICATION', title: 'Pending Verification', color: 'bg-yellow-100' },
  { id: 'PENDING_DISPATCH', title: 'Ready to Assign', color: 'bg-blue-100' },
  { id: 'PROCESSING', title: 'Processing', color: 'bg-purple-100' },
  { id: 'ASSIGNED', title: 'Assigned', color: 'bg-indigo-100' },
  { id: 'EN_ROUTE', title: 'Out for Delivery', color: 'bg-orange-100' },
  { id: 'DELIVERED', title: 'Completed', color: 'bg-green-100' },
  { id: 'FAILED', title: 'Failed', color: 'bg-red-100' },
  { id: 'RETURNED', title: 'Returned', color: 'bg-pink-100' },
]

export function OrderBoard() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [filters, setFilters] = useState<{
    status?: OrderStatus
    paymentMethod?: 'COD' | 'BANK_TRANSFER'
    paymentStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED'
    searchQuery?: string
  }>({})

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Fetch all orders
  const allOrders = useQuery(api.orders.getAll, {
    status: filters.status,
    paymentStatus: filters.paymentStatus,
  })

  const updateStatus = useMutation(api.orders.updateStatus)

  // Filter orders by search query if provided
  const orders = allOrders?.filter((order) => {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      return (
        order.orderId.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.includes(query)
      )
    }
    if (filters.paymentMethod) {
      return order.paymentMethod === filters.paymentMethod
    }
    return true
  })

  // Group orders by status
  const ordersByStatus = orders?.reduce(
    (acc, order) => {
      const status = order.status as OrderStatus
      if (!acc[status]) {
        acc[status] = []
      }
      acc[status].push(order)
      return acc
    },
    {} as Partial<Record<OrderStatus, typeof orders>>
  ) || ({} as Partial<Record<OrderStatus, typeof orders>>)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const orderId = active.id as string
    const newStatus = over.id as OrderStatus

    // Find the order to get current status
    const order = orders?.find((o) => o.orderId === orderId)
    if (!order || order.status === newStatus) return

    try {
      await updateStatus({
        orderId,
        newStatus,
      })
    } catch (error) {
      console.error('Failed to update order status:', error)
      // You might want to show a toast notification here
    }
  }

  const activeOrder = activeId
    ? orders?.find((o) => o.orderId === activeId)
    : null

  if (!orders) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <OrderSearch
            value={filters.searchQuery || ''}
            onChange={(query) => setFilters({ ...filters, searchQuery: query })}
          />
        </div>
        <OrderFilters
          filters={filters}
          onChange={setFilters}
        />
        <Button
          variant="outline"
          onClick={() => setViewMode(viewMode === 'kanban' ? 'list' : 'kanban')}
        >
          {viewMode === 'kanban' ? 'List View' : 'Kanban View'}
        </Button>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((column) => {
              const columnOrders = ordersByStatus[column.id] || []
              return (
                <OrderColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  color={column.color}
                  orders={columnOrders}
                  onOrderClick={setSelectedOrderId}
                />
              )
            })}
          </div>
          <DragOverlay>
            {activeOrder ? (
              <OrderCard order={activeOrder} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        // List View (simplified for now)
        <div className="space-y-2">
          {orders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              onClick={() => setSelectedOrderId(order.orderId)}
            />
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  )
}

