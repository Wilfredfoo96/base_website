'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type OrderStatus =
  | 'PENDING_VERIFICATION'
  | 'PENDING_DISPATCH'
  | 'PROCESSING'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED'

interface OrderFiltersProps {
  filters: {
    status?: OrderStatus
    paymentMethod?: 'COD' | 'BANK_TRANSFER'
    paymentStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED'
  }
  onChange: (filters: {
    status?: OrderStatus
    paymentMethod?: 'COD' | 'BANK_TRANSFER'
    paymentStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED'
  }) => void
}

export function OrderFilters({ filters, onChange }: OrderFiltersProps) {
  return (
    <div className="flex gap-2">
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) =>
          onChange({
            ...filters,
            status: value === 'all' ? undefined : (value as OrderStatus),
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
          <SelectItem value="PENDING_DISPATCH">Pending Dispatch</SelectItem>
          <SelectItem value="PROCESSING">Processing</SelectItem>
          <SelectItem value="ASSIGNED">Assigned</SelectItem>
          <SelectItem value="EN_ROUTE">En Route</SelectItem>
          <SelectItem value="DELIVERED">Delivered</SelectItem>
          <SelectItem value="FAILED">Failed</SelectItem>
          <SelectItem value="RETURNED">Returned</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.paymentMethod || 'all'}
        onValueChange={(value) =>
          onChange({
            ...filters,
            paymentMethod: value === 'all' ? undefined : (value as 'COD' | 'BANK_TRANSFER'),
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Payment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Payment</SelectItem>
          <SelectItem value="COD">COD</SelectItem>
          <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

