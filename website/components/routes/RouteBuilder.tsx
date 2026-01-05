'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { api } from '@/convex/_generated/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { StopList } from './StopList'
import { ManifestPreview } from './ManifestPreview'
import { Loader2, Sparkles } from 'lucide-react'

export function RouteBuilder() {
  const { user } = useUser()
  const availableDrivers = useQuery(api.dispatch.getAvailableDrivers)
  const [selectedDriverId, setSelectedDriverId] = useState<string>('')
  const [orderSequence, setOrderSequence] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const driverAssignedOrders = useQuery(
    api.routes.getDriverAssignedOrders,
    selectedDriverId ? { driverId: selectedDriverId } : 'skip'
  )

  const optimizeRoute = useMutation(api.routes.optimizeRoute)
  const createManifest = useMutation(api.routes.createManifest)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Initialize order sequence when orders are loaded
  if (driverAssignedOrders && orderSequence.length === 0 && driverAssignedOrders.length > 0) {
    setOrderSequence(driverAssignedOrders.map((o) => o.orderId))
  }

  // Reset sequence when driver changes
  const handleDriverChange = (driverId: string) => {
    setSelectedDriverId(driverId)
    setOrderSequence([])
    setShowPreview(false)
  }

  const handleOptimize = async () => {
    if (!user?.id || !selectedDriverId || orderSequence.length === 0) return

    setIsOptimizing(true)
    try {
      // For now, use a simple nearest-neighbor optimization
      // In production, you'd use Google Maps API or similar
      const optimized = await optimizeRouteLocally(
        driverAssignedOrders || [],
        orderSequence
      )
      setOrderSequence(optimized)
    } catch (error) {
      console.error('Failed to optimize route:', error)
      alert('Failed to optimize route. Please try again.')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleCreateManifest = async () => {
    if (!user?.id || !selectedDriverId || orderSequence.length === 0) return

    setIsCreating(true)
    try {
      const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await createManifest({
        routeId,
        driverId: selectedDriverId,
        orderIds: orderSequence,
        adminId: user.id,
      })
      setShowPreview(false)
      setOrderSequence([])
      setSelectedDriverId('')
      alert('Route created successfully!')
    } catch (error) {
      console.error('Failed to create manifest:', error)
      alert('Failed to create route. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const selectedDriver = availableDrivers?.find((d) => d.driverId === selectedDriverId)

  if (!availableDrivers) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Driver Selection */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Select Driver</label>
          <Select value={selectedDriverId} onValueChange={handleDriverChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a driver..." />
            </SelectTrigger>
            <SelectContent>
              {availableDrivers.map((driver) => (
                <SelectItem key={driver.driverId} value={driver.driverId}>
                  {driver.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {orderSequence.length > 0 && (
          <Button
            variant="outline"
            onClick={handleOptimize}
            disabled={isOptimizing}
          >
            {isOptimizing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Auto-Optimize
              </>
            )}
          </Button>
        )}
      </div>

      {/* Orders List */}
      {!selectedDriverId ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500">Select a driver to view their assigned orders</p>
        </div>
      ) : !driverAssignedOrders ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-gray-400">Loading orders...</div>
        </div>
      ) : driverAssignedOrders.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500">No assigned orders for this driver</p>
          <p className="text-sm text-gray-400 mt-2">
            Assign orders to this driver first in the Dispatch page
          </p>
        </div>
      ) : (
        <>
          <StopList
            orders={driverAssignedOrders}
            sequence={orderSequence}
            onSequenceChange={setOrderSequence}
          />

          {/* Create Manifest Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={orderSequence.length === 0}
            >
              Preview Manifest
            </Button>
            <Button
              onClick={handleCreateManifest}
              disabled={orderSequence.length === 0 || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Manifest'
              )}
            </Button>
          </div>
        </>
      )}

      {/* Manifest Preview Modal */}
      {showPreview && selectedDriverId && (
        <ManifestPreview
          driverId={selectedDriverId}
          orderIds={orderSequence}
          onClose={() => setShowPreview(false)}
          onCreate={handleCreateManifest}
        />
      )}
    </div>
  )
}

/**
 * Simple nearest-neighbor route optimization
 * In production, use Google Maps Distance Matrix API
 */
function optimizeRouteLocally(
  orders: Array<{ orderId: string; deliveryAddress: { coordinates: { lat: number; lng: number } } }>,
  currentSequence: string[]
): Promise<string[]> {
  // Get warehouse location (would need to fetch from settings)
  // For now, use first order as starting point
  if (orders.length === 0) return Promise.resolve(currentSequence)

  const orderMap = new Map(orders.map((o) => [o.orderId, o]))
  const optimized: string[] = []
  const remaining = new Set(currentSequence)

  // Start with first order (or closest to warehouse)
  let currentOrderId = currentSequence[0]
  optimized.push(currentOrderId)
  remaining.delete(currentOrderId)

  // Nearest neighbor: always pick closest unvisited order
  while (remaining.size > 0) {
    const current = orderMap.get(currentOrderId)
    if (!current) break

    let nearestId: string | null = null
    let nearestDistance = Infinity

    for (const orderId of Array.from(remaining)) {
      const order = orderMap.get(orderId)
      if (!order) continue

      const distance = calculateDistance(
        current.deliveryAddress.coordinates.lat,
        current.deliveryAddress.coordinates.lng,
        order.deliveryAddress.coordinates.lat,
        order.deliveryAddress.coordinates.lng
      )

      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestId = orderId
      }
    }

    if (nearestId) {
      optimized.push(nearestId)
      remaining.delete(nearestId)
      currentOrderId = nearestId
    } else {
      break
    }
  }

  return Promise.resolve(optimized)
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

