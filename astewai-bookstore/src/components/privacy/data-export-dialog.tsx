'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileText, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  BookOpen,
  ShoppingCart,
  MessageSquare
} from 'lucide-react';

const dataExportSchema = z.object({
  includeProfile: z.boolean().default(true),
  includeLibrary: z.boolean().default(true),
  includePurchases: z.boolean().default(true),
  includeReadingProgress: z.boolean().default(true),
  includeComments: z.boolean().default(false),
  includeAnalytics: z.boolean().default(false),
  reason: z.string().optional(),
});

type DataExportFormData = z.infer<typeof dataExportSchema>;

interface DataExportDialogProps {
  open: boolean;
  onClose: () => void;
}

type ExportStatus = 'idle' | 'preparing' | 'processing' | 'ready' | 'error';

const dataCategories = [
  {
    id: 'includeProfile' as keyof DataExportFormData,
    title: 'Profile Information',
    description: 'Your account details, preferences, and settings',
    icon: User,
    estimatedSize: '< 1 MB',
    includes: ['Name and email', 'Account preferences', 'Profile settings', 'Contact information'],
  },
  {
    id: 'includeLibrary' as keyof DataExportFormData,
    title: 'Library Data',
    description: 'Your book collection and library organization',
    icon: BookOpen,
    estimatedSize: '< 5 MB',
    includes: ['Owned books', 'Wishlist items', 'Book ratings', 'Library organization'],
  },
  {
    id: 'includePurchases' as keyof DataExportFormData,
    title: 'Purchase History',
    description: 'Transaction records and payment information',
    icon: ShoppingCart,
    estimatedSize: '< 2 MB',
    includes: ['Purchase records', 'Payment history', 'Receipts', 'Refund information'],
  },
  {
    id: 'includeReadingProgress' as keyof DataExportFormData,
    title: 'Reading Progress',
    description: 'Your reading history and progress tracking',
    icon: Clock,
    estimatedSize: '< 3 MB',
    includes: ['Reading progress', 'Bookmarks', 'Reading statistics', 'Time spent reading'],
  },
  {
    id: 'includeComments' as keyof DataExportFormData,
    title: 'Comments & Reviews',
    description: 'Your comments, reviews, and interactions',
    icon: MessageSquare,
    estimatedSize: '< 1 MB',
    includes: ['Book reviews', 'Blog comments', 'Community interactions', 'Ratings'],
  },
  {
    id: 'includeAnalytics' as keyof DataExportFormData,
    title: 'Usage Analytics',
    description: 'Anonymized usage data and statistics',
    icon: Shield,
    estimatedSize: '< 1 MB',
    includes: ['Page views', 'Feature usage', 'Session data', 'Performance metrics'],
  },
];

