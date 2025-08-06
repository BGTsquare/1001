import { notFound } from 'next/navigation';
import { generateBlogPostMetadata } from '@/lib/seo/metadata';
import { generateArticleStructuredData, generateBreadcrumbStructuredData } from '@/lib/seo/structured-data';
import { MultipleStructuredData } from '@/components/seo/structured-data';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// TODO: Replace with actual blog service when implemented
async function getBlogPost(slug: string) {
  // Placeholder - replace with actual blog post fetching
  return null;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com';

  // Generate structured data
  const articleStructuredData = generateArticleStructuredData({
    headline: post.title,
    description: post.excerpt,
    author: post.author,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    image: post.featured_image_url,
    url: `${baseUrl}/blog/${params.slug}`,
  });

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: baseUrl },
    { name: 'Blog', url: `${baseUrl}/blog` },
    { name: post.title, url: `${baseUrl}/blog/${params.slug}` },
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
        <article>
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-4">{post.excerpt}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {post.author && <span>By {post.author}</span>}
              {post.published_at && (
                <time dateTime={post.published_at}>
                  {new Date(post.published_at).toLocaleDateString()}
                </time>
              )}
            </div>
          </header>
          
          {post.featured_image_url && (
            <div className="mb-8">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            {/* TODO: Render blog post content */}
            <p>Blog post content will be rendered here when blog functionality is implemented.</p>
          </div>
        </article>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return {
      title: 'Blog Post Not Found',
    };
  }

  return generateBlogPostMetadata(post);
}