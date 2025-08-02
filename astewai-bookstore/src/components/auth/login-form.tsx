'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  redirectTo?: string
}

export function LoginForm({ redirectTo = '/' }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn(data.email, data.password)
      
      if (result.error) {
        setError(result.error)
      } else {
        router.push(redirectTo)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="card-mobile w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          <h1 className="heading-responsive-md">Sign In</h1>
        </CardTitle>
        <CardDescription className="text-mobile-base">
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="form-mobile">
          {error && (
            <div className="p-3 text-mobile-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-mobile-tight">
            <label htmlFor="email" className="text-mobile-sm font-medium block">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="text-mobile-base touch-target"
              {...register('email')}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
            {errors.email && (
              <p className="text-mobile-sm text-red-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-mobile-tight">
            <label htmlFor="password" className="text-mobile-sm font-medium block">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="text-mobile-base touch-target"
              {...register('password')}
              aria-invalid={errors.password ? 'true' : 'false'}
            />
            {errors.password && (
              <p className="text-mobile-sm text-red-600" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full button-mobile"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-center space-mobile-tight">
            <Link
              href="/auth/forgot-password"
              className="text-mobile-sm text-primary hover:underline touch-target inline-block"
            >
              Forgot your password?
            </Link>
            <p className="text-mobile-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className="text-primary hover:underline touch-target"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}