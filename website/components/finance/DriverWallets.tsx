'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SettlementModal } from './SettlementModal'
import { Wallet, Search, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

export function DriverWallets() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false)

  const wallets = useQuery(api.drivers.getWallets)

  const filteredWallets = wallets?.filter((wallet) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return wallet.name.toLowerCase().includes(query)
  })

  // Sort by balance (highest first)
  const sortedWallets = filteredWallets
    ? [...filteredWallets].sort((a, b) => b.codWallet - a.codWallet)
    : []

  const totalBalance = sortedWallets.reduce((sum, w) => sum + w.codWallet, 0)

  const handleSettle = (driverId: string) => {
    setSelectedDriverId(driverId)
    setIsSettlementModalOpen(true)
  }

  if (!wallets) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-gray-400">Loading wallets...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-900">Total COD Balance</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            ${totalBalance.toFixed(2)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border">
          <p className="text-sm font-medium text-gray-600 mb-2">Active Wallets</p>
          <p className="text-2xl font-bold text-gray-900">
            {sortedWallets.filter((w) => w.codWallet > 0).length}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border">
          <p className="text-sm font-medium text-gray-600 mb-2">Total Drivers</p>
          <p className="text-2xl font-bold text-gray-900">{sortedWallets.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by driver name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Wallets Table */}
      {sortedWallets.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No drivers found</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    COD Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Settlement
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedWallets.map((wallet) => (
                  <tr key={wallet.driverId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {wallet.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {wallet.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <Badge
                          variant={wallet.codWallet > 0 ? 'default' : 'secondary'}
                          className={
                            wallet.codWallet > 0
                              ? 'bg-green-600 text-white'
                              : ''
                          }
                        >
                          ${wallet.codWallet.toFixed(2)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {wallet.lastSettlement
                        ? format(new Date(wallet.lastSettlement), 'MMM d, yyyy')
                        : 'Never'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        size="sm"
                        onClick={() => handleSettle(wallet.driverId)}
                        disabled={wallet.codWallet === 0}
                        variant={wallet.codWallet > 0 ? 'default' : 'outline'}
                      >
                        Settle Cash
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settlement Modal */}
      {selectedDriverId && (
        <SettlementModal
          driverId={selectedDriverId}
          open={isSettlementModalOpen}
          onClose={() => {
            setIsSettlementModalOpen(false)
            setSelectedDriverId(null)
          }}
        />
      )}
    </div>
  )
}

