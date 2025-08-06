import { Metadata } from 'next';
import { UserPurchaseRequests } from '@/components/contact/user-purchase-requests';
import { ProtectedRoute } from '@/components/auth/protected-route';

export const metadata: Metadata = {
    title: 'Purchase Requests - Astewai Digital Bookstore',
    description: 'Track your purchase requests and their status',
};

export default function PurchaseRequestsPage() {
    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-8">
                <UserPurchaseRequests />
            </div>
        </ProtectedRoute>
    );
}