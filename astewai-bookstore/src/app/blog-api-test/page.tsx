'use client';

import { useState, useEffect } from 'react';

export default function BlogApiTestPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/blog?published=true&limit=5');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPosts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Blog API Test</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Blog API Test - Error</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Blog API Test</h1>
      
      <div className="space-y-4">
        <p>API returned {posts?.length || 0} blog posts</p>
        
        {posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="border p-4 rounded-lg">
                <h2 className="text-xl font-semibold">{post.title}</h2>
                <p className="text-gray-600">{post.excerpt}</p>
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
                    {post.tags.map((tag: string) => (
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