import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/admin-layout';
import { PaymentApprovalDashboard } from '@/components/admin/payment-approval-dashboard';

export const metadata: Metadata = {
  title: 'Payment Approvals - Admin Dashboard',
  description: 'Manage and approve payment requests',
};

export const dynamic = 'force-dynamic';

export default function AdminPaymentsPage() {
  return (
    <AdminLayout 
      title="Payment Approvals"
      description="Review and approve payment requests from users"
    >
      <PaymentApprovalDashboard />
    </AdminLayout>
  );
}