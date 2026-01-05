import { DriverList } from '@/components/dispatch/DriverList'
import { OrderAssignment } from '@/components/dispatch/OrderAssignment'
import { AssignedOrdersView } from '@/components/dispatch/AssignedOrdersView'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DispatchPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dispatch Management</h1>
        <p className="text-muted-foreground">
          Assign orders to drivers and manage deliveries
        </p>
      </div>

      {/* Available Drivers */}
      <Card>
        <CardHeader>
          <CardTitle>Available Drivers</CardTitle>
          <CardDescription>
            On-duty drivers ready for order assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DriverList />
        </CardContent>
      </Card>

      {/* Order Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Assign Orders</CardTitle>
          <CardDescription>
            Select orders and assign them to a driver
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderAssignment />
        </CardContent>
      </Card>

      {/* Assigned Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Orders</CardTitle>
          <CardDescription>
            Orders currently assigned to drivers (not yet in route)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssignedOrdersView />
        </CardContent>
      </Card>
    </div>
  )
}

