import { generateMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbStructuredData } from '@/lib/seo/structured-data';
import { StructuredData } from '@/components/seo/structured-data';
import { BlogList } from '@/components/blog';
import { getBlogPosts } from '@/lib/database';

export const metadata = generateMetadata({
  title: 'Blog - Book Reviews, Reading Tips & Author Interviews',
  description: 'Read our latest blog posts about books, reading tips, author interviews, and literary discussions. Stay updated with the world of books.',
  url: '/blog',
  type: 'website',
  tags: ['blog', 'book reviews', 'reading tips', 'author interviews', 'literature', 'books'],
});

export default async function BlogPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com';

  // Fetch initial blog posts for SSR
  const initialPosts = await getBlogPosts({ published: true });

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: baseUrl },
    { name: 'Blog', url: `${baseUrl}/blog` },
  ]);

  return (
    <>
      <StructuredData data={breadcrumbStructuredData} id="blog-breadcrumb" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Blog</h1>
          <p className="text-muted-foreground text-lg">
            Read the latest posts about books, reading tips, author interviews, and literary discussions. 
            Stay updated with the world of books and discover new perspectives on literature.
          </p>
        </div>
        
        <BlogList initialPosts={initialPosts} />
      </div>
    </>
  );
}
