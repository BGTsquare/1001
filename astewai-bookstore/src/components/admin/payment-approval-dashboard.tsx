'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentRequestCard } from './payment-request-card';
import { PaymentRequestDetails } from './payment-request-details';
import { BulkApprovalDialog } from './bulk-approval-dialog';
import { PaymentApprovalNotifications } from './payment-approval-notifications';
import type { PurchaseRequest } from '@/types';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  Search,
  Filter,
  Activity,
  Users,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  calculatePaymentStats, 
  sortRequestsByPriority,
  validateBulkApproval,
  generateApprovalSummary,
  formatApprovalMessage
} from '@/lib/utils/payment-approval-utils';

export function PaymentApprovalDashboard() {
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch purchase requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['purchase-requests', 'admin'],
    queryFn: async () => {
      const response = await fetch('/api/purchase-requests?admin=true');
      if (!response.ok) {
        throw new Error('Failed to fetch purchase requests');
      }
      const result = await response.json();
      return result.data as PurchaseRequest[];
    }
  });

  // Bulk approval mutation
  const bulkApprovalMutation = useMutation({
    mutationFn: async ({ requestIds, action, notes }: { 
      requestIds: string[]; 
      action: 'approve' | 'reject'; 
      notes?: string 
    }) => {
      const promises = requestIds.map(id =>
        fetch(`/api/purchase-requests/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: action === 'approve' ? 'approved' : 'rejected',
            adminNotes: notes 
          }),
        })
      );

      const responses = await Promise.all(promises);
      const failed = responses.filter(r => !r.ok);
      
      if (failed.length > 0) {
        throw new Error(`Failed to update ${failed.length} requests`);
      }

      return responses;
    },
    onSuccess: (_, { requestIds, action, notes }) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      
      const processedRequests = requests.filter(r => requestIds.includes(r.id));
      const summary = generateApprovalSummary(processedRequests, action);
      const message = formatApprovalMessage(summary, notes);
      
      toast.success(message);
      setSelectedRequests(new Set());
      setShowBulkDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to process bulk action');
    }
  });

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const itemName = request.book?.title || request.bundle?.title || '';
    const matchesSearch = !searchTerm || 
      itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesItemType = itemTypeFilter === 'all' || request.item_type === itemTypeFilter;
    
    return matchesSearch && matchesStatus && matchesItemType;
  });

  // Calculate stats using utility function
  const stats = calculatePaymentStats(requests);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingIds = filteredRequests
        .filter(r => r.status === 'pending')
        .map(r => r.id);
      setSelectedRequests(new Set(pendingIds));
    } else {
      setSelectedRequests(new Set());
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    const newSelected = new Set(selectedRequests);
    if (checked) {
      newSelected.add(requestId);
    } else {
      newSelected.delete(requestId);
    }
    setSelectedRequests(newSelected);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading payment requests...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-3 space-y-6">
        {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">${stats.pendingValue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Pending Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Bulk Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by item name or request ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Item Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="book">Books</SelectItem>
                  <SelectItem value="bundle">Bundles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedRequests.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {selectedRequests.size} selected
                </span>
                <Button
                  onClick={() => setShowBulkDialog(true)}
                  disabled={bulkApprovalMutation.isPending}
                >
                  Bulk Actions
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Request List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment Requests</CardTitle>
            {statusFilter === 'pending' && filteredRequests.length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedRequests.size === filteredRequests.filter(r => r.status === 'pending').length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">Select All</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No payment requests found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <PaymentRequestCard
                  key={request.id}
                  request={request}
                  isSelected={selectedRequests.has(request.id)}
                  onSelect={(checked) => handleSelectRequest(request.id, checked)}
                  onViewDetails={() => setSelectedRequest(request)}
                  showCheckbox={request.status === 'pending'}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Request Details Modal */}
      {selectedRequest && (
        <PaymentRequestDetails
          request={selectedRequest}
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onStatusUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
            setSelectedRequest(null);
          }}
        />
      )}

      {/* Bulk Approval Dialog */}
      <BulkApprovalDialog
        isOpen={showBulkDialog}
        onClose={() => setShowBulkDialog(false)}
        selectedRequests={Array.from(selectedRequests)}
        requests={requests.filter(r => selectedRequests.has(r.id))}
        onBulkAction={(action, notes) => 
          bulkApprovalMutation.mutate({ 
            requestIds: Array.from(selectedRequests), 
            action, 
            notes 
          })
        }
        isProcessing={bulkApprovalMutation.isPending}
      />
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <PaymentApprovalNotifications
          onViewRequest={(requestId) => {
            if (requestId === 'all') {
              setStatusFilter('pending');
            } else {
              const request = requests.find(r => r.id === requestId);
              if (request) {
                setSelectedRequest(request);
              }
            }
          }}
        />
      </div>
    </div>
  );
}