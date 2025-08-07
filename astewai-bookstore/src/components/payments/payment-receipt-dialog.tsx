'use client';

import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import type { PurchaseRequest } from '@/types';
import { 
  Download,
  Printer,
  CheckCircle,
  DollarSign,
  Calendar,
  User,
  Book,
  Package,
  FileText,
  Building
} from 'lucide-react';
import { format } from 'date-fns';

interface PaymentReceiptDialogProps {
  request: PurchaseRequest;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentReceiptDialog({
  request,
  isOpen,
  onClose
}: PaymentReceiptDialogProps) {
  const { user, profile } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);

  const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
  const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';
  const ItemIcon = request.item_type === 'book' ? Book : Package;

  const receiptNumber = `AST-${request.id.slice(-8).toUpperCase()}`;
  const receiptDate = format(new Date(request.updated_at || request.created_at), 'MMMM d, yyyy');

  const handlePrint = () => {
    if (receiptRef.current) {
      const printContent = receiptRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Payment Receipt - ${receiptNumber}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 0; 
                  padding: 20px; 
                  color: #333;
                }
                .receipt-container { 
                  max-width: 600px; 
                  margin: 0 auto; 
                }
                .header { 
                  text-align: center; 
                  margin-bottom: 30px; 
                  border-bottom: 2px solid #eee; 
                  padding-bottom: 20px;
                }
                .logo { 
                  font-size: 24px; 
                  font-weight: bold; 
                  color: #2563eb; 
                  margin-bottom: 10px;
                }
                .receipt-info { 
                  display: flex; 
                  justify-content: space-between; 
                  margin-bottom: 20px; 
                }
                .section { 
                  margin-bottom: 20px; 
                }
                .section-title { 
                  font-weight: bold; 
                  margin-bottom: 10px; 
                  color: #374151;
                }
                .item-details { 
                  background: #f9fafb; 
                  padding: 15px; 
                  border-radius: 8px; 
                  margin-bottom: 20px;
                }
                .total-section { 
                  background: #eff6ff; 
                  padding: 15px; 
                  border-radius: 8px; 
                  text-align: right;
                }
                .total-amount { 
                  font-size: 24px; 
                  font-weight: bold; 
                  color: #059669;
                }
                .footer { 
                  margin-top: 30px; 
                  padding-top: 20px; 
                  border-top: 1px solid #eee; 
                  text-align: center; 
                  font-size: 12px; 
                  color: #6b7280;
                }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="receipt-container">
                ${printContent}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/purchase-requests/${request.id}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to generate receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      // Fallback to print
      handlePrint();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Payment Receipt</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Receipt Content */}
          <div ref={receiptRef} className="bg-white">
            {/* Header */}
            <div className="text-center mb-8 pb-6 border-b-2">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Building className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-blue-600">Astewai Digital Bookstore</h1>
              </div>
              <p className="text-muted-foreground">Digital Content Purchase Receipt</p>
            </div>

            {/* Receipt Info */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Receipt Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Receipt #:</span> {receiptNumber}</p>
                  <p><span className="font-medium">Date:</span> {receiptDate}</p>
                  <p><span className="font-medium">Status:</span> 
                    <Badge variant="default" className="ml-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {request.status === 'completed' ? 'Completed' : 'Approved'}
                    </Badge>
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {profile?.display_name || 'Customer'}</p>
                  <p><span className="font-medium">Email:</span> {user?.email}</p>
                  <p><span className="font-medium">Customer ID:</span> {user?.id.slice(-8).toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Item Details */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Purchase Details</h3>
                <div className="flex items-start space-x-4">
                  {(request.book?.cover_image_url || request.bundle?.cover_image_url) && (
                    <img
                      src={request.book?.cover_image_url || request.bundle?.cover_image_url}
                      alt={itemName}
                      className="w-20 h-24 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <ItemIcon className="h-5 w-5 text-muted-foreground" />
                      <h4 className="text-lg font-semibold">{itemName}</h4>
                      <Badge variant="outline">{itemType}</Badge>
                    </div>
                    
                    {request.book?.author && (
                      <p className="text-muted-foreground mb-2">by {request.book.author}</p>
                    )}
                    
                    {(request.book?.description || request.bundle?.description) && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {request.book?.description || request.bundle?.description}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Item ID:</span> {request.item_id}
                      </div>
                      <div>
                        <span className="font-medium">Purchase Date:</span> {format(new Date(request.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Payment Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Item Price:</span>
                    <span>${request.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes:</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fees:</span>
                    <span>$0.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Paid:</span>
                    <span className="text-green-600">${request.amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            {(request.user_message || request.admin_notes) && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Additional Information</h3>
                  {request.user_message && (
                    <div className="mb-4">
                      <p className="font-medium text-sm mb-1">Customer Message:</p>
                      <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                        {request.user_message}
                      </p>
                    </div>
                  )}
                  {request.admin_notes && (
                    <div>
                      <p className="font-medium text-sm mb-1">Admin Notes:</p>
                      <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                        {request.admin_notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground border-t pt-6">
              <p className="mb-2">Thank you for your purchase!</p>
              <p>This is a digital receipt for your records.</p>
              <p className="mt-4">
                For support, contact us at support@astewai.com
              </p>
              <p className="mt-2 text-xs">
                Generated on {format(new Date(), 'MMMM d, yyyy \'at\' HH:mm')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 no-print">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}