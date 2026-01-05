'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Wallet, User } from 'lucide-react'

export function SettlementHistory() {
  const [driverFilter, setDriverFilter] = useState<string>('all')
  const [limit, setLimit] = useState(50)

  const settlementHistory = useQuery(api.finance.getSettlementHistory, {
    driverId: driverFilter !== 'all' ? driverFilter : undefined,
    limit,
  })
  const allDrivers = useQuery(api.drivers.getAll, {})

  if (!settlementHistory || !allDrivers) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-gray-400">Loading settlement history...</div>
      </div>
    )
  }

  if (settlementHistory.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-gray-50">
        <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">No settlement history</p>
        <p className="text-sm text-gray-400 mt-2">
          Settlements will appear here once processed
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Select value={driverFilter} onValueChange={setDriverFilter}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by driver" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            {allDrivers.map((driver) => (
              <SelectItem key={driver.driverId} value={driver.driverId}>
                {driver.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* History Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Settlement Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Previous Balance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settlementHistory.map((log) => {
                const metadata = log.metadata as {
                  amount?: number
                  previousBalance?: number
                }
                const driver = allDrivers.find((d) => d.driverId === log.targetId)

                return (
                  <tr key={log.logId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <p className="font-medium text-sm">
                          {driver?.name || 'Unknown Driver'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="default" className="bg-green-600">
                        ${metadata.amount?.toFixed(2) || '0.00'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-gray-600">
                        ${metadata.previousBalance?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {log.adminId}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

