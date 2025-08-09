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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Trash2, 
  Shield, 
  Clock, 
  FileText,
  User,
  BookOpen,
  ShoppingCart,
  MessageSquare,
  Database,
  CheckCircle
} from 'lucide-react';

const accountDeletionSchema = z.object({
  confirmEmail: z.string().email('Please enter a valid email address'),
  confirmText: z.string().refine(
    (val) => val === 'DELETE MY ACCOUNT',
    'Please type "DELETE MY ACCOUNT" to confirm'
  ),
  reason: z.string().min(1, 'Please provide a reason for deletion'),
  feedback: z.string().optional(),
  acknowledgeConsequences: z.boolean().refine(
    (val) => val === true,
    'You must acknowledge the consequences of account deletion'
  ),
  requestDataExport: z.boolean().default(false),
});

type AccountDeletionFormData = z.infer<typeof accountDeletionSchema>;

interface AccountDeletionDialogProps {
  open: boolean;
  onClose: () => void;
  userEmail: string;
}

type DeletionStatus = 'form' | 'processing' | 'scheduled' | 'error';

const dataToBeDeleted = [
  {
    category: 'Profile Information',
    icon: User,
    items: ['Personal details', 'Account preferences', 'Profile settings', 'Contact information'],
    retention: 'Deleted immediately',
  },
  {
    category: 'Library & Reading Data',
    icon: BookOpen,
    items: ['Book collection', 'Reading progress', 'Bookmarks', 'Reading statistics'],
    retention: 'Deleted immediately',
  },
  {
    category: 'Purchase History',
    icon: ShoppingCart,
    items: ['Transaction records', 'Payment information', 'Receipts'],
    retention: 'Retained for 7 years (legal requirement)',
  },
  {
    category: 'User Content',
    icon: MessageSquare,
    items: ['Reviews and ratings', 'Comments', 'Community posts'],
    retention: 'Anonymized immediately',
  },
  {
    category: 'System Data',
    icon: Database,
    items: ['Login logs', 'Usage analytics', 'Error logs'],
    retention: 'Deleted after 30 days',
  },
];

const deletionReasons = [
  'No longer using the service',
  'Privacy concerns',
  'Found a better alternative',
  'Too many emails/notifications',
  'Account security concerns',
  'Service not meeting expectations',
  'Other (please specify)',
];

