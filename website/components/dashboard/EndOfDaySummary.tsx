'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function EndOfDaySummary() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today')
  const stats = useQuery(api.dashboard.getStats, { timeRange })

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>End of Day Summary</CardTitle>
          <CardDescription>Loading statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>End of Day Summary</CardTitle>
            <CardDescription>
              Financial snapshot and delivery statistics
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={(value: 'today' | 'week' | 'month') => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Orders Delivered */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Orders Delivered</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-green-600">{stats.orders.delivered}</p>
              {stats.comparison.deliveredChange !== 0 && (
                <p
                  className={`text-sm ${
                    stats.comparison.deliveredChange >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatPercent(stats.comparison.deliveredChange)}
                </p>
              )}
            </div>
          </div>

          {/* Orders Failed */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Orders Failed</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-red-600">{stats.orders.failed}</p>
              {stats.comparison.failedChange !== 0 && (
                <p
                  className={`text-sm ${
                    stats.comparison.failedChange <= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatPercent(stats.comparison.failedChange)}
                </p>
              )}
            </div>
          </div>

          {/* Bank Transfer Amount */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Bank Transfer Verified</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(stats.financial.bankTransfer)}
            </p>
          </div>

          {/* COD Collected */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">COD Collected</p>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(stats.financial.cod)}
            </p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-gray-900">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.financial.total)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

