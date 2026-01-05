import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Overview } from '@/components/dashboard/Overview'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { EndOfDaySummary } from '@/components/dashboard/EndOfDaySummary'
import { LiveFleetMap } from '@/components/dashboard/LiveFleetMap'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your logistics operations.
        </p>
      </div>

      {/* Quick Stats Cards */}
      <QuickStats />

      {/* End of Day Summary */}
      <EndOfDaySummary />

      {/* Live Fleet Map */}
      <Card>
        <CardHeader>
          <CardTitle>Live Fleet Map</CardTitle>
          <CardDescription>
            Real-time location of all active drivers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LiveFleetMap />
        </CardContent>
      </Card>

      {/* Charts and Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Order Overview</CardTitle>
            <CardDescription>
              Monthly order delivery statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest system updates and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
