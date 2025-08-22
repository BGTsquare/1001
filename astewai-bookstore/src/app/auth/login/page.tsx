import { LoginForm } from '@/components/auth'

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; message?: string }>
}

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  
  return (
    <div className="container mx-auto px-4 py-8">
      {params.message && (
        <div className="mb-6 p-3 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md text-center max-w-md mx-auto">
          {params.message}
        </div>
      )}
      <LoginForm redirectTo={params.redirectTo} />
    </div>
  )
}
