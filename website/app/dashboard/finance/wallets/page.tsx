import { DriverWallets } from '@/components/finance/DriverWallets'
import { SettlementHistory } from '@/components/finance/SettlementHistory'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function WalletsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Driver Wallets</h1>
        <p className="text-muted-foreground">
          Manage COD collections and driver settlements
        </p>
      </div>

      {/* Driver Wallets */}
      <Card>
        <CardHeader>
          <CardTitle>COD Wallets</CardTitle>
          <CardDescription>
            Current COD balances for all drivers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DriverWallets />
        </CardContent>
      </Card>

      {/* Settlement History */}
      <Card>
        <CardHeader>
          <CardTitle>Settlement History</CardTitle>
          <CardDescription>
            Complete log of all driver settlements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettlementHistory />
        </CardContent>
      </Card>
    </div>
  )
}

