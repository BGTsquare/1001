import { Metadata } from 'next';
import { BlogManager } from '@/components/admin/blog-manager';

export const metadata: Metadata = {
  title: 'Blog Management - Admin Dashboard',
  description: 'Manage blog posts, create new content, and track engagement.',
};

export default function AdminBlogPage() {
  return (
    <div className="container mx-auto py-6">
      <BlogManager />
    </div>
  );
}