export function AccountDeletionDialog({ open, onClose, userEmail }: AccountDeletionDialogProps) {
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus>('form');
  const [activeTab, setActiveTab] = useState('consequences');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AccountDeletionFormData>({
    resolver: zodResolver(accountDeletionSchema),
    defaultValues: {
      confirmEmail: '',
      confirmText: '',
      reason: '',
      feedback: '',
      acknowledgeConsequences: false,
      requestDataExport: false,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: AccountDeletionFormData) => {
    if (data.confirmEmail !== userEmail) {
      return;
    }

    setDeletionStatus('processing');

    try {
      // TODO: Implement actual account deletion API call
      console.log('Deleting account:', data);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setDeletionStatus('scheduled');
      
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeletionStatus('error');
    }
  };

  const handleClose = () => {
    if (deletionStatus === 'processing') return; // Prevent closing during processing
    
    reset();
    setDeletionStatus('form');
    setActiveTab('consequences');
    onClose();
  };

  const isFormValid = watchedValues.confirmEmail === userEmail && 
                     watchedValues.confirmText === 'DELETE MY ACCOUNT' &&
                     watchedValues.acknowledgeConsequences &&
                     watchedValues.reason;

  if (deletionStatus === 'scheduled') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <DialogTitle>Account Deletion Scheduled</DialogTitle>
            </div>
            <DialogDescription>
              Your account deletion request has been processed successfully.
            </DialogDescription>
          </DialogHeader>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Deletion Request Confirmed</h3>
                  <p className="text-muted-foreground">
                    Your account will be permanently deleted within 30 days as required by GDPR regulations.
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Request submitted:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Deletion date:</span>
                      <span className="font-medium">
                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Confirmation email sent to:</span>
                      <span className="font-medium">{userEmail}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>
                    You can cancel this deletion request by logging into your account 
                    within the next 30 days. After this period, the deletion will be irreversible.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (deletionStatus === 'processing') {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              <span>Processing Deletion Request</span>
            </DialogTitle>
            <DialogDescription>
              Please wait while we process your account deletion request.
            </DialogDescription>
          </DialogHeader>

          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
            <p className="text-muted-foreground">
              This may take a few moments...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Account</DialogTitle>
          </div>
          <DialogDescription>
            Permanently delete your account and all associated data. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consequences">Consequences</TabsTrigger>
            <TabsTrigger value="data">Data Deletion</TabsTrigger>
            <TabsTrigger value="confirm">Confirm Deletion</TabsTrigger>
          </TabsList>

          <TabsContent value="consequences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span>Important: Account Deletion Consequences</span>
                </CardTitle>
                <CardDescription>
                  Please read and understand what will happen when you delete your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="border-l-4 border-destructive pl-4">
                    <h4 className="font-semibold text-destructive mb-2">Immediate Effects</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>You will be immediately logged out of all devices</li>
                      <li>Your account will be deactivated and inaccessible</li>
                      <li>You will lose access to your purchased books and library</li>
                      <li>All reading progress and bookmarks will be lost</li>
                      <li>Your reviews and comments will be anonymized</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold text-orange-700 mb-2">Data Retention</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Purchase records retained for 7 years (legal requirement)</li>
                      <li>Anonymized usage data may be retained for analytics</li>
                      <li>Some data may be retained in backups for up to 90 days</li>
                      <li>Customer support tickets may be retained for reference</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-blue-700 mb-2">Recovery Options</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>30-day grace period to cancel deletion request</li>
                      <li>After 30 days, deletion is permanent and irreversible</li>
                      <li>No way to recover books, progress, or account data</li>
                      <li>You can create a new account, but it will start fresh</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Alternative Options</p>
                      <p className="text-muted-foreground">
                        Consider temporarily deactivating your account or adjusting your privacy 
                        settings instead of permanent deletion. You can also export your data 
                        before deletion if needed.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Deletion Overview</CardTitle>
                <CardDescription>
                  Here's what will happen to each type of data when you delete your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dataToBeDeleted.map((category, index) => {
                    const Icon = category.icon;
                    
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{category.category}</h4>
                              <Badge 
                                variant={category.retention.includes('immediately') ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {category.retention}
                              </Badge>
                            </div>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                              {category.items.map((item, itemIndex) => (
                                <li key={itemIndex}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">Data Export Recommendation</p>
                      <p className="text-blue-700">
                        We recommend exporting your data before deletion. This ensures you have 
                        a copy of your information for your records.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confirm" className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Deletion Confirmation</CardTitle>
                  <CardDescription>
                    Please complete the following steps to confirm account deletion.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirmEmail">Confirm your email address</Label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      {...register('confirmEmail')}
                      placeholder={userEmail}
                    />
                    {errors.confirmEmail && (
                      <p className="text-sm text-destructive">{errors.confirmEmail.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmText">
                      Type "DELETE MY ACCOUNT" to confirm
                    </Label>
                    <Input
                      id="confirmText"
                      {...register('confirmText')}
                      placeholder="DELETE MY ACCOUNT"
                    />
                    {errors.confirmText && (
                      <p className="text-sm text-destructive">{errors.confirmText.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for deletion *</Label>
                    <select
                      {...register('reason')}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Select a reason...</option>
                      {deletionReasons.map((reason, index) => (
                        <option key={index} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                    {errors.reason && (
                      <p className="text-sm text-destructive">{errors.reason.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">Additional feedback (optional)</Label>
                    <Textarea
                      id="feedback"
                      {...register('feedback')}
                      placeholder="Help us improve by sharing your experience..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="requestDataExport"
                        checked={watchedValues.requestDataExport}
                        onCheckedChange={(checked) => setValue('requestDataExport', !!checked)}
                      />
                      <Label htmlFor="requestDataExport" className="text-sm">
                        Request data export before deletion (recommended)
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="acknowledgeConsequences"
                        checked={watchedValues.acknowledgeConsequences}
                        onCheckedChange={(checked) => setValue('acknowledgeConsequences', !!checked)}
                      />
                      <Label htmlFor="acknowledgeConsequences" className="text-sm">
                        I understand that this action is permanent and cannot be undone. 
                        I acknowledge that I will lose access to all my data, purchases, 
                        and account information.
                      </Label>
                    </div>
                    {errors.acknowledgeConsequences && (
                      <p className="text-sm text-destructive">{errors.acknowledgeConsequences.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="destructive"
                  disabled={!isFormValid}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account Permanently
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}