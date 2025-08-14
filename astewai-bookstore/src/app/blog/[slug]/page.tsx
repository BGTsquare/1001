import { notFound } from 'next/navigation';
import { generateBlogPostMetadata } from '@/lib/seo/metadata';
import { generateArticleStructuredData, generateBreadcrumbStructuredData } from '@/lib/seo/structured-data';
import { MultipleStructuredData } from '@/components/seo/structured-data';
import { BlogPost } from '@/components/blog';
import { getBlogPostById } from '@/lib/database';
import { getRelatedBlogPosts } from '@/lib/repositories/blogRepository';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await getBlogPostById(slug);

  if (!post) {
    notFound();
  }

  // Get related posts
  const relatedPosts = await getRelatedBlogPosts(post.id, 3);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com';

  // Generate structured data
  const articleStructuredData = generateArticleStructuredData({
    headline: post.title,
    description: post.excerpt,
    author: post.author_id,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    image: undefined, // We don't have featured images in our mock data
    url: `${baseUrl}/blog/${slug}`,
  });

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: baseUrl },
    { name: 'Blog', url: `${baseUrl}/blog` },
    { name: post.title, url: `${baseUrl}/blog/${slug}` },
  ]);

  return (
    <>
      <MultipleStructuredData
        dataArray={[
          { data: articleStructuredData, id: 'article-structured-data' },
          { data: breadcrumbStructuredData, id: 'breadcrumb-structured-data' },
        ]}
      />
      <div className="container mx-auto px-4 py-8">
        <BlogPost post={post} relatedPosts={relatedPosts} />
      </div>
    </>
  );
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await getBlogPostById(slug);

  if (!post) {
    return {
      title: 'Blog Post Not Found',
    };
  }

  return generateBlogPostMetadata({
    ...post,
    author: post.author_id,
    published_at: post.created_at,
    featured_image_url: undefined,
  });
}