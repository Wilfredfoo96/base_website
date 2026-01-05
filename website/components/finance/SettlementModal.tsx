'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
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
import { Loader2, DollarSign } from 'lucide-react'

interface SettlementModalProps {
  driverId: string
  open: boolean
  onClose: () => void
}

export function SettlementModal({ driverId, open, onClose }: SettlementModalProps) {
  const { user } = useUser()
  const driver = useQuery(api.drivers.getById, { driverId })
  const settleWallet = useMutation(api.drivers.settleWallet)

  const [settlementAmount, setSettlementAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open && driver) {
      // Pre-fill with full balance for full settlement
      setSettlementAmount(driver.codWallet.toString())
    }
  }, [open, driver])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !settlementAmount) return

    const amount = parseFloat(settlementAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (driver && amount > driver.codWallet) {
      alert('Settlement amount cannot exceed wallet balance')
      return
    }

    setIsSubmitting(true)
    try {
      await settleWallet({
        driverId,
        amount: amount === driver?.codWallet ? undefined : amount, // Full settlement if amount equals balance
        adminId: user.id,
      })
      onClose()
    } catch (error: any) {
      console.error('Failed to settle wallet:', error)
      alert(error.message || 'Failed to settle wallet. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!driver) {
    return null
  }

  const isFullSettlement = settlementAmount && parseFloat(settlementAmount) === driver.codWallet
  const newBalance = settlementAmount
    ? Math.max(0, driver.codWallet - parseFloat(settlementAmount || '0'))
    : 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settle Driver Wallet</DialogTitle>
          <DialogDescription>
            Process COD settlement for {driver.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Current Balance</p>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <p className="text-xl font-bold text-gray-900">
                  ${driver.codWallet.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Settlement Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max={driver.codWallet}
              value={settlementAmount}
              onChange={(e) => setSettlementAmount(e.target.value)}
              required
              placeholder="Enter amount to settle"
            />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <button
                type="button"
                onClick={() => setSettlementAmount(driver.codWallet.toString())}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Full settlement (${driver.codWallet.toFixed(2)})
              </button>
            </div>
          </div>

          {settlementAmount && !isNaN(parseFloat(settlementAmount)) && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-900">New Balance</p>
                <p className="text-lg font-bold text-blue-900">
                  ${newBalance.toFixed(2)}
                </p>
              </div>
              {isFullSettlement && (
                <p className="text-xs text-blue-700 mt-1">
                  Wallet will be reset to $0.00
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !settlementAmount}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Settle Cash'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

