'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EditDriverModal } from './EditDriverModal'
import { Search, Edit, MapPin, DollarSign, Phone, User } from 'lucide-react'
import { format } from 'date-fns'

export function DriverList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const drivers = useQuery(api.drivers.getAll, {})

  const filteredDrivers = drivers?.filter((driver) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      driver.name.toLowerCase().includes(query) ||
      driver.phone.toLowerCase().includes(query) ||
      driver.driverId.toLowerCase().includes(query)
    )
  })

  const handleEdit = (driverId: string) => {
    setSelectedDriver(driverId)
    setIsEditModalOpen(true)
  }

  if (!drivers) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-gray-400">Loading drivers...</div>
      </div>
    )
  }

  if (drivers.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-gray-50">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 font-medium mb-2">No drivers found</p>
        <p className="text-sm text-gray-400">Add your first driver to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by name, phone, or driver ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Driver Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  COD Wallet
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDrivers?.map((driver) => (
                <tr key={driver.driverId} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {driver.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{driver.name}</p>
                        <p className="text-xs text-gray-500">ID: {driver.driverId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {driver.phone}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge
                      variant={driver.isOnDuty ? 'default' : 'secondary'}
                      className={driver.isOnDuty ? 'bg-green-600 text-white' : ''}
                    >
                      {driver.isOnDuty ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          On Duty
                        </span>
                      ) : (
                        'Off Duty'
                      )}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        ${driver.codWallet.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(driver.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(driver.driverId)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Driver Modal */}
      {selectedDriver && (
        <EditDriverModal
          driverId={selectedDriver}
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedDriver(null)
          }}
        />
      )}
    </div>
  )
}

