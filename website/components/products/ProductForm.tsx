'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface ProductFormProps {
  productId?: string
  onSuccess: () => void
  onCancel: () => void
}

export function ProductForm({ productId, onSuccess, onCancel }: ProductFormProps) {
  const { user } = useUser()
  const existingProduct = useQuery(
    api.products.getById,
    productId ? { productId } : 'skip'
  )

  const createProduct = useMutation(api.products.create)
  const updateProduct = useMutation(api.products.update)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    sku: '',
    imageUrl: '',
    stockLevel: '',
    category: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load existing product data if editing
  useEffect(() => {
    if (existingProduct) {
      setFormData({
        name: existingProduct.name,
        description: existingProduct.description || '',
        price: existingProduct.price.toString(),
        sku: existingProduct.sku,
        imageUrl: existingProduct.imageUrl || '',
        stockLevel: existingProduct.stockLevel.toString(),
        category: existingProduct.category || '',
      })
    }
  }, [existingProduct])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setIsSubmitting(true)
    try {
      if (productId) {
        // Update existing product
        await updateProduct({
          productId,
          name: formData.name,
          description: formData.description || undefined,
          price: parseFloat(formData.price),
          imageUrl: formData.imageUrl || undefined,
          category: formData.category || undefined,
          adminId: user.id,
        })
      } else {
        // Create new product
        const newProductId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        await createProduct({
          productId: newProductId,
          name: formData.name,
          description: formData.description || undefined,
          price: parseFloat(formData.price),
          sku: formData.sku,
          imageUrl: formData.imageUrl || undefined,
          stockLevel: parseInt(formData.stockLevel),
          category: formData.category || undefined,
        })
      }
      onSuccess()
    } catch (error: any) {
      console.error('Failed to save product:', error)
      alert(error.message || 'Failed to save product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            required
            disabled={!!productId}
          />
          {productId && (
            <p className="text-xs text-gray-500">SKU cannot be changed</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stockLevel">Stock Level *</Label>
          <Input
            id="stockLevel"
            type="number"
            min="0"
            value={formData.stockLevel}
            onChange={(e) =>
              setFormData({ ...formData, stockLevel: e.target.value })
            }
            required
            disabled={!!productId}
          />
          {productId && (
            <p className="text-xs text-gray-500">
              Use restock feature to update stock
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          type="url"
          value={formData.imageUrl}
          onChange={(e) =>
            setFormData({ ...formData, imageUrl: e.target.value })
          }
          placeholder="https://example.com/image.jpg"
        />
        {formData.imageUrl && (
          <img
            src={formData.imageUrl}
            alt="Preview"
            className="h-32 w-32 object-cover rounded border"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            productId ? 'Update Product' : 'Create Product'
          )}
        </Button>
      </div>
    </form>
  )
}

