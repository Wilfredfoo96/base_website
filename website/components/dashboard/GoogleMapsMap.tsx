'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Libraries } from '@react-google-maps/api'

const libraries: Libraries = ['places']

const mapContainerStyle = {
  width: '100%',
  height: '600px',
}

const defaultCenter = {
  lat: 0,
  lng: 0,
}

export default function GoogleMapsMap() {
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const activeDrivers = useQuery(api.dashboard.getActiveDrivers)

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey || '',
    libraries,
  })

  // Fit bounds to show all drivers
  useEffect(() => {
    if (!map || !activeDrivers || activeDrivers.length === 0) return

    const bounds = new google.maps.LatLngBounds()

    activeDrivers.forEach((driver) => {
      if (driver.location) {
        bounds.extend({
          lat: driver.location.lat,
          lng: driver.location.lng,
        })
      }
    })

    if (activeDrivers.length > 0 && activeDrivers[0].location) {
      map.fitBounds(bounds, 50)
    }
  }, [map, activeDrivers])

  if (loadError) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-100 rounded-lg border">
        <div className="text-center p-6">
          <p className="text-gray-600 font-medium mb-2">Error Loading Google Maps</p>
          <p className="text-sm text-gray-500">{loadError.message}</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-100 rounded-lg border">
        <div className="text-center">
          <div className="animate-pulse text-gray-400">Loading map...</div>
        </div>
      </div>
    )
  }

  if (!googleMapsApiKey) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-100 rounded-lg border">
        <div className="text-center p-6">
          <p className="text-gray-600 font-medium mb-2">Google Maps API Key Required</p>
          <p className="text-sm text-gray-500">
            Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Get your API key at{' '}
            <a
              href="https://console.cloud.google.com/google/maps-apis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Google Cloud Console
            </a>
          </p>
        </div>
      </div>
    )
  }

  // Calculate center from drivers if available
  const center = activeDrivers && activeDrivers.length > 0 && activeDrivers[0].location
    ? {
        lat: activeDrivers[0].location.lat,
        lng: activeDrivers[0].location.lng,
      }
    : defaultCenter

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={10}
        onLoad={(map) => setMap(map)}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        {activeDrivers?.map((driver) => {
          if (!driver.location) return null

          return (
            <div key={driver.driverId}>
              <Marker
                position={{
                  lat: driver.location.lat,
                  lng: driver.location.lng,
                }}
                onClick={() => setSelectedDriver(driver.driverId)}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#3b82f6',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                }}
              />
              {selectedDriver === driver.driverId && (
                <InfoWindow
                  onCloseClick={() => setSelectedDriver(null)}
                  position={{
                    lat: driver.location.lat,
                    lng: driver.location.lng,
                  }}
                >
                  <div className="p-2">
                    <h3 className="font-semibold text-sm">{driver.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Last update: {new Date(driver.lastUpdate).toLocaleTimeString()}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </div>
          )
        })}
      </GoogleMap>
      {activeDrivers && activeDrivers.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <p className="text-sm font-semibold mb-2">Active Drivers</p>
          <p className="text-2xl font-bold text-blue-600">{activeDrivers.length}</p>
        </div>
      )}
    </div>
  )
}

