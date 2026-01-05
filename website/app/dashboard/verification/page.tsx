import { VerificationQueue } from '@/components/verification/VerificationQueue'
import { VerificationHistory } from '@/components/verification/VerificationHistory'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function VerificationPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payment Verification</h1>
        <p className="text-muted-foreground">
          Review and verify bank transfer payment proofs
        </p>
      </div>

      {/* Pending Verifications */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Verifications</CardTitle>
          <CardDescription>
            Bank transfer orders awaiting payment verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VerificationQueue />
        </CardContent>
      </Card>

      {/* Verification History */}
      <Card>
        <CardHeader>
          <CardTitle>Verification History</CardTitle>
          <CardDescription>
            Audit trail of all payment verifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VerificationHistory />
        </CardContent>
      </Card>
    </div>
  )
}

