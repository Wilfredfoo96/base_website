import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { waypoints, origin } = body

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    if (!waypoints || waypoints.length === 0) {
      return NextResponse.json(
        { error: 'At least one waypoint is required' },
        { status: 400 }
      )
    }

    // Call Google Routes API (Directions API with optimizeWaypoints)
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json')
    url.searchParams.set('origin', `${origin.lat},${origin.lng}`)
    
    // If only one waypoint, use it as destination
    // If multiple waypoints, use last as destination and optimize the rest
    if (waypoints.length === 1) {
      url.searchParams.set('destination', `${waypoints[0].lat},${waypoints[0].lng}`)
    } else {
      url.searchParams.set('destination', `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`)
      url.searchParams.set('waypoints', `optimize:true|${waypoints.slice(0, -1).map((w: any) => `${w.lat},${w.lng}`).join('|')}`)
    }
    
    url.searchParams.set('key', apiKey)
    url.searchParams.set('units', 'metric')

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: data.error_message || 'Route optimization failed' },
        { status: 400 }
      )
    }

    const route = data.routes[0]
    if (!route) {
      return NextResponse.json(
        { error: 'No route found' },
        { status: 400 }
      )
    }

    // Extract optimized waypoint order
    // If only one waypoint, no optimization needed
    let optimizedOrder: number[] = []
    let optimizedWaypoints: any[] = []
    
    if (waypoints.length === 1) {
      optimizedOrder = [0]
      optimizedWaypoints = waypoints
    } else {
      optimizedOrder = route.waypoint_order || []
      // Reconstruct waypoints in optimized order (excluding destination)
      const waypointsToOptimize = waypoints.slice(0, -1)
      optimizedWaypoints = [
        ...optimizedOrder.map((index: number) => waypointsToOptimize[index]),
        waypoints[waypoints.length - 1] // Keep destination last
      ]
    }

    return NextResponse.json({
      optimizedWaypoints,
      optimizedOrder,
      distance: route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0) / 1000, // km
      duration: route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0) / 60, // minutes
      polyline: route.overview_polyline.points,
    })
  } catch (error: any) {
    console.error('Route optimization error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

