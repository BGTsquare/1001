'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/data-states';
import { Check, X, Eye, Clock, CheckCircle, XCircle, Package, Book } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Purchase {
  id: string;
  user_id: string;
  item_type: 'book' | 'bundle';
  item_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  transaction_reference: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_email: string | null;
  item_title: string | null;
  item_cover: string | null;
}

const statusConfig = {
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Payment Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: Check }
};

export function SimplePurchaseManager() {
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();

  // Fetch purchases
  const { data: purchases = [], isLoading, error } = useQuery({
    queryKey: ['admin-purchases'],
    queryFn: async () => {
      const response = await fetch('/api/admin/purchases/simple');
      if (!response.ok) throw new Error('Failed to fetch purchases');
      const data = await response.json();
      return data.purchases as Purchase[];
    }
  });

  // Update purchase status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      purchaseId, 
      status, 
      notes 
    }: { 
      purchaseId: string; 
      status: 'approved' | 'rejected' | 'completed'; 
      notes?: string;
    }) => {
      const response = await fetch(`/api/admin/purchases/${purchaseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: notes })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update purchase');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-purchases'] });
      setSelectedPurchase(null);
      setAdminNotes('');
      
      const statusLabels = {
        approved: 'approved',
        rejected: 'rejected', 
        completed: 'completed'
      };
      
      toast.success(`Purchase ${statusLabels[variables.status]} successfully!`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update purchase');
    }
  });

  const handleStatusUpdate = (status: 'approved' | 'rejected' | 'completed') => {
    if (!selectedPurchase) return;
    
    updateStatusMutation.mutate({
      purchaseId: selectedPurchase.id,
      status,
      notes: adminNotes.trim() || undefined
    });
  };

  const openPurchaseDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setAdminNotes(purchase.admin_notes || '');
  };

  // Group purchases by status
  const purchasesByStatus = purchases.reduce((acc, purchase) => {
    if (!acc[purchase.status]) acc[purchase.status] = [];
    acc[purchase.status].push(purchase);
    return acc;
  }, {} as Record<string, Purchase[]>);

  // Stats
  const stats = {
    pending: purchasesByStatus.pending?.length || 0,
    approved: purchasesByStatus.approved?.length || 0,
    completed: purchasesByStatus.completed?.length || 0,
    rejected: purchasesByStatus.rejected?.length || 0
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load purchases" />;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Confirmed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Payment Confirmed ({stats.approved})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({stats.completed})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({stats.rejected})
          </TabsTrigger>
        </TabsList>

        {Object.entries(purchasesByStatus).map(([status, statusPurchases]) => (
          <TabsContent key={status} value={status}>
            {statusPurchases.length === 0 ? (
              <EmptyState message={`No ${status} purchases found.`} />
            ) : (
              <div className="grid gap-4">
                {statusPurchases.map((purchase) => (
                  <PurchaseCard
                    key={purchase.id}
                    purchase={purchase}
                    onViewDetails={() => openPurchaseDetails(purchase)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <Dialog open={!!selectedPurchase} onOpenChange={() => setSelectedPurchase(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Purchase Details</DialogTitle>
            </DialogHeader>
            
            <PurchaseDetailsModal
              purchase={selectedPurchase}
              adminNotes={adminNotes}
              setAdminNotes={setAdminNotes}
              onStatusUpdate={handleStatusUpdate}
              isUpdating={updateStatusMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Purchase Card Component
function PurchaseCard({ 
  purchase, 
  onViewDetails 
}: { 
  purchase: Purchase; 
  onViewDetails: () => void;
}) {
  const statusInfo = statusConfig[purchase.status];
  const ItemIcon = purchase.item_type === 'book' ? Book : Package;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="flex-shrink-0">
              {purchase.item_cover ? (
                <img 
                  src={purchase.item_cover} 
                  alt={purchase.item_title || 'Item'}
                  className="w-12 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                  <ItemIcon className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold truncate">
                  {purchase.item_title || 'Unknown Item'}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {purchase.item_type}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {purchase.user_name || purchase.user_email}
              </p>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{purchase.amount} ETB</span>
                {purchase.transaction_reference && (
                  <span className="font-mono text-xs">
                    {purchase.transaction_reference}
                  </span>
                )}
                <span>{format(new Date(purchase.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge className={statusInfo.color}>
              <statusInfo.icon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
            
            <Button size="sm" variant="outline" onClick={onViewDetails}>
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Purchase Details Modal Component
function PurchaseDetailsModal({
  purchase,
  adminNotes,
  setAdminNotes,
  onStatusUpdate,
  isUpdating
}: {
  purchase: Purchase;
  adminNotes: string;
  setAdminNotes: (notes: string) => void;
  onStatusUpdate: (status: 'approved' | 'rejected' | 'completed') => void;
  isUpdating: boolean;
}) {
  const statusInfo = statusConfig[purchase.status];
  const ItemIcon = purchase.item_type === 'book' ? Book : Package;

  return (
    <div className="space-y-6">
      {/* Purchase Info */}
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {purchase.item_cover ? (
            <img 
              src={purchase.item_cover} 
              alt={purchase.item_title || 'Item'}
              className="w-20 h-28 object-cover rounded"
            />
          ) : (
            <div className="w-20 h-28 bg-gray-200 rounded flex items-center justify-center">
              <ItemIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            {purchase.item_title || 'Unknown Item'}
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span>{purchase.user_name || purchase.user_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold">{purchase.amount} ETB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="outline">{purchase.item_type}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge className={statusInfo.color}>
                <statusInfo.icon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
            {purchase.transaction_reference && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference:</span>
                <code className="text-xs">{purchase.transaction_reference}</code>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{format(new Date(purchase.created_at), 'MMM d, yyyy HH:mm')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Notes */}
      <div>
        <label className="text-sm font-medium mb-2 block">Admin Notes</label>
        <Textarea
          placeholder="Add notes about this purchase..."
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Actions */}
      {purchase.status === 'pending' && (
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => onStatusUpdate('rejected')}
            disabled={isUpdating}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button
            onClick={() => onStatusUpdate('approved')}
            disabled={isUpdating}
          >
            <Check className="h-4 w-4 mr-1" />
            Approve Payment
          </Button>
        </div>
      )}

      {purchase.status === 'approved' && (
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => onStatusUpdate('rejected')}
            disabled={isUpdating}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button
            onClick={() => onStatusUpdate('completed')}
            disabled={isUpdating}
          >
            <Check className="h-4 w-4 mr-1" />
            Complete & Grant Access
          </Button>
        </div>
      )}
    </div>
  );
}
