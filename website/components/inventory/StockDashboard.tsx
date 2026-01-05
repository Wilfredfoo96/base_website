'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RestockModal } from './RestockModal'
import { AlertTriangle, Package, TrendingUp } from 'lucide-react'

export function StockDashboard() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)

  const lowStockProducts = useQuery(api.products.getLowStock, { threshold: 10 })
  const allProducts = useQuery(api.products.getAll, {})
  const thresholdSetting = useQuery(api.settings.get, { key: 'low_stock_threshold' })
  const threshold = (thresholdSetting?.value as number) || 10

  // Calculate stock statistics
  const stockStats = allProducts
    ? {
        totalProducts: allProducts.length,
        lowStockCount: lowStockProducts?.length || 0,
        totalStockValue: allProducts.reduce(
          (sum, p) => sum + p.price * p.stockLevel,
          0
        ),
        stockByCategory: allProducts.reduce(
          (acc, p) => {
            const cat = p.category || 'Uncategorized'
            if (!acc[cat]) {
              acc[cat] = { count: 0, totalStock: 0 }
            }
            acc[cat].count++
            acc[cat].totalStock += p.stockLevel
            return acc
          },
          {} as Record<string, { count: number; totalStock: number }>
        ),
      }
    : null

  const handleRestock = (productId: string) => {
    setSelectedProductId(productId)
    setIsRestockModalOpen(true)
  }

  if (!allProducts || !lowStockProducts) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-gray-400">Loading inventory data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats?.totalProducts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stockStats?.lowStockCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Products below {threshold} units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stockStats?.totalStockValue.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">At current prices</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Low Stock Products
            </CardTitle>
            <CardDescription>
              Products that need restocking (below {threshold} units)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge variant="destructive" className="mb-1">
                        {product.stockLevel} units
                      </Badge>
                      <p className="text-xs text-gray-500">
                        ${product.price.toFixed(2)} each
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRestock(product.productId)}
                    >
                      Restock
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock by Category */}
      {stockStats && Object.keys(stockStats.stockByCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stock by Category</CardTitle>
            <CardDescription>Inventory breakdown by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(stockStats.stockByCategory).map(([category, stats]) => (
                <div key={category} className="p-3 border rounded-lg">
                  <p className="font-medium text-sm mb-1">{category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {stats.count} products
                    </span>
                    <span className="text-sm font-semibold">
                      {stats.totalStock} units
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Restock Modal */}
      {selectedProductId && (
        <RestockModal
          productId={selectedProductId}
          open={isRestockModalOpen}
          onClose={() => {
            setIsRestockModalOpen(false)
            setSelectedProductId(null)
          }}
        />
      )}
    </div>
  )
}

