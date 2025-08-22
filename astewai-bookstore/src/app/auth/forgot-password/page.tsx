import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ForgotPasswordForm />
    </div>
  )
}