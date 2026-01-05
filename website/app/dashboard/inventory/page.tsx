import { StockDashboard } from '@/components/inventory/StockDashboard'
import { StockHistory } from '@/components/inventory/StockHistory'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inventory Control</h1>
        <p className="text-muted-foreground">
          Monitor stock levels and manage inventory
        </p>
      </div>

      {/* Stock Dashboard */}
      <StockDashboard />

      {/* Stock History */}
      <Card>
        <CardHeader>
          <CardTitle>Stock History</CardTitle>
          <CardDescription>
            Complete log of all stock movements and changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockHistory />
        </CardContent>
      </Card>
    </div>
  )
}

