import { getBlogPosts } from '@/lib/database';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function BlogTestSimplePage() {
  const posts = await getBlogPosts({ published: true, limit: 5 });

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Blog Test - Simple</h1>
      
      <div className="space-y-4">
        <p>Found {posts?.length || 0} blog posts</p>
        
        {posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="border p-4 rounded-lg">
                <h2 className="text-xl font-semibold">{post.title}</h2>
                <p className="text-muted-foreground">{post.excerpt}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {post.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                {post.tags && (
                  <div className="flex gap-1 mt-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-blue-100 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No blog posts found.</p>
        )}
      </div>
    </div>
  );
}