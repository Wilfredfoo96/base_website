'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { CheckCircle2, XCircle } from 'lucide-react'

export function VerificationHistory() {
  const history = useQuery(api.payments.getVerificationHistory, { limit: 50 })

  if (!history) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-gray-400">Loading history...</div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No verification history</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-semibold">Date & Time</th>
              <th className="text-left p-3 font-semibold">Action</th>
              <th className="text-left p-3 font-semibold">Order ID</th>
              <th className="text-left p-3 font-semibold">Amount</th>
              <th className="text-left p-3 font-semibold">Admin</th>
              <th className="text-left p-3 font-semibold">Reason</th>
            </tr>
          </thead>
          <tbody>
            {history.map((log) => {
              const isApproved = log.action === 'PAYMENT_APPROVED'
              const metadata = log.metadata as {
                amount?: number
                reason?: string
              }

              return (
                <tr key={log.logId} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={isApproved ? 'default' : 'destructive'}
                      className="flex items-center gap-1 w-fit"
                    >
                      {isApproved ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {isApproved ? 'Approved' : 'Rejected'}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-xs">{log.targetId}</td>
                  <td className="p-3">
                    {metadata.amount ? `$${metadata.amount.toFixed(2)}` : '-'}
                  </td>
                  <td className="p-3 text-gray-600">{log.adminId}</td>
                  <td className="p-3 text-gray-600">
                    {metadata.reason || '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

