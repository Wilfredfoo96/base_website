'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { formatDistanceToNow } from 'date-fns'

const actionIcons: Record<string, string> = {
  PAYMENT_APPROVED: '✅',
  PAYMENT_REJECTED: '❌',
  ORDER_ASSIGNED: '📦',
  ORDER_STATUS_CHANGED: '🔄',
  ROUTE_CREATED: '🗺️',
  ROUTE_OPTIMIZED: '⚡',
  DRIVER_SETTLED: '💰',
  STOCK_RESTOCKED: '📥',
  PRODUCT_CREATED: '➕',
  PRODUCT_UPDATED: '✏️',
  ORDER_CANCELLED: '🚫',
}

export function RecentActivity() {
  const logs = useQuery(api.auditLogs.getRecent, { limit: 10 })

  if (!logs) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.logId} className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-lg">
              {actionIcons[log.action] || '📋'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {log.action.replace(/_/g, ' ')}
            </p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}

      <div className="pt-4 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-500 font-medium">
          View all activity →
        </button>
      </div>
    </div>
  )
}
