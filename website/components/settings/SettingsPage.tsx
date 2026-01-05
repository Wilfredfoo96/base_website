'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, MapPin, Package, Building2, Save, CheckCircle2, AlertCircle } from 'lucide-react'

export function SettingsPage() {
  const { user } = useUser()
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch all settings
  const allSettings = useQuery(api.settings.getAll)
  const setSetting = useMutation(api.settings.set)
  const initializeDefaults = useMutation(api.settings.initializeDefaults)

  // Initialize defaults if needed
  useEffect(() => {
    if (user?.id && allSettings && allSettings.length === 0) {
      initializeDefaults({ adminId: user.id }).catch(console.error)
    }
  }, [user?.id, allSettings, initializeDefaults])

  // Extract settings
  const warehouseSetting = allSettings?.find((s) => s.key === 'warehouse_location')
  const lowStockSetting = allSettings?.find((s) => s.key === 'low_stock_threshold')
  const bankSetting = allSettings?.find((s) => s.key === 'bank_details')

  const warehouseLocation = (warehouseSetting?.value as { lat: number; lng: number }) || { lat: 0, lng: 0 }
  const lowStockThreshold = (lowStockSetting?.value as number) || 10
  const bankDetails = (bankSetting?.value as {
    bankName: string
    accountNumber: string
    accountName: string
    routingNumber: string
  }) || {
    bankName: '',
    accountNumber: '',
    accountName: '',
    routingNumber: '',
  }

  // Form state
  const [warehouseLat, setWarehouseLat] = useState(warehouseLocation.lat.toString())
  const [warehouseLng, setWarehouseLng] = useState(warehouseLocation.lng.toString())
  const [threshold, setThreshold] = useState(lowStockThreshold.toString())
  const [bankName, setBankName] = useState(bankDetails.bankName)
  const [accountNumber, setAccountNumber] = useState(bankDetails.accountNumber)
  const [accountName, setAccountName] = useState(bankDetails.accountName)
  const [routingNumber, setRoutingNumber] = useState(bankDetails.routingNumber)

  // Update form when settings load
  useEffect(() => {
    if (warehouseLocation.lat !== 0 || warehouseLocation.lng !== 0) {
      setWarehouseLat(warehouseLocation.lat.toString())
      setWarehouseLng(warehouseLocation.lng.toString())
    }
    setThreshold(lowStockThreshold.toString())
    setBankName(bankDetails.bankName)
    setAccountNumber(bankDetails.accountNumber)
    setAccountName(bankDetails.accountName)
    setRoutingNumber(bankDetails.routingNumber)
  }, [warehouseLocation, lowStockThreshold, bankDetails])

  const handleSaveWarehouse = async () => {
    if (!user?.id) return

    const lat = parseFloat(warehouseLat)
    const lng = parseFloat(warehouseLng)

    if (isNaN(lat) || isNaN(lng)) {
      setSaveStatus({ type: 'error', message: 'Please enter valid coordinates' })
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setSaveStatus({ type: 'error', message: 'Invalid coordinates. Lat: -90 to 90, Lng: -180 to 180' })
      return
    }

    setIsSaving(true)
    setSaveStatus(null)

    try {
      await setSetting({
        key: 'warehouse_location',
        value: { lat, lng },
        updatedBy: user.id,
      })
      setSaveStatus({ type: 'success', message: 'Warehouse location saved successfully!' })
    } catch (error: any) {
      setSaveStatus({ type: 'error', message: error.message || 'Failed to save warehouse location' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveLowStock = async () => {
    if (!user?.id) return

    const thresholdValue = parseInt(threshold)
    if (isNaN(thresholdValue) || thresholdValue < 0) {
      setSaveStatus({ type: 'error', message: 'Please enter a valid threshold (0 or greater)' })
      return
    }

    setIsSaving(true)
    setSaveStatus(null)

    try {
      await setSetting({
        key: 'low_stock_threshold',
        value: thresholdValue,
        updatedBy: user.id,
      })
      setSaveStatus({ type: 'success', message: 'Low stock threshold saved successfully!' })
    } catch (error: any) {
      setSaveStatus({ type: 'error', message: error.message || 'Failed to save threshold' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveBankDetails = async () => {
    if (!user?.id) return

    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      setSaveStatus({ type: 'error', message: 'Please fill in all required bank fields' })
      return
    }

    setIsSaving(true)
    setSaveStatus(null)

    try {
      await setSetting({
        key: 'bank_details',
        value: {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          routingNumber: routingNumber.trim(),
        },
        updatedBy: user.id,
      })
      setSaveStatus({ type: 'success', message: 'Bank details saved successfully!' })
    } catch (error: any) {
      setSaveStatus({ type: 'error', message: error.message || 'Failed to save bank details' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAll = async () => {
    await Promise.all([
      handleSaveWarehouse(),
      handleSaveLowStock(),
      handleSaveBankDetails(),
    ])
  }

  // Clear status message after 5 seconds
  useEffect(() => {
    if (saveStatus) {
      const timer = setTimeout(() => setSaveStatus(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  if (!allSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings and preferences
        </p>
      </div>

      {/* Status Message */}
      {saveStatus && (
        <div
          className={`p-4 rounded-lg border flex items-center gap-2 ${
            saveStatus.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Warehouse Location */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <CardTitle>Warehouse Location</CardTitle>
          </div>
          <CardDescription>
            Set the warehouse coordinates for distance calculations and route optimization.
            Required for driver distance display and route planning.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse-lat">Latitude *</Label>
              <Input
                id="warehouse-lat"
                type="number"
                step="any"
                value={warehouseLat}
                onChange={(e) => setWarehouseLat(e.target.value)}
                placeholder="e.g., 40.7128"
                min="-90"
                max="90"
              />
              <p className="text-xs text-gray-500">Range: -90 to 90</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouse-lng">Longitude *</Label>
              <Input
                id="warehouse-lng"
                type="number"
                step="any"
                value={warehouseLng}
                onChange={(e) => setWarehouseLng(e.target.value)}
                placeholder="e.g., -74.0060"
                min="-180"
                max="180"
              />
              <p className="text-xs text-gray-500">Range: -180 to 180</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveWarehouse}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Warehouse Location
                </>
              )}
            </Button>
            {(warehouseLocation.lat === 0 && warehouseLocation.lng === 0) && (
              <span className="text-sm text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Not configured
              </span>
            )}
          </div>
          {warehouseLocation.lat !== 0 && warehouseLocation.lng !== 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Current:</strong> {warehouseLocation.lat.toFixed(6)},{' '}
                {warehouseLocation.lng.toFixed(6)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Threshold */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-600" />
            <CardTitle>Low Stock Threshold</CardTitle>
          </div>
          <CardDescription>
            Set the minimum stock level that triggers low stock alerts in the inventory dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="low-stock-threshold">Threshold *</Label>
            <Input
              id="low-stock-threshold"
              type="number"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="e.g., 10"
            />
            <p className="text-xs text-gray-500">
              Products with stock below this number will be flagged as low stock
            </p>
          </div>
          <Button
            onClick={handleSaveLowStock}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Threshold
              </>
            )}
          </Button>
          <div className="p-3 bg-gray-50 rounded-lg border">
            <p className="text-sm text-gray-700">
              <strong>Current:</strong> {lowStockThreshold} units
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            <CardTitle>Bank Details</CardTitle>
          </div>
          <CardDescription>
            Configure bank account information for bank transfer payment verification.
            This information may be displayed to customers for payment instructions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank-name">Bank Name *</Label>
              <Input
                id="bank-name"
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g., Chase Bank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-name">Account Name *</Label>
              <Input
                id="account-name"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g., Eazy Logistics Inc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number *</Label>
              <Input
                id="account-number"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g., 1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routing-number">Routing Number</Label>
              <Input
                id="routing-number"
                type="text"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                placeholder="e.g., 021000021"
              />
            </div>
          </div>
          <Button
            onClick={handleSaveBankDetails}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Bank Details
              </>
            )}
          </Button>
          {bankDetails.bankName && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-700">
                <strong>Current Bank:</strong> {bankDetails.bankName}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Account:</strong> {bankDetails.accountName} (****
                {bankDetails.accountNumber.slice(-4)})
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save All Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveAll}
          disabled={isSaving}
          size="lg"
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving All Settings...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

