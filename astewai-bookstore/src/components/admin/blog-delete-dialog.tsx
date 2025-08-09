'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { BlogPost } from '@/lib/repositories/blogRepository';
import { formatDate } from '@/utils/format';

interface BlogDeleteDialogProps {
  open: boolean;
  post: BlogPost;
  onClose: () => void;
}

export function BlogDeleteDialog({ open, post, onClose }: BlogDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // TODO: Implement actual blog post deletion API call
      console.log('Deleting blog post:', post.id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close dialog
      onClose();
    } catch (error) {
      console.error('Error deleting blog post:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Blog Post</DialogTitle>
          </div>
          <DialogDescription>
            This action cannot be undone. The blog post will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium line-clamp-1">{post.title}</h3>
                <Badge variant={post.published ? "default" : "secondary"}>
                  {post.published ? "Published" : "Draft"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {post.excerpt}
              </p>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>By {post.author_id}</span>
                <span>•</span>
                <span>{formatDate(post.created_at)}</span>
                <span>•</span>
                <Badge variant="outline" className="text-xs">
                  {post.category}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Warning</p>
                <p className="text-muted-foreground">
                  Deleting this blog post will:
                </p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                  <li>Remove the post from your blog</li>
                  <li>Break any existing links to this post</li>
                  <li>Remove all associated analytics data</li>
                  {post.published && (
                    <li>Make the post unavailable to readers immediately</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Post
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}