'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react'

export default function ConfirmEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        
        if (!token_hash || type !== 'email') {
          setStatus('error')
          setMessage('Invalid confirmation link. Please check your email and try again.')
          return
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email'
        })

        if (error) {
          throw error
        }

        // Check if user has a profile, create one if not
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single()

          if (!profile) {
            const displayName = user.user_metadata?.display_name || 
                               user.user_metadata?.full_name || 
                               user.email?.split('@')[0] || 
                               'User'

            await supabase
              .from('profiles')
              .insert({
                id: user.id,
                display_name: displayName,
                role: 'user',
                reading_preferences: {
                  fontSize: 'medium',
                  theme: 'light',
                  fontFamily: 'sans-serif',
                },
              })
          }
        }

        setStatus('success')
        setMessage('Your email has been confirmed successfully!')
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          router.push('/')
        }, 3000)

      } catch (error: any) {
        console.error('Error confirming email:', error)
        setStatus('error')
        setMessage(error.message || 'Failed to confirm email. Please try again.')
      }
    }

    confirmEmail()
  }, [searchParams, supabase, router])

  const handleResendConfirmation = async () => {
    const email = searchParams.get('email')
    if (!email) {
      router.push('/auth/register')
      return
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        throw error
      }

      setMessage('Confirmation email sent! Please check your inbox.')
    } catch (error: any) {
      setMessage(error.message || 'Failed to resend confirmation email.')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4">
            {status === 'loading' && (
              <div className="bg-blue-100">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="bg-red-100">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            )}
          </div>
          
          <CardTitle>
            {status === 'loading' && 'Confirming Email...'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
          </CardTitle>
          
          <CardDescription>
            {status === 'loading' && 'Please wait while we confirm your email address.'}
            {status === 'success' && 'You will be redirected to the home page shortly.'}
            {status === 'error' && 'There was an issue confirming your email address.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {message && (
            <Alert variant={status === 'error' ? 'destructive' : 'default'} className="mb-6">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {status === 'success' && (
              <Button
                onClick={() => router.push('/')}
                className="w-full"
              >
                Continue to Home
              </Button>
            )}

            {status === 'error' && (
              <div className="space-y-2">
                <Button
                  onClick={handleResendConfirmation}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Confirmation Email
                </Button>
                
                <Button
                  onClick={() => router.push('/auth/register')}
                  variant="link"
                  className="w-full"
                >
                  Back to Registration
                </Button>
              </div>
            )}

            {status === 'loading' && (
              <Button
                onClick={() => router.push('/auth/login')}
                variant="outline"
                className="w-full"
              >
                Back to Login
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
