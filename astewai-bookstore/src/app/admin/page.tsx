import { AdminLayout } from '@/components/admin/admin-layout'
import { AdminDashboardClient } from './admin-dashboard-client'

export default function AdminDashboardPage() {
  return (
    <AdminLayout 
      title="Admin Dashboard"
      description="Manage your digital bookstore"
    >
      <AdminDashboardClient />
    </AdminLayout>
  )
}