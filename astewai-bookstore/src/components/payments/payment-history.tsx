'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, DollarSign } from 'lucide-react';
import { PaymentStatusTracker } from './payment-status-tracker';
import { PaymentReceiptDialog } from './payment-receipt-dialog';
import { PaymentCancellationDialog } from './payment-cancellation-dialog';
import { PaymentStatsCards } from './payment-stats-cards';
import { PaymentFilters } from './payment-filters';
import { PaymentRequestCard } from './payment-request-card';
import { usePaymentHistory } from '@/hooks/use-payment-history';
import type { PurchaseRequest } from '@/types';

export function PaymentHistory() {
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [showReceipt, setShowReceipt] = useState<PurchaseRequest | null>(null);
  const [showCancellation, setShowCancellation] = useState<PurchaseRequest | null>(null);

  const {
    requests,
    filteredRequests,
    stats,
    filters,
    setFilters,
    isLoading,
    error,
    cancelRequestMutation
  } = usePaymentHistory();

  const handleCancelRequest = (reason: string) => {
    if (showCancellation) {
      cancelRequestMutation.mutate({ 
        requestId: showCancellation.id, 
        reason 
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading payment history...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <span className="ml-2 text-red-600">Failed to load payment history</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Payment History</h2>
        <p className="text-muted-foreground">Track your payment requests and their status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">${stats.pendingAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Pending Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by item name or request ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contacted">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {requests.length === 0 
                  ? "You haven't made any payment requests yet." 
                  : "No requests match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
                const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';
                const ItemIcon = request.item_type === 'book' ? Book : Package;

                return (
                  <Card key={request.id} className="transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {(request.book?.cover_image_url || request.bundle?.cover_image_url) && (
                            <img
                              src={request.book?.cover_image_url || request.bundle?.cover_image_url}
                              alt={itemName}
                              className="w-12 h-16 object-cover rounded"
                            />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <ItemIcon className="h-4 w-4 text-muted-foreground" />
                              <h3 className="font-semibold truncate">{itemName}</h3>
                              <Badge variant="outline" className="text-xs">
                                {itemType}
                              </Badge>
                              {getStatusBadge(request.status)}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3" />
                                <span className="font-medium">${request.amount.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                              </div>
                            </div>

                            {request.user_message && (
                              <div className="bg-muted p-2 rounded text-sm mb-3">
                                <p className="text-muted-foreground line-clamp-2">
                                  {request.user_message}
                                </p>
                              </div>
                            )}

                            {request.admin_notes && (
                              <div className="bg-blue-50 p-2 rounded text-sm mb-3">
                                <p className="text-blue-800 font-medium">Admin Notes:</p>
                                <p className="text-blue-700">{request.admin_notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                          
                          {canDownloadReceipt(request) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowReceipt(request)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Receipt
                            </Button>
                          )}
                          
                          {canCancelRequest(request) && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setShowCancellation(request)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Status Tracker Dialog */}
      {selectedRequest && (
        <PaymentStatusTracker
          request={selectedRequest}
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}

      {/* Payment Receipt Dialog */}
      {showReceipt && (
        <PaymentReceiptDialog
          request={showReceipt}
          isOpen={!!showReceipt}
          onClose={() => setShowReceipt(null)}
        />
      )}

      {/* Payment Cancellation Dialog */}
      {showCancellation && (
        <PaymentCancellationDialog
          request={showCancellation}
          isOpen={!!showCancellation}
          onClose={() => setShowCancellation(null)}
          onCancel={(reason) => 
            cancelRequestMutation.mutate({ 
              requestId: showCancellation.id, 
              reason 
            })
          }
          isProcessing={cancelRequestMutation.isPending}
        />
      )}
    </div>
  );
}