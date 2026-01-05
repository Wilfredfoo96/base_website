'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Package, TrendingUp } from 'lucide-react'

export function StockHistory() {
  const [productFilter, setProductFilter] = useState<string>('all')
  const [limit, setLimit] = useState(50)

  const stockHistory = useQuery(api.inventory.getStockHistory, {
    productId: productFilter !== 'all' ? productFilter : undefined,
    limit,
  })
  const allProducts = useQuery(api.products.getAll, {})

  if (!stockHistory || !allProducts) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-gray-400">Loading stock history...</div>
      </div>
    )
  }

  if (stockHistory.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-gray-50">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">No stock history</p>
        <p className="text-sm text-gray-400 mt-2">
          Stock movements will appear here once products are restocked
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {allProducts.map((product) => (
              <SelectItem key={product.productId} value={product.productId}>
                {product.name} ({product.sku})
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
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New Stock Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockHistory.map((log) => {
                const metadata = log.metadata as {
                  quantity?: number
                  reason?: string
                  newStockLevel?: number
                }
                const product = allProducts.find((p) => p.productId === log.targetId)

                return (
                  <tr key={log.logId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="font-medium text-sm">
                            {product?.name || 'Unknown Product'}
                          </p>
                          {product && (
                            <p className="text-xs text-gray-500">{product.sku}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="default" className="bg-green-600">
                        +{metadata.quantity || 0}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold">
                        {metadata.newStockLevel || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">
                        {metadata.reason || '—'}
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

