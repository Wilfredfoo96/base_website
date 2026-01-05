import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origin, destination } = body

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    // Call Google Distance Matrix API
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
    url.searchParams.set('origins', `${origin.lat},${origin.lng}`)
    url.searchParams.set('destinations', `${destination.lat},${destination.lng}`)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('units', 'metric')

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: data.error_message || 'Distance calculation failed' },
        { status: 400 }
      )
    }

    const element = data.rows[0]?.elements[0]
    if (!element || element.status !== 'OK') {
      return NextResponse.json(
        { error: 'Could not calculate distance' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      distance: element.distance.value / 1000, // Convert meters to kilometers
      duration: element.duration.value / 60, // Convert seconds to minutes
      distanceText: element.distance.text,
      durationText: element.duration.text,
    })
  } catch (error: any) {
    console.error('Distance calculation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

