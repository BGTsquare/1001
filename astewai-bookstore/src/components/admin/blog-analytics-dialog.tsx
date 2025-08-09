'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Heart, 
  Share2, 
  MessageCircle, 
  TrendingUp, 
  Calendar,
  Clock,
  Users
} from 'lucide-react';
import { BlogPost } from '@/lib/repositories/blogRepository';
import { formatDate } from '@/utils/format';

interface BlogAnalyticsDialogProps {
  open: boolean;
  post: BlogPost;
  onClose: () => void;
}

// Mock analytics data - in a real app, this would come from your analytics service
const generateMockAnalytics = (post: BlogPost) => {
  const daysSincePublished = Math.floor(
    (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return {
    views: Math.floor(Math.random() * 1000) + 100,
    uniqueVisitors: Math.floor(Math.random() * 500) + 50,
    likes: Math.floor(Math.random() * 50) + 5,
    shares: Math.floor(Math.random() * 20) + 2,
    comments: Math.floor(Math.random() * 15) + 1,
    avgReadTime: Math.floor(Math.random() * 5) + 2,
    bounceRate: Math.floor(Math.random() * 30) + 20,
    topReferrers: [
      { source: 'Google Search', visits: Math.floor(Math.random() * 200) + 50 },
      { source: 'Direct', visits: Math.floor(Math.random() * 150) + 30 },
      { source: 'Social Media', visits: Math.floor(Math.random() * 100) + 20 },
      { source: 'Email Newsletter', visits: Math.floor(Math.random() * 80) + 15 },
    ],
    dailyViews: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      views: Math.floor(Math.random() * 50) + 10,
    })),
  };
};

export function BlogAnalyticsDialog({ open, post, onClose }: BlogAnalyticsDialogProps) {
  const analytics = generateMockAnalytics(post);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post Analytics</DialogTitle>
          <DialogDescription>
            Performance metrics for "{post.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Post Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {post.excerpt}
                  </CardDescription>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Published {formatDate(post.created_at)}</span>
                    </div>
                    <Badge variant="outline">{post.category}</Badge>
                    <Badge variant={post.published ? "default" : "secondary"}>
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.views.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.uniqueVisitors} unique visitors
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Read Time</CardTitle>
                    <Clock className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.avgReadTime}m</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.bounceRate}% bounce rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                    <Heart className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.likes}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.shares} shares, {analytics.comments} comments
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Performance</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {((analytics.likes + analytics.shares) / analytics.views * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Engagement rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Views Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Views Over Time</CardTitle>
                  <CardDescription>Daily page views for the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.dailyViews.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{day.date}</span>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="bg-primary h-2 rounded"
                            style={{ width: `${(day.views / Math.max(...analytics.dailyViews.map(d => d.views))) * 100}px` }}
                          />
                          <span className="text-sm font-medium w-8 text-right">{day.views}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="text-center">
                    <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <CardTitle>{analytics.likes}</CardTitle>
                    <CardDescription>Likes</CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <Share2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <CardTitle>{analytics.shares}</CardTitle>
                    <CardDescription>Shares</CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <MessageCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <CardTitle>{analytics.comments}</CardTitle>
                    <CardDescription>Comments</CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Insights</CardTitle>
                  <CardDescription>How readers interact with your content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Engagement Rate</span>
                    <span className="font-medium">
                      {((analytics.likes + analytics.shares + analytics.comments) / analytics.views * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Social Shares</span>
                    <span className="font-medium">{analytics.shares}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Comments per View</span>
                    <span className="font-medium">
                      {(analytics.comments / analytics.views * 100).toFixed(3)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="traffic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Traffic Sources</CardTitle>
                  <CardDescription>Where your readers are coming from</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topReferrers.map((referrer, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="text-sm font-medium">{referrer.source}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="bg-muted h-2 rounded"
                            style={{ 
                              width: `${(referrer.visits / Math.max(...analytics.topReferrers.map(r => r.visits))) * 100}px` 
                            }}
                          />
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {referrer.visits}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Organic Traffic</CardTitle>
                    <CardDescription>Search engine visitors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.topReferrers.find(r => r.source === 'Google Search')?.visits || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {((analytics.topReferrers.find(r => r.source === 'Google Search')?.visits || 0) / analytics.views * 100).toFixed(1)}% of total traffic
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Direct Traffic</CardTitle>
                    <CardDescription>Direct visitors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.topReferrers.find(r => r.source === 'Direct')?.visits || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {((analytics.topReferrers.find(r => r.source === 'Direct')?.visits || 0) / analytics.views * 100).toFixed(1)}% of total traffic
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>How your post is performing over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Detailed trend analysis will be available with more data points.</p>
                    <p className="text-sm mt-2">
                      Current performance: {analytics.views} views since publication
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}