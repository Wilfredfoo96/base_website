'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Badge } from '@/components/ui/badge'
import { MapPin, Wallet, Phone } from 'lucide-react'

export function DriverList() {
  const drivers = useQuery(api.dispatch.getAvailableDrivers)

  if (!drivers) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-gray-400">Loading drivers...</div>
      </div>
    )
  }

  if (drivers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No drivers currently on duty</p>
        <p className="text-sm text-gray-400 mt-2">
          Drivers need to be on-duty to receive order assignments
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {drivers.map((driver) => (
        <div
          key={driver.driverId}
          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">{driver.name}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <Phone className="h-3 w-3" />
                {driver.phone}
              </p>
            </div>
            <Badge variant="default" className="bg-green-500">
              On Duty
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            {driver.distanceFromWarehouse !== null ? (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>
                  {driver.distanceFromWarehouse.toFixed(1)} km from warehouse
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="h-4 w-4" />
                <span>Location unavailable</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-gray-600">
              <Wallet className="h-4 w-4" />
              <span>COD Wallet: ${driver.codWallet.toFixed(2)}</span>
            </div>

            {driver.lastLocationUpdate && (
              <p className="text-xs text-gray-400">
                Last update:{' '}
                {new Date(driver.lastLocationUpdate).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

