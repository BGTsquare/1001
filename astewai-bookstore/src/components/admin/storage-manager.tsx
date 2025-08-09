'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  Settings, 
  RefreshCw,
  AlertTriangle,
  HardDrive,
  Upload
} from 'lucide-react';

interface StorageStatus {
  success: boolean;
  storage: {
    totalBuckets: number;
    allBuckets: Array<{
      id: string;
      name: string;
      public: boolean;
      fileSizeLimit?: number;
      allowedMimeTypes?: string[];
    }>;
    booksBucket: any;
    booksBucketExists: boolean;
    booksBucketAccessible: boolean;
  };
  timestamp: string;
}

export function StorageManager() {
  const queryClient = useQueryClient();

  const { data: status, isLoading, error, refetch } = useQuery<StorageStatus>({
    queryKey: ['storage-status'],
    queryFn: async () => {
      const response = await fetch('/api/admin/storage/status');
      if (!response.ok) {
        throw new Error('Failed to fetch storage status');
      }
      return response.json();
    },
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/storage/setup', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to setup storage');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-status'] });
    },
  });

  const handleSetupStorage = () => {
    setupMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Storage Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading storage status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Storage Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load storage status. Please try again.
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const storageData = status?.storage;
  const booksBucketStatus = storageData?.booksBucketExists && storageData?.booksBucketAccessible;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Storage Management</span>
          </CardTitle>
          <CardDescription>
            Manage file storage buckets and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Storage Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Total Buckets:</span>
              <Badge variant="outline">{storageData?.totalBuckets || 0}</Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Books Bucket:</span>
              {storageData?.booksBucketExists ? (
                <Badge variant="default" className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Exists</span>
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <XCircle className="h-3 w-3" />
                  <span>Missing</span>
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Status:</span>
              {booksBucketStatus ? (
                <Badge variant="default" className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Ready</span>
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <XCircle className="h-3 w-3" />
                  <span>Not Ready</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Books Bucket Status */}
          {!storageData?.booksBucketExists && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The 'books' storage bucket is not configured. This is required for file uploads.
                Click the button below to set it up automatically.
              </AlertDescription>
            </Alert>
          )}

          {storageData?.booksBucketExists && !storageData?.booksBucketAccessible && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                The 'books' bucket exists but is not accessible. There may be a permissions issue.
              </AlertDescription>
            </Alert>
          )}

          {booksBucketStatus && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Storage is properly configured and ready for file uploads.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleSetupStorage}
              disabled={setupMutation.isPending}
              variant={storageData?.booksBucketExists ? "outline" : "default"}
            >
              {setupMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              {storageData?.booksBucketExists ? 'Reconfigure Storage' : 'Setup Storage'}
            </Button>

            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </div>

          {setupMutation.error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Setup failed: {setupMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          {setupMutation.isSuccess && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Storage setup completed successfully!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Bucket Details */}
      {storageData?.allBuckets && storageData.allBuckets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Storage Buckets</CardTitle>
            <CardDescription>
              All configured storage buckets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {storageData.allBuckets.map((bucket) => (
                <div key={bucket.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{bucket.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {bucket.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={bucket.public ? "default" : "secondary"}>
                      {bucket.public ? "Public" : "Private"}
                    </Badge>
                    {bucket.id === 'books' && (
                      <Badge variant="outline">Books</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}