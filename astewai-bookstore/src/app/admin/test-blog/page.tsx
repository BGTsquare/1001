'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestBlogPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: 'Test Blog Post',
    excerpt: 'This is a test blog post created from the admin panel.',
    content: 'This is the content of the test blog post. It contains some sample text to verify that the blog functionality is working correctly.',
    category: 'Test',
    tags: ['test', 'admin'],
    published: true
  });

  const testDatabase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-blog');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to test database', details: error });
    } finally {
      setIsLoading(false);
    }
  };

  const createTestPost = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to create blog post', details: error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Blog Test Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Database Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testDatabase} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Test Database Connection'}
          </Button>
          
          {result && (
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Test Blog Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <Textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>
          
          <Button onClick={createTestPost} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Test Post'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}