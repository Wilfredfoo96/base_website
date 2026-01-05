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
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface RestockModalProps {
  productId: string
  open: boolean
  onClose: () => void
}

export function RestockModal({ productId, open, onClose }: RestockModalProps) {
  const { user } = useUser()
  const product = useQuery(api.products.getById, { productId })
  const restockProduct = useMutation(api.products.restock)

  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setQuantity('')
      setReason('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !quantity) return

    setIsSubmitting(true)
    try {
      await restockProduct({
        productId,
        quantity: parseInt(quantity),
        reason: reason || undefined,
        adminId: user.id,
      })
      onClose()
    } catch (error) {
      console.error('Failed to restock product:', error)
      alert('Failed to restock product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!product) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restock Product</DialogTitle>
          <DialogDescription>
            Add inventory to {product.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Current Stock</p>
                <p className="font-semibold">{product.stockLevel} units</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Price</p>
                <p className="font-semibold">${product.price.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Add *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              placeholder="Enter quantity"
            />
            {quantity && (
              <p className="text-xs text-gray-500">
                New stock level will be:{' '}
                {product.stockLevel + parseInt(quantity || '0')} units
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g., New shipment, Returned goods, etc."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !quantity}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restocking...
                </>
              ) : (
                'Restock Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

