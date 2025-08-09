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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Save, 
  Tag, 
  Folder, 
  Globe, 
  Mail,
  X,
  Plus
} from 'lucide-react';

const blogSettingsSchema = z.object({
  blogTitle: z.string().min(1, 'Blog title is required'),
  blogDescription: z.string().min(1, 'Blog description is required'),
  postsPerPage: z.number().min(1).max(50),
  allowComments: z.boolean(),
  moderateComments: z.boolean(),
  emailNotifications: z.boolean(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  categories: z.array(z.string()),
  tags: z.array(z.string()),
});

type BlogSettingsFormData = z.infer<typeof blogSettingsSchema>;

interface BlogSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const defaultSettings: BlogSettingsFormData = {
  blogTitle: 'Astewai Bookstore Blog',
  blogDescription: 'Discover the latest in books, reading tips, and literary discussions.',
  postsPerPage: 10,
  allowComments: true,
  moderateComments: true,
  emailNotifications: true,
  seoTitle: 'Blog - Book Reviews, Reading Tips & Author Interviews',
  seoDescription: 'Read our latest blog posts about books, reading tips, author interviews, and literary discussions.',
  categories: ['Technology', 'Reviews', 'Tips', 'Interviews', 'Science', 'News'],
  tags: ['digital', 'reading', 'books', 'e-books', 'literature', 'author', 'writing', 'publishing'],
};

export function BlogSettingsDialog({ open, onClose }: BlogSettingsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BlogSettingsFormData>({
    resolver: zodResolver(blogSettingsSchema),
    defaultValues: defaultSettings,
  });

  const watchedCategories = watch('categories') || [];
  const watchedTags = watch('tags') || [];

  const handleAddCategory = () => {
    if (newCategory.trim() && !watchedCategories.includes(newCategory.trim())) {
      setValue('categories', [...watchedCategories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setValue('categories', watchedCategories.filter(cat => cat !== categoryToRemove));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      setValue('tags', [...watchedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data: BlogSettingsFormData) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement actual blog settings update API call
      console.log('Updating blog settings:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close dialog
      onClose();
    } catch (error) {
      console.error('Error updating blog settings:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setNewCategory('');
    setNewTag('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <DialogTitle>Blog Settings</DialogTitle>
          </div>
          <DialogDescription>
            Configure your blog settings and preferences.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                  <CardDescription>Configure your blog's basic settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="blogTitle">Blog Title</Label>
                    <Input
                      id="blogTitle"
                      {...register('blogTitle')}
                      placeholder="Enter blog title..."
                    />
                    {errors.blogTitle && (
                      <p className="text-sm text-destructive">{errors.blogTitle.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blogDescription">Blog Description</Label>
                    <Textarea
                      id="blogDescription"
                      {...register('blogDescription')}
                      placeholder="Brief description of your blog..."
                      rows={3}
                    />
                    {errors.blogDescription && (
                      <p className="text-sm text-destructive">{errors.blogDescription.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postsPerPage">Posts per Page</Label>
                    <Select 
                      value={watch('postsPerPage')?.toString()} 
                      onValueChange={(value) => setValue('postsPerPage', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select posts per page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 posts</SelectItem>
                        <SelectItem value="10">10 posts</SelectItem>
                        <SelectItem value="15">15 posts</SelectItem>
                        <SelectItem value="20">20 posts</SelectItem>
                        <SelectItem value="25">25 posts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comment Settings</CardTitle>
                  <CardDescription>Control how comments work on your blog</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allowComments"
                      checked={watch('allowComments')}
                      onCheckedChange={(checked) => setValue('allowComments', !!checked)}
                    />
                    <Label htmlFor="allowComments">Allow comments on blog posts</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="moderateComments"
                      checked={watch('moderateComments')}
                      onCheckedChange={(checked) => setValue('moderateComments', !!checked)}
                      disabled={!watch('allowComments')}
                    />
                    <Label htmlFor="moderateComments">Moderate comments before publishing</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Folder className="h-4 w-4" />
                    <CardTitle className="text-lg">Categories</CardTitle>
                  </div>
                  <CardDescription>Manage blog post categories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add new category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCategory}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {watchedCategories.map((category) => (
                      <Badge key={category} variant="secondary" className="text-sm">
                        {category}
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(category)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <CardTitle className="text-lg">Tags</CardTitle>
                  </div>
                  <CardDescription>Manage blog post tags</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add new tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddTag}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {watchedTags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <CardTitle className="text-lg">SEO Settings</CardTitle>
                  </div>
                  <CardDescription>Optimize your blog for search engines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seoTitle">SEO Title</Label>
                    <Input
                      id="seoTitle"
                      {...register('seoTitle')}
                      placeholder="SEO-optimized title for search engines..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: 50-60 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seoDescription">SEO Description</Label>
                    <Textarea
                      id="seoDescription"
                      {...register('seoDescription')}
                      placeholder="SEO-optimized description for search engines..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: 150-160 characters
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Search Preview</h4>
                    <div className="space-y-1">
                      <h3 className="text-blue-600 text-lg font-medium line-clamp-1">
                        {watch('seoTitle') || watch('blogTitle') || 'Blog Title'}
                      </h3>
                      <p className="text-green-700 text-sm">
                        https://astewai-bookstore.com/blog
                      </p>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {watch('seoDescription') || watch('blogDescription') || 'Blog description...'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <CardTitle className="text-lg">Email Notifications</CardTitle>
                  </div>
                  <CardDescription>Configure email notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emailNotifications"
                      checked={watch('emailNotifications')}
                      onCheckedChange={(checked) => setValue('emailNotifications', !!checked)}
                    />
                    <Label htmlFor="emailNotifications">
                      Send email notifications for new comments
                    </Label>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Additional notification settings:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>New blog post published</li>
                      <li>Comment moderation required</li>
                      <li>Weekly blog performance summary</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}