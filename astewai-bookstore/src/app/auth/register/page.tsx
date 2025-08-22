import { RegisterForm } from '@/components/auth'

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <RegisterForm />
    </div>
  )
}
