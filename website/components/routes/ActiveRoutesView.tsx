'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Package, User, MapPin } from 'lucide-react'

export function ActiveRoutesView() {
  const activeRoutes = useQuery(api.routes.getActive)
  const allDrivers = useQuery(api.drivers.getAll, {})

  if (!activeRoutes || !allDrivers) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-gray-400">Loading active routes...</div>
      </div>
    )
  }

  if (activeRoutes.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-gray-50">
        <p className="text-gray-500">No active routes</p>
        <p className="text-sm text-gray-400 mt-2">
          Routes will appear here once they are activated
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activeRoutes.map((route) => {
        const driver = allDrivers.find((d) => d.driverId === route.driverId)

        return (
          <div key={route.routeId} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-600" />
                <div>
                  <h3 className="font-semibold">
                    {driver?.name || 'Unknown Driver'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Route ID: {route.routeId}
                  </p>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Total Stops</p>
                <p className="text-xl font-bold">{route.orderIds.length}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Started</p>
                <p className="text-sm font-medium">
                  {route.startedAt
                    ? format(new Date(route.startedAt), 'MMM d, yyyy HH:mm')
                    : 'Not started'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Created</p>
                <p className="text-sm font-medium">
                  {format(new Date(route.createdAt), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Orders in Route:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {route.orderIds.map((orderId, index) => (
                  <div
                    key={orderId}
                    className="p-2 bg-gray-50 rounded text-xs flex items-center gap-2"
                  >
                    <Package className="h-3 w-3 text-gray-400" />
                    <span className="font-mono">{orderId}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      Stop {index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

