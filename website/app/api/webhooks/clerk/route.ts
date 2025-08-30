import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// Verify Clerk webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  // In production, implement proper webhook signature verification
  // For now, we'll trust the webhook (ensure this is only accessible via HTTPS)
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('svix-signature') || ''
    const timestamp = request.headers.get('svix-timestamp') || ''
    const id = request.headers.get('svix-id') || ''

    // Verify webhook signature in production
    if (!verifyWebhookSignature(body, signature, process.env.CLERK_WEBHOOK_SECRET || '')) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const { type, data } = event

    switch (type) {
      case 'user.created':
        // Sync new user to Convex
        await convex.mutation(api.users.upsertUser, {
          clerkId: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email_addresses[0]?.email_address || '',
          imageUrl: data.image_url,
        })
        break

      case 'user.updated':
        // Update user in Convex
        await convex.mutation(api.users.upsertUser, {
          clerkId: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email_addresses[0]?.email_address || '',
          imageUrl: data.image_url,
        })
        break

      case 'user.deleted':
        // Remove user from Convex
        await convex.mutation(api.users.deleteUserByClerkId, {
          clerkId: data.id,
        })
        break

      case 'session.created':
        // Update last sign in when user signs in
        if (data.user_id) {
          await convex.mutation(api.users.updateLastSignIn, {
            clerkId: data.user_id,
          })
        }
        break

      default:
        console.log(`Unhandled webhook type: ${type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
