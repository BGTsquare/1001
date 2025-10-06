'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ROUTES } from '@/utils/constants'

export default function PromoteAdminPage() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handlePromoteToAdmin = async () => {
    if (!user) {
      setError('You must be logged in to promote to admin')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to promote to admin')
      }

      setMessage('Successfully promoted to admin! Please refresh the page or log out and back in.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Admin Promotion</CardTitle>
            <CardDescription>You must be logged in to promote to admin</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Promote to Admin</CardTitle>
          <CardDescription>
            This is a development utility to promote your account to admin role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p><strong>Current User:</strong> {user.email}</p>
            <p><strong>Current Role:</strong> {profile?.role || 'Loading...'}</p>
          </div>

          {profile?.role === 'admin' ? (
            <div className="space-y-4">
              <p className="text-green-600">✅ You are already an admin!</p>
              <Link href={ROUTES.ADMIN.DASHBOARD}>
                <Button>Go to Admin Dashboard</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the button below to promote your account to admin role. 
                This will allow you to access the admin dashboard.
              </p>
              
              <Button 
                onClick={handlePromoteToAdmin} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Promoting...' : 'Promote to Admin'}
              </Button>
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="pt-4 border-t">
            <Link href={ROUTES.HOME}>
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}