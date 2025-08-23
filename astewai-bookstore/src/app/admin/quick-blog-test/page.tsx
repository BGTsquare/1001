'use client';

import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function QuickBlogTestPageContent() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testBlogAPI = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      // Test fetching blog posts
      console.log('Testing blog API...');
      const response = await fetch('/api/blog?published=true');
      const data = await response.json();
      
      setResult({
        success: response.ok,
        status: response.status,
        data: data,
        message: response.ok ? 'Blog API is working!' : 'Blog API returned an error'
      });
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log('Testing database connection...');
      const response = await fetch('/api/test-blog');
      const data = await response.json();
      
      setResult({
        success: response.ok,
        status: response.status,
        data: data,
        message: response.ok ? 'Database connection is working!' : 'Database connection failed'
      });
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createQuickPost = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log('Creating quick blog post...');
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Quick Test Post ${new Date().toISOString()}`,
          excerpt: 'This is a quick test post created from the admin panel.',
          content: 'This is the content of a quick test post to verify the blog functionality.',
          category: 'Test',
          tags: ['test', 'quick'],
          published: true
        }),
      });
      
      const data = await response.json();
      
      setResult({
        success: response.ok,
        status: response.status,
        data: data,
        message: response.ok ? 'Blog post created successfully!' : 'Failed to create blog post'
      });
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Quick Blog Test</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Test Database</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testDatabaseConnection} disabled={isLoading} className="w-full">
              {isLoading ? 'Testing...' : 'Test Database'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Blog API</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testBlogAPI} disabled={isLoading} className="w-full">
              {isLoading ? 'Testing...' : 'Test API'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Test Post</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={createQuickPost} disabled={isLoading} className="w-full">
              {isLoading ? 'Creating...' : 'Create Post'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className={result.success ? 'text-green-600' : 'text-red-600'}>
              {result.message || (result.success ? 'Success' : 'Error')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-auto whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function QuickBlogTestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuickBlogTestPageContent />
    </Suspense>
  );
}