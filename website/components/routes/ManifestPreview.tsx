'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Package, MapPin, User } from 'lucide-react'

interface ManifestPreviewProps {
  driverId: string
  orderIds: string[]
  onClose: () => void
  onCreate: () => void
}

export function ManifestPreview({
  driverId,
  orderIds,
  onClose,
  onCreate,
}: ManifestPreviewProps) {
  const driver = useQuery(api.drivers.getById, { driverId })
  const orders = useQuery(api.orders.getAll, {})

  const routeOrders = orders
    ? orderIds
        .map((id) => orders.find((o) => o.orderId === id))
        .filter((o) => o !== undefined)
    : []

  const totalAmount = routeOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const codAmount = routeOrders
    .filter((o) => o.paymentMethod === 'COD')
    .reduce((sum, o) => sum + o.totalAmount, 0)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manifest Preview</DialogTitle>
          <DialogDescription>
            Review route details before creating manifest
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Driver Info */}
          {driver && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="font-semibold">Driver: {driver.name}</span>
              </div>
              <p className="text-sm text-gray-600">{driver.phone}</p>
            </div>
          )}

          {/* Route Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Total Stops</p>
              <p className="text-2xl font-bold">{orderIds.length}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Total Amount</p>
              <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-gray-500 mb-1">COD Amount</p>
              <p className="text-2xl font-bold">${codAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Route Sequence */}
          <div className="space-y-2">
            <h3 className="font-semibold">Delivery Sequence</h3>
            <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
              {routeOrders.map((order, index) => (
                <div key={order.orderId} className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">
                      Stop {index + 1}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-mono">{order.orderId}</span>
                      </div>
                      <p className="font-medium text-sm">{order.customerName}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {order.deliveryAddress.street}, {order.deliveryAddress.city}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-gray-600">
                          ${order.totalAmount.toFixed(2)}
                        </span>
                        <Badge
                          variant={
                            order.paymentMethod === 'COD' ? 'default' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {order.paymentMethod === 'COD' ? 'COD' : 'Bank Transfer'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onCreate}>Create Manifest</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