export function DataExportDialog({ open, onClose }: DataExportDialogProps) {
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DataExportFormData>({
    resolver: zodResolver(dataExportSchema),
    defaultValues: {
      includeProfile: true,
      includeLibrary: true,
      includePurchases: true,
      includeReadingProgress: true,
      includeComments: false,
      includeAnalytics: false,
      reason: '',
    },
  });

  const watchedValues = watch();

  const selectedCategories = dataCategories.filter(
    category => watchedValues[category.id] as boolean
  );

  const estimatedTotalSize = selectedCategories.reduce((total, category) => {
    const sizeMatch = category.estimatedSize.match(/(\d+)/);
    return total + (sizeMatch ? parseInt(sizeMatch[1]) : 1);
  }, 0);

  const handleCategoryChange = (categoryId: keyof DataExportFormData, checked: boolean) => {
    setValue(categoryId, checked);
  };

  const onSubmit = async (data: DataExportFormData) => {
    setExportStatus('preparing');
    setExportProgress(0);

    try {
      // Simulate export process
      const steps = [
        'Validating request...',
        'Collecting profile data...',
        'Gathering library information...',
        'Compiling purchase history...',
        'Processing reading progress...',
        'Generating export file...',
        'Finalizing download...',
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setExportProgress(((i + 1) / steps.length) * 100);
        
        if (i === 0) setExportStatus('processing');
      }

      // TODO: Implement actual data export API call
      console.log('Exporting user data:', data);
      
      // Simulate download URL generation
      setDownloadUrl('/api/user/export/download?token=mock-token');
      setExportStatus('ready');
      
    } catch (error) {
      console.error('Error exporting data:', error);
      setExportStatus('error');
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      // In a real implementation, this would trigger the actual download
      console.log('Downloading from:', downloadUrl);
      
      // Reset state after download
      setTimeout(() => {
        setExportStatus('idle');
        setExportProgress(0);
        setDownloadUrl(null);
        onClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    if (exportStatus === 'processing') return; // Prevent closing during export
    
    reset();
    setExportStatus('idle');
    setExportProgress(0);
    setDownloadUrl(null);
    onClose();
  };

  const getStatusIcon = () => {
    switch (exportStatus) {
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Download className="h-5 w-5" />;
    }
  };

  const getStatusText = () => {
    switch (exportStatus) {
      case 'preparing':
        return 'Preparing export...';
      case 'processing':
        return 'Processing your data...';
      case 'ready':
        return 'Your data is ready for download';
      case 'error':
        return 'Export failed. Please try again.';
      default:
        return 'Export Your Data';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <DialogTitle>{getStatusText()}</DialogTitle>
          </div>
          <DialogDescription>
            {exportStatus === 'idle' && (
              "Download a copy of your personal data. This includes all information associated with your account."
            )}
            {exportStatus === 'processing' && (
              "We're collecting and preparing your data. This may take a few minutes."
            )}
            {exportStatus === 'ready' && (
              "Your data export is complete and ready for download as a ZIP file."
            )}
            {exportStatus === 'error' && (
              "There was an error processing your request. Please try again or contact support."
            )}
          </DialogDescription>
        </DialogHeader>

        {exportStatus === 'processing' && (
          <div className="space-y-4">
            <Progress value={exportProgress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              {exportProgress.toFixed(0)}% complete
            </p>
          </div>
        )}

        {exportStatus === 'ready' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Export Ready</span>
              </CardTitle>
              <CardDescription>
                Your data export has been prepared and is ready for download.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">astewai-data-export.zip</p>
                  <p className="text-sm text-muted-foreground">
                    Estimated size: ~{estimatedTotalSize} MB
                  </p>
                </div>
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>This download link will expire in 7 days</li>
                  <li>The file contains sensitive personal information</li>
                  <li>Store the file securely and delete it when no longer needed</li>
                  <li>Contact support if you have any questions about your data</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {(exportStatus === 'idle' || exportStatus === 'error') && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Data Categories</CardTitle>
                <CardDescription>
                  Choose which types of data you want to include in your export.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {dataCategories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = watchedValues[category.id] as boolean;
                    
                    return (
                      <div
                        key={category.id}
                        className={`border rounded-lg p-4 transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleCategoryChange(category.id, !!checked)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Icon className="h-4 w-4 text-primary" />
                              <h4 className="font-medium">{category.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {category.estimatedSize}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {category.description}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              <p className="font-medium mb-1">Includes:</p>
                              <ul className="list-disc list-inside space-y-0.5">
                                {category.includes.map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {selectedCategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Export Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Selected categories:</span>
                      <span>{selectedCategories.length} of {dataCategories.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Estimated size:</span>
                      <span>~{estimatedTotalSize} MB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Format:</span>
                      <span>ZIP archive with JSON files</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Reason for Export (Optional)</CardTitle>
                <CardDescription>
                  Help us understand why you're requesting your data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...register('reason')}
                  placeholder="e.g., Account portability, data backup, compliance requirements..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-2">Data Protection Notice</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Your data will be exported in a secure, encrypted format</li>
                    <li>The download link will be sent to your registered email address</li>
                    <li>Export files are automatically deleted after 7 days</li>
                    <li>This process may take up to 30 days as required by GDPR</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={selectedCategories.length === 0 || exportStatus === 'processing'}
              >
                <Download className="w-4 h-4 mr-2" />
                Start Export
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}