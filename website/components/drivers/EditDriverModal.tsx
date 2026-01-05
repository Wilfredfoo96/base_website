'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Edit, ToggleLeft, ToggleRight } from 'lucide-react'

interface EditDriverModalProps {
  driverId: string
  open: boolean
  onClose: () => void
}

export function EditDriverModal({ driverId, open, onClose }: EditDriverModalProps) {
  const driver = useQuery(api.drivers.getById, { driverId })
  const updateDriver = useMutation(api.drivers.update)
  const updateDutyStatus = useMutation(api.drivers.updateDutyStatus)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTogglingDuty, setIsTogglingDuty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (driver && open) {
      setName(driver.name)
      setPhone(driver.phone)
      setError(null)
    }
  }, [driver, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !phone.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await updateDriver({
        driverId,
        name: name.trim(),
        phone: phone.trim(),
      })
      onClose()
    } catch (error: any) {
      console.error('Failed to update driver:', error)
      setError(error.message || 'Failed to update driver. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleDuty = async () => {
    if (!driver) return

    setIsTogglingDuty(true)
    try {
      await updateDutyStatus({
        driverId,
        isOnDuty: !driver.isOnDuty,
      })
    } catch (error: any) {
      console.error('Failed to toggle duty status:', error)
      setError(error.message || 'Failed to update duty status.')
    } finally {
      setIsTogglingDuty(false)
    }
  }

  if (!driver) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Driver
          </DialogTitle>
          <DialogDescription>
            Update driver information and manage duty status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Duty Status Toggle */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Duty Status</p>
                <p className="text-xs text-gray-500 mt-1">
                  {driver.isOnDuty
                    ? 'Driver is currently on duty and available for assignment'
                    : 'Driver is off duty and not available for assignment'}
                </p>
              </div>
              <Button
                type="button"
                variant={driver.isOnDuty ? 'default' : 'outline'}
                onClick={handleToggleDuty}
                disabled={isTogglingDuty}
                className="flex items-center gap-2"
              >
                {isTogglingDuty ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : driver.isOnDuty ? (
                  <>
                    <ToggleRight className="h-4 w-4" />
                    On Duty
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-4 w-4" />
                    Off Duty
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Driver ID (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="driverId">Driver ID</Label>
              <Input
                id="driverId"
                value={driver.driverId}
                readOnly
                className="bg-gray-50"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Driver Name *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            {/* COD Wallet (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="codWallet">COD Wallet Balance</Label>
              <Input
                id="codWallet"
                value={`$${driver.codWallet.toFixed(2)}`}
                readOnly
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                Manage settlements in the Finance section
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

