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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, Save, Eye, Calendar } from 'lucide-react';

const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  excerpt: z.string().min(1, 'Excerpt is required').max(500, 'Excerpt must be less than 500 characters'),
  content: z.string().min(1, 'Content is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  published: z.boolean().default(false),
  scheduledDate: z.string().optional(),
});

type BlogPostFormData = z.infer<typeof blogPostSchema>;

interface BlogCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

const predefinedCategories = [
  'Technology',
  'Reviews',
  'Tips',
  'Interviews',
  'Science',
  'News',
  'Tutorials',
  'Opinion'
];

const predefinedTags = [
  'digital',
  'reading',
  'books',
  'e-books',
  'literature',
  'author',
  'writing',
  'publishing',
  'education',
  'technology',
  'reviews',
  'recommendations',
  'tips',
  'productivity',
  'learning'
];

export function BlogCreateDialog({ open, onClose }: BlogCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [activeTab, setActiveTab] = useState('content');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      category: '',
      tags: [],
      published: false,
      scheduledDate: '',
    },
  });

  const watchedTags = watch('tags') || [];
  const watchedCategory = watch('category');
  const watchedPublished = watch('published');
  const watchedTitle = watch('title');
  const watchedExcerpt = watch('excerpt');
  const watchedContent = watch('content');

  const handleAddTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      setValue('tags', [...watchedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const handleAddPredefinedTag = (tag: string) => {
    if (!watchedTags.includes(tag)) {
      setValue('tags', [...watchedTags, tag]);
    }
  };

  const handleCategoryChange = (category: string) => {
    if (category === 'custom') {
      setValue('category', '');
    } else {
      setValue('category', category);
      setCustomCategory('');
    }
  };

  const handleCustomCategoryAdd = () => {
    if (customCategory.trim()) {
      setValue('category', customCategory.trim());
      setCustomCategory('');
    }
  };

  const onSubmit = async (data: BlogPostFormData) => {
    setIsSubmitting(true);
    try {
      const { createBlogPost } = await import('@/lib/repositories/blogRepository');
      
      await createBlogPost({
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        tags: data.tags,
        published: data.published,
        // Remove undefined featured_image_url reference
      });
      
      // Reset form and close dialog
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating blog post:', error);
      // TODO: Add proper error handling with toast notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setNewTag('');
    setCustomCategory('');
    setActiveTab('content');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Blog Post</DialogTitle>
          <DialogDescription>
            Create and publish a new blog post for your readers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Enter blog post title..."
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Textarea
                  id="excerpt"
                  {...register('excerpt')}
                  placeholder="Brief description of the blog post..."
                  rows={3}
                />
                {errors.excerpt && (
                  <p className="text-sm text-destructive">{errors.excerpt.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  {...register('content')}
                  placeholder="Write your blog post content here..."
                  rows={12}
                  className="font-mono"
                />
                {errors.content && (
                  <p className="text-sm text-destructive">{errors.content.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Tip: You can use markdown formatting for rich text.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Category</CardTitle>
                    <CardDescription>Choose or create a category</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select onValueChange={handleCategoryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {predefinedCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">+ Create new category</SelectItem>
                      </SelectContent>
                    </Select>

                    {watchedCategory === '' && (
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Enter custom category"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCustomCategoryAdd}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {watchedCategory && (
                      <Badge variant="secondary">{watchedCategory}</Badge>
                    )}

                    {errors.category && (
                      <p className="text-sm text-destructive">{errors.category.message}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tags</CardTitle>
                    <CardDescription>Add relevant tags</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add a tag"
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

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Suggested tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {predefinedTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={watchedTags.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => handleAddPredefinedTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {watchedTags.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Selected tags:</p>
                        <div className="flex flex-wrap gap-1">
                          {watchedTags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
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
                      </div>
                    )}

                    {errors.tags && (
                      <p className="text-sm text-destructive">{errors.tags.message}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Publishing Options</CardTitle>
                  <CardDescription>Control when and how your post is published</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="published"
                      checked={watchedPublished}
                      onCheckedChange={(checked) => setValue('published', !!checked)}
                    />
                    <Label htmlFor="published">Publish immediately</Label>
                  </div>

                  {!watchedPublished && (
                    <div className="space-y-2">
                      <Label htmlFor="scheduledDate">Schedule for later (optional)</Label>
                      <Input
                        id="scheduledDate"
                        type="datetime-local"
                        {...register('scheduledDate')}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">SEO Preview</CardTitle>
                  <CardDescription>How your post will appear in search results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h3 className="text-blue-600 text-lg font-medium line-clamp-1">
                      {watchedTitle || 'Blog Post Title'}
                    </h3>
                    <p className="text-green-700 text-sm">
                      https://astewai-bookstore.com/blog/post-slug
                    </p>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {watchedExcerpt || 'Blog post excerpt will appear here...'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Title Length:</p>
                      <p className={watchedTitle?.length > 60 ? 'text-destructive' : 'text-muted-foreground'}>
                        {watchedTitle?.length || 0}/60 characters
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Excerpt Length:</p>
                      <p className={watchedExcerpt?.length > 160 ? 'text-destructive' : 'text-muted-foreground'}>
                        {watchedExcerpt?.length || 0}/160 characters
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Post Preview</CardTitle>
                  <CardDescription>How your post will look to readers</CardDescription>
                </CardHeader>
                <CardContent>
                  <article className="prose prose-sm max-w-none">
                    <header className="mb-6">
                      <h1 className="text-2xl font-bold mb-2">
                        {watchedTitle || 'Blog Post Title'}
                      </h1>
                      <p className="text-lg text-muted-foreground mb-4">
                        {watchedExcerpt || 'Blog post excerpt...'}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>By Admin</span>
                        <span>•</span>
                        <span>{new Date().toLocaleDateString()}</span>
                        {watchedCategory && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary">{watchedCategory}</Badge>
                          </>
                        )}
                      </div>
                    </header>
                    <div className="whitespace-pre-wrap">
                      {watchedContent || 'Blog post content will appear here...'}
                    </div>
                  </article>
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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {watchedPublished ? 'Publish' : 'Save Draft'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}