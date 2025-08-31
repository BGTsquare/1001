import { Metadata } from 'next'
import { AdminLayout } from '@/components/admin/admin-layout'
import { PaymentConfigManagement } from '@/components/admin/payment-config-management'

export const metadata: Metadata = {
  title: 'Payment Configuration - Admin Dashboard',
  description: 'Manage payment methods and bank account configurations',
}

export default function AdminPaymentConfigPage() {
  return (
    <AdminLayout 
      title="Payment Configuration"
      description="Manage bank accounts, mobile money options, and payment method settings"
    >
      <PaymentConfigManagement />
    </AdminLayout>
  )
}
