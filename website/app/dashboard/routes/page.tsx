import { RouteBuilder } from '@/components/routes/RouteBuilder'
import { ActiveRoutesView } from '@/components/routes/ActiveRoutesView'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RoutesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Route Management</h1>
        <p className="text-muted-foreground">
          Build and optimize delivery routes for drivers
        </p>
      </div>

      {/* Route Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Route Builder</CardTitle>
          <CardDescription>
            Select a driver and build their delivery route
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RouteBuilder />
        </CardContent>
      </Card>

      {/* Active Routes */}
      <Card>
        <CardHeader>
          <CardTitle>Active Routes</CardTitle>
          <CardDescription>
            Currently active delivery routes and their progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActiveRoutesView />
        </CardContent>
      </Card>
    </div>
  )
}

