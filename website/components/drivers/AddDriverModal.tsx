'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useUser } from '@clerk/nextjs'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, UserPlus } from 'lucide-react'

interface AddDriverModalProps {
  open: boolean
  onClose: () => void
}

function generateDriverId(): string {
  return `driver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function AddDriverModal({ open, onClose }: AddDriverModalProps) {
  const { user } = useUser()
  const createDriver = useMutation(api.drivers.create)
  const users = useQuery(api.users.getUsers, { limit: 1000 })
  const drivers = useQuery(api.drivers.getAll, {})

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [clerkId, setClerkId] = useState('')
  const [driverId, setDriverId] = useState(generateDriverId())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter users who aren't already drivers
  const driverClerkIds = new Set(drivers?.map((d) => d.clerkId) || [])
  const availableUsers = users?.page?.filter((u) => {
    // Exclude users who are already registered as drivers
    return !driverClerkIds.has(u.clerkId)
  })

  useEffect(() => {
    if (open) {
      // Reset form
      setName('')
      setPhone('')
      setClerkId('')
      setDriverId(generateDriverId())
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !phone.trim() || !clerkId) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await createDriver({
        driverId,
        clerkId,
        name: name.trim(),
        phone: phone.trim(),
      })
      onClose()
    } catch (error: any) {
      console.error('Failed to create driver:', error)
      setError(error.message || 'Failed to create driver. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Driver
          </DialogTitle>
          <DialogDescription>
            Create a new driver account. The driver must have a Clerk account first.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Driver ID (auto-generated) */}
          <div className="space-y-2">
            <Label htmlFor="driverId">Driver ID</Label>
            <div className="flex gap-2">
              <Input
                id="driverId"
                value={driverId}
                readOnly
                className="bg-gray-50"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDriverId(generateDriverId())}
                title="Generate new ID"
              >
                🔄
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Auto-generated unique identifier
            </p>
          </div>

          {/* Clerk User Selection */}
          <div className="space-y-2">
            <Label htmlFor="clerkId">Clerk User *</Label>
            <Select value={clerkId} onValueChange={setClerkId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Clerk user" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers && availableUsers.length > 0 ? (
                  availableUsers.map((u) => (
                    <SelectItem key={u.clerkId} value={u.clerkId}>
                      {u.firstName} {u.lastName} ({u.email})
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    No users available
                  </div>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Select the Clerk user account for this driver
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Driver Name *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John Doe"
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
              placeholder="e.g., +1234567890"
              required
            />
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
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Driver
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

