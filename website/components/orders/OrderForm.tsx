'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, X } from 'lucide-react'

interface OrderFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export function OrderForm({ onSuccess, onCancel }: OrderFormProps) {
  const products = useQuery(api.products.getAll)
  const createOrder = useMutation(api.orders.create)

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    paymentMethod: 'COD' as 'COD' | 'BANK_TRANSFER',
    deliveryAddress: {
      label: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: {
        lat: 0,
        lng: 0,
      },
      instructions: '',
    },
    deliveryNotes: '',
  })

  const [items, setItems] = useState<OrderItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [itemQuantity, setItemQuantity] = useState<string>('1')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-generate customerId if empty
  useEffect(() => {
    if (!formData.customerId) {
      setFormData((prev) => ({
        ...prev,
        customerId: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }))
    }
  }, [])

  const handleAddItem = () => {
    if (!selectedProductId || !itemQuantity) return

    const product = products?.find((p) => p.productId === selectedProductId)
    if (!product) return

    const quantity = parseInt(itemQuantity)
    if (quantity <= 0 || quantity > product.stockLevel) {
      setError(`Invalid quantity. Available stock: ${product.stockLevel}`)
      return
    }

    const unitPrice = product.price
    const subtotal = unitPrice * quantity

    setItems([
      ...items,
      {
        productId: product.productId,
        productName: product.name,
        quantity,
        unitPrice,
        subtotal,
      },
    ])

    setSelectedProductId('')
    setItemQuantity('1')
    setError(null)
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...items]
    const product = products?.find((p) => p.productId === updatedItems[index].productId)
    if (!product) return

    if (quantity <= 0 || quantity > product.stockLevel) {
      setError(`Invalid quantity. Available stock: ${product.stockLevel}`)
      return
    }

    updatedItems[index].quantity = quantity
    updatedItems[index].subtotal = updatedItems[index].unitPrice * quantity
    setItems(updatedItems)
    setError(null)
  }

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      setError('Customer name and phone are required')
      return
    }

    if (items.length === 0) {
      setError('Please add at least one item to the order')
      return
    }

    if (
      !formData.deliveryAddress.street.trim() ||
      !formData.deliveryAddress.city.trim() ||
      !formData.deliveryAddress.state.trim() ||
      !formData.deliveryAddress.zipCode.trim()
    ) {
      setError('Please provide a complete delivery address')
      return
    }

    if (formData.deliveryAddress.coordinates.lat === 0 && formData.deliveryAddress.coordinates.lng === 0) {
      setError('Please provide delivery address coordinates (lat/lng)')
      return
    }

    setIsSubmitting(true)
    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await createOrder({
        orderId,
        customerId: formData.customerId,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        paymentMethod: formData.paymentMethod,
        totalAmount,
        items,
        deliveryAddress: {
          label: formData.deliveryAddress.label || undefined,
          street: formData.deliveryAddress.street.trim(),
          city: formData.deliveryAddress.city.trim(),
          state: formData.deliveryAddress.state.trim(),
          zipCode: formData.deliveryAddress.zipCode.trim(),
          coordinates: formData.deliveryAddress.coordinates,
          instructions: formData.deliveryAddress.instructions || undefined,
        },
        deliveryNotes: formData.deliveryNotes || undefined,
      })
      onSuccess()
    } catch (error: any) {
      console.error('Failed to create order:', error)
      setError(error.message || 'Failed to create order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!products) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-gray-400">Loading products...</div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No products available. Please create products first.</p>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Customer Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Customer Phone *</Label>
            <Input
              id="customerPhone"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerId">Customer ID</Label>
          <Input
            id="customerId"
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            placeholder="Auto-generated"
          />
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Order Items</h3>
        <div className="flex gap-2">
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select product..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.productId} value={product.productId}>
                  {product.name} - ${product.price.toFixed(2)} (Stock: {product.stockLevel})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min="1"
            value={itemQuantity}
            onChange={(e) => setItemQuantity(e.target.value)}
            placeholder="Qty"
            className="w-24"
          />
          <Button type="button" onClick={handleAddItem} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {items.length > 0 && (
          <div className="border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">Product</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Price</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Quantity</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Subtotal</th>
                  <th className="px-4 py-2 text-left text-sm font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const product = products.find((p) => p.productId === item.productId)
                  return (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{item.productName}</td>
                      <td className="px-4 py-2">${item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min="1"
                          max={product?.stockLevel || 0}
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItemQuantity(index, parseInt(e.target.value) || 1)
                          }
                          className="w-20"
                        />
                      </td>
                      <td className="px-4 py-2">${item.subtotal.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right font-semibold">
                    Total:
                  </td>
                  <td className="px-4 py-2 font-semibold">${totalAmount.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Payment Method *</Label>
        <Select
          value={formData.paymentMethod}
          onValueChange={(value: 'COD' | 'BANK_TRANSFER') =>
            setFormData({ ...formData, paymentMethod: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="COD">Cash on Delivery (COD)</SelectItem>
            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Delivery Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Delivery Address</h3>
        <div className="space-y-2">
          <Label htmlFor="addressLabel">Address Label (optional)</Label>
          <Input
            id="addressLabel"
            value={formData.deliveryAddress.label}
            onChange={(e) =>
              setFormData({
                ...formData,
                deliveryAddress: { ...formData.deliveryAddress, label: e.target.value },
              })
            }
            placeholder="e.g., Home, Office"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="street">Street Address *</Label>
          <Input
            id="street"
            value={formData.deliveryAddress.street}
            onChange={(e) =>
              setFormData({
                ...formData,
                deliveryAddress: { ...formData.deliveryAddress, street: e.target.value },
              })
            }
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.deliveryAddress.city}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  deliveryAddress: { ...formData.deliveryAddress, city: e.target.value },
                })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={formData.deliveryAddress.state}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  deliveryAddress: { ...formData.deliveryAddress, state: e.target.value },
                })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">Zip Code *</Label>
            <Input
              id="zipCode"
              value={formData.deliveryAddress.zipCode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  deliveryAddress: { ...formData.deliveryAddress, zipCode: e.target.value },
                })
              }
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lat">Latitude *</Label>
            <Input
              id="lat"
              type="number"
              step="any"
              value={formData.deliveryAddress.coordinates.lat || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  deliveryAddress: {
                    ...formData.deliveryAddress,
                    coordinates: {
                      ...formData.deliveryAddress.coordinates,
                      lat: parseFloat(e.target.value) || 0,
                    },
                  },
                })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lng">Longitude *</Label>
            <Input
              id="lng"
              type="number"
              step="any"
              value={formData.deliveryAddress.coordinates.lng || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  deliveryAddress: {
                    ...formData.deliveryAddress,
                    coordinates: {
                      ...formData.deliveryAddress.coordinates,
                      lng: parseFloat(e.target.value) || 0,
                    },
                  },
                })
              }
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Delivery Instructions (optional)</Label>
          <Textarea
            id="instructions"
            value={formData.deliveryAddress.instructions}
            onChange={(e) =>
              setFormData({
                ...formData,
                deliveryAddress: { ...formData.deliveryAddress, instructions: e.target.value },
              })
            }
            rows={2}
          />
        </div>
      </div>

      {/* Delivery Notes */}
      <div className="space-y-2">
        <Label htmlFor="deliveryNotes">Order Notes (optional)</Label>
        <Textarea
          id="deliveryNotes"
          value={formData.deliveryNotes}
          onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
          rows={3}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || items.length === 0}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Order'
          )}
        </Button>
      </div>
    </form>
  )
}

