'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BlogPost as BlogPostType } from '@/lib/repositories/blogRepository';
import { formatDate } from '@/utils/format';
import { ArrowLeft, Share2, Calendar, User, Tag } from 'lucide-react';

interface BlogPostProps {
  post: BlogPostType;
  relatedPosts?: BlogPostType[];
}

export function BlogPost({ post, relatedPosts = [] }: BlogPostProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>
      </div>

      {/* Article Header */}
      <article className="mb-8">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">{post.category}</Badge>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-1 h-3 w-3" />
              <time dateTime={post.created_at}>
                {formatDate(post.created_at)}
              </time>
            </div>
            {post.author_id && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="mr-1 h-3 w-3" />
                  <span>By {post.author_id}</span>
                </div>
              </>
            )}
          </div>

          <h1 className="text-4xl font-bold mb-4 leading-tight">{post.title}</h1>
          
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Tags and Share */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              {post.tags && post.tags.length > 0 && (
                <>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              disabled={isSharing}
            >
              <Share2 className="mr-2 h-4 w-4" />
              {isSharing ? 'Sharing...' : 'Share'}
            </Button>
          </div>
        </header>

        <Separator className="mb-8" />

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          {/* For now, we'll display the content as plain text */}
          {/* In a real implementation, you'd want to render markdown or rich text */}
          <div className="whitespace-pre-wrap leading-relaxed">
            {post.content}
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-12">
          <Separator className="mb-8" />
          <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.slice(0, 3).map((relatedPost) => (
              <Link key={relatedPost.id} href={`/blog/${relatedPost.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {relatedPost.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(relatedPost.created_at)}
                      </span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">
                      {relatedPost.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {relatedPost.excerpt}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}