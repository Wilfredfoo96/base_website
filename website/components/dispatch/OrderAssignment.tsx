'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { format } from 'date-fns'

export function OrderAssignment() {
  const { user } = useUser()
  const unassignedOrders = useQuery(api.dispatch.getUnassignedOrders)
  const availableDrivers = useQuery(api.dispatch.getAvailableDrivers)
  const assignOrders = useMutation(api.dispatch.assignOrdersToDriver)

  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
  const [selectedDriverId, setSelectedDriverId] = useState<string>('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  if (!unassignedOrders || !availableDrivers) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  const handleToggleOrder = (orderId: string) => {
    const newSelection = new Set(selectedOrderIds)
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId)
    } else {
      newSelection.add(orderId)
    }
    setSelectedOrderIds(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedOrderIds.size === unassignedOrders.length) {
      setSelectedOrderIds(new Set())
    } else {
      setSelectedOrderIds(new Set(unassignedOrders.map((o) => o.orderId)))
    }
  }

  const handleAssign = async () => {
    if (!user?.id || !selectedDriverId || selectedOrderIds.size === 0) {
      return
    }

    setIsAssigning(true)
    try {
      await assignOrders({
        orderIds: Array.from(selectedOrderIds),
        driverId: selectedDriverId,
        adminId: user.id,
      })
      setSelectedOrderIds(new Set())
      setSelectedDriverId('')
      setShowConfirmDialog(false)
    } catch (error) {
      console.error('Failed to assign orders:', error)
      alert('Failed to assign orders. Please try again.')
    } finally {
      setIsAssigning(false)
    }
  }

  const selectedDriver = availableDrivers.find((d) => d.driverId === selectedDriverId)
  const selectedOrders = unassignedOrders.filter((o) =>
    selectedOrderIds.has(o.orderId)
  )

  return (
    <div className="space-y-4">
      {/* Driver Selection */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Select Driver</label>
          <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a driver..." />
            </SelectTrigger>
            <SelectContent>
              {availableDrivers.map((driver) => (
                <SelectItem key={driver.driverId} value={driver.driverId}>
                  {driver.name} {driver.phone && `(${driver.phone})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={
            !selectedDriverId ||
            selectedOrderIds.size === 0 ||
            availableDrivers.length === 0
          }
        >
          Assign Orders ({selectedOrderIds.size})
        </Button>
      </div>

      {/* Orders List */}
      {unassignedOrders.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500">No unassigned orders</p>
          <p className="text-sm text-gray-400 mt-2">
            All orders have been assigned or are in other statuses
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedOrderIds.size === unassignedOrders.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                Select All ({unassignedOrders.length} orders)
              </span>
            </div>
            <Badge variant="outline">
              {selectedOrderIds.size} selected
            </Badge>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {unassignedOrders.map((order) => (
              <div
                key={order.orderId}
                className="p-4 hover:bg-gray-50 flex items-center gap-4"
              >
                <Checkbox
                  checked={selectedOrderIds.has(order.orderId)}
                  onCheckedChange={() => handleToggleOrder(order.orderId)}
                />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Order ID</p>
                    <p className="text-sm font-mono">{order.orderId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Customer</p>
                    <p className="text-sm font-medium">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Amount</p>
                    <p className="text-sm font-semibold">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Created</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(order.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Order Assignment</DialogTitle>
            <DialogDescription>
              Assign {selectedOrderIds.size} order(s) to {selectedDriver?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {selectedOrders.map((order) => (
              <div key={order.orderId} className="p-2 border rounded text-sm">
                <p className="font-medium">{order.orderId}</p>
                <p className="text-gray-600">{order.customerName}</p>
                <p className="text-gray-500">${order.totalAmount.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={isAssigning}>
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Assignment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

