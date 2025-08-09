'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlogPost } from '@/lib/repositories/blogRepository';
import { formatDate, formatRelativeTime } from '@/utils/format';
import { Calendar, Clock } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
  showRelativeTime?: boolean;
  maxTags?: number;
  className?: string;
}

export function BlogCard({ 
  post, 
  showRelativeTime = false, 
  maxTags = 3,
  className = '' 
}: BlogCardProps) {
  const displayDate = showRelativeTime 
    ? formatRelativeTime(post.created_at)
    : formatDate(post.created_at);

  const visibleTags = post.tags?.slice(0, maxTags) || [];
  const remainingTagsCount = (post.tags?.length || 0) - maxTags;

  return (
    <article className={className}>
      <Link 
        href={`/blog/${post.id}`}
        className="block h-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
        aria-label={`Read blog post: ${post.title}`}
      >
        <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-3">
              <Badge 
                variant="secondary" 
                className="text-xs font-medium"
                aria-label={`Category: ${post.category}`}
              >
                {post.category}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {showRelativeTime ? (
                  <Clock className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                )}
                <time 
                  dateTime={post.created_at}
                  className="tabular-nums"
                >
                  {displayDate}
                </time>
              </div>
            </div>
            
            <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
              {post.title}
            </CardTitle>
            
            {post.excerpt && (
              <CardDescription className="line-clamp-3 text-sm leading-relaxed">
                {post.excerpt}
              </CardDescription>
            )}
          </CardHeader>
          
          {visibleTags.length > 0 && (
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1" role="list" aria-label="Post tags">
                {visibleTags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className="text-xs hover:bg-secondary/80 transition-colors"
                    role="listitem"
                  >
                    {tag}
                  </Badge>
                ))}
                {remainingTagsCount > 0 && (
                  <Badge 
                    variant="outline" 
                    className="text-xs text-muted-foreground"
                    aria-label={`${remainingTagsCount} more tags`}
                  >
                    +{remainingTagsCount}
                  </Badge>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </Link>
    </article>
  );
}