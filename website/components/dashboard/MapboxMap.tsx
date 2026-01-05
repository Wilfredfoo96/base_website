'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import mapboxgl from 'mapbox-gl'

// Import Mapbox CSS
if (typeof window !== 'undefined') {
  require('mapbox-gl/dist/mapbox-gl.css')
}

export default function MapboxMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const [mapLoaded, setMapLoaded] = useState(false)

  const activeDrivers = useQuery(api.dashboard.getActiveDrivers)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    if (!mapboxToken) {
      console.warn('Mapbox token not found. Please add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local')
      return
    }

    mapboxgl.accessToken = mapboxToken

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [0, 0], // Default center, will be updated based on drivers
      zoom: 10,
    })

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update markers when drivers change
  useEffect(() => {
    if (!map.current || !mapLoaded || !activeDrivers) return

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    if (activeDrivers.length === 0) {
      return
    }

    // Create markers for each driver
    activeDrivers.forEach((driver) => {
      if (!driver.location) return

      const el = document.createElement('div')
      el.className = 'driver-marker'
      el.style.width = '32px'
      el.style.height = '32px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = '#3b82f6'
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
      el.style.cursor = 'pointer'

      if (map.current) {
        const marker = new mapboxgl.Marker(el)
          .setLngLat([driver.location.lng, driver.location.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div class="p-2">
                <h3 class="font-semibold text-sm">${driver.name}</h3>
                <p class="text-xs text-gray-600 mt-1">
                  Last update: ${new Date(driver.lastUpdate).toLocaleTimeString()}
                </p>
              </div>
            `)
          )
          .addTo(map.current)

        markersRef.current.set(driver.driverId, marker)
      }
    })

    // Fit map to show all drivers
    if (activeDrivers.length > 0 && activeDrivers[0].location) {
      const bounds = new mapboxgl.LngLatBounds()

      activeDrivers.forEach((driver) => {
        if (driver.location) {
          bounds.extend([driver.location.lng, driver.location.lat])
        }
      })

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
      })
    }
  }, [activeDrivers, mapLoaded])

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!mapboxToken) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-100 rounded-lg border">
        <div className="text-center p-6">
          <p className="text-gray-600 font-medium mb-2">Mapbox Token Required</p>
          <p className="text-sm text-gray-500">
            Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Get your token at{' '}
            <a
              href="https://account.mapbox.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              mapbox.com
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={mapContainer} className="h-[600px] w-full rounded-lg border" />
      {activeDrivers && activeDrivers.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <p className="text-sm font-semibold mb-2">Active Drivers</p>
          <p className="text-2xl font-bold text-blue-600">{activeDrivers.length}</p>
        </div>
      )}
    </div>
  )
}

