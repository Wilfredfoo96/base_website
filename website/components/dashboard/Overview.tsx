'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function Overview() {
  const stats = useQuery(api.dashboard.getStats, { timeRange: 'month' })

  if (!stats) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="animate-pulse text-gray-400">Loading chart data...</div>
      </div>
    )
  }

  // Prepare chart data
  const chartData = [
    {
      name: 'Delivered',
      value: stats.orders.delivered,
    },
    {
      name: 'Failed',
      value: stats.orders.failed,
    },
    {
      name: 'Returned',
      value: stats.orders.returned,
    },
  ]

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
