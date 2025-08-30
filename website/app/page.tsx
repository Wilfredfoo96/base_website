'use client'

import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'
import { UserButton } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to your account or create a new one
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              Get Started
            </CardTitle>
            <CardDescription>
              Choose how you'd like to proceed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Unauthenticated>
              <div className="space-y-3">
                <Link href="/sign-in" className="block">
                  <Button className="w-full" size="lg">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up" className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    Create Account
                  </Button>
                </Link>
              </div>
            </Unauthenticated>

            <Authenticated>
              <AuthenticatedContent />
            </Authenticated>

            <AuthLoading>
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            </AuthLoading>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AuthenticatedContent() {
  const router = useRouter()

  // Automatically redirect to dashboard after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 1500) // 1.5 second delay to show success message

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <UserButton 
          appearance={{
            elements: {
              userButtonAvatarBox: 'w-16 h-16',
            }
          }}
        />
      </div>
      <h3 className="text-lg font-semibold">Welcome!</h3>
      <p className="text-gray-600">You are successfully authenticated.</p>
      
      <div className="space-y-3">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-800 text-sm">
            Your authentication is working! Redirecting to dashboard...
          </p>
        </div>
        
        <Link href="/dashboard" className="block">
          <Button className="w-full" size="lg">
            Go to Dashboard Now
          </Button>
        </Link>
      </div>
    </div>
  )
}
