import { getBlogPosts } from '@/lib/database';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function BlogDebugPage() {
  try {
    const posts = await getBlogPosts({ published: true });
    
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Blog Debug</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Posts Count: {posts?.length || 0}</h2>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">Raw Data:</h3>
            <pre className="text-sm overflow-auto whitespace-pre-wrap">
              {JSON.stringify(posts, null, 2)}
            </pre>
          </div>
          
          {posts && posts.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">First Post:</h3>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium">{posts[0].title}</h4>
                <p className="text-sm text-muted-foreground">{posts[0].excerpt}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Category: {posts[0].category} | Published: {posts[0].published ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Blog Debug - Error</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <h2 className="text-red-800 font-medium">Error occurred:</h2>
          <pre className="text-red-700 text-sm mt-2">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
          <pre className="text-red-600 text-xs mt-2">
            {error instanceof Error ? error.stack : ''}
          </pre>
        </div>
      </div>
    );
  }
}