import { Suspense } from 'react'

export default function PromoteAdminLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>
}