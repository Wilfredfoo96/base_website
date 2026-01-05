'use client'

import dynamic from 'next/dynamic'

// Dynamically import the map component to avoid SSR issues
const GoogleMapsMap = dynamic(() => import('./GoogleMapsMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center bg-gray-100 rounded-lg border">
      <div className="text-center">
        <div className="animate-pulse text-gray-400">Loading map...</div>
      </div>
    </div>
  ),
})

export function LiveFleetMap() {
  return (
    <div className="w-full">
      <GoogleMapsMap />
    </div>
  )
}

