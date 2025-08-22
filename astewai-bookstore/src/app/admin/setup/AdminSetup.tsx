'use client'

import { Suspense } from 'react'
import AdminSetupPage from './page-content'

export default function AdminSetup() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminSetupPage />
    </Suspense>
  )
}
