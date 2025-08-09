'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Tag,
  User,
  BarChart3,
  Settings
} from 'lucide-react';
import { getBlogPosts, BlogPost } from '@/lib/repositories/blogRepository';
import { BlogCreateDialog } from './blog-create-dialog';
import { BlogEditDialog } from './blog-edit-dialog';
import { BlogDeleteDialog } from './blog-delete-dialog';
import { BlogAnalyticsDialog } from './blog-analytics-dialog';
import { BlogSettingsDialog } from './blog-settings-dialog';
import { formatDate } from '@/utils/format';
import { LoadingSkeletons } from '@/components/ui/loading-skeletons';

export function BlogManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: () => getBlogPosts({ published: undefined }), // Get all posts including drafts
  });

  const filteredPosts = posts?.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const publishedPosts = posts?.filter(post => post.published) || [];
  const draftPosts = posts?.filter(post => !post.published) || [];

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setShowEditDialog(true);
  };

  const handleDelete = (post: BlogPost) => {
    setSelectedPost(post);
    setShowDeleteDialog(true);
  };

  const handleViewAnalytics = (post: BlogPost) => {
    setSelectedPost(post);
    setShowAnalyticsDialog(true);
  };

  const handleDialogClose = () => {
    setSelectedPost(null);
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setShowDeleteDialog(false);
    setShowAnalyticsDialog(false);
    setShowSettingsDialog(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <LoadingSkeletons.Text className="h-8 w-48" />
          <LoadingSkeletons.Button />
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeletons.Card key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Failed to load blog posts</h3>
        <p className="text-muted-foreground mb-4">Please try again later.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage your blog posts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettingsDialog(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedPosts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftPosts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(posts?.map(p => p.category)).size || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, category, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Posts Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Posts ({posts?.length || 0})</TabsTrigger>
          <TabsTrigger value="published">Published ({publishedPosts.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({draftPosts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <PostsList 
            posts={filteredPosts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewAnalytics={handleViewAnalytics}
          />
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          <PostsList 
            posts={publishedPosts.filter(post =>
              post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              post.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
              post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            )}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewAnalytics={handleViewAnalytics}
          />
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          <PostsList 
            posts={draftPosts.filter(post =>
              post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              post.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
              post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            )}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewAnalytics={handleViewAnalytics}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BlogCreateDialog
        open={showCreateDialog}
        onClose={handleDialogClose}
      />

      {selectedPost && (
        <>
          <BlogEditDialog
            open={showEditDialog}
            post={selectedPost}
            onClose={handleDialogClose}
          />

          <BlogDeleteDialog
            open={showDeleteDialog}
            post={selectedPost}
            onClose={handleDialogClose}
          />

          <BlogAnalyticsDialog
            open={showAnalyticsDialog}
            post={selectedPost}
            onClose={handleDialogClose}
          />
        </>
      )}

      <BlogSettingsDialog
        open={showSettingsDialog}
        onClose={handleDialogClose}
      />
    </div>
  );
}

interface PostsListProps {
  posts: BlogPost[];
  onEdit: (post: BlogPost) => void;
  onDelete: (post: BlogPost) => void;
  onViewAnalytics: (post: BlogPost) => void;
}

function PostsList({ posts, onEdit, onDelete, onViewAnalytics }: PostsListProps) {
  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No posts found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or create a new post.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <Badge variant={post.published ? "default" : "secondary"}>
                    {post.published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {post.excerpt}
                </CardDescription>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{post.author_id}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <Badge variant="outline">{post.category}</Badge>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewAnalytics(post)}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(post)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(post)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {post.tags && post.tags.length > 0 && (
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}