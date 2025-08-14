'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BlogCard } from './blog-card';
import { BlogFilter } from './blog-filter';
import { BlogPost } from '@/lib/repositories/blogRepository';
import { getBlogPosts } from '@/lib/repositories/blogRepository';
import { LoadingSkeletons } from '@/components/ui/loading-skeletons';

interface BlogListProps {
  initialPosts?: BlogPost[];
}

export function BlogList({ initialPosts }: BlogListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['blog-posts', 'all'],
    queryFn: async () => {
      try {
        return await getBlogPosts({ published: true });
      } catch (error) {
        console.error('Error fetching blog posts in BlogList:', error);
        return [];
      }
    },
    initialData: initialPosts,
  });

  // Extract unique categories and tags
  const { categories, tags } = useMemo(() => {
    if (!posts) return { categories: [], tags: [] };

    const categoriesSet = new Set<string>();
    const tagsSet = new Set<string>();

    posts.forEach(post => {
      categoriesSet.add(post.category);
      post.tags?.forEach(tag => tagsSet.add(tag));
    });

    return {
      categories: Array.from(categoriesSet).sort(),
      tags: Array.from(tagsSet).sort(),
    };
  }, [posts]);

  // Filter posts based on selected filters
  const filteredPosts = useMemo(() => {
    if (!posts) return [];

    return posts.filter(post => {
      const matchesCategory = !selectedCategory || post.category === selectedCategory;
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => post.tags?.includes(tag));

      return matchesCategory && matchesTags;
    });
  }, [posts, selectedCategory, selectedTags]);

  const handleClearFilters = () => {
    setSelectedCategory(undefined);
    setSelectedTags([]);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <LoadingSkeletons.Card />
        </div>
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeletons.Card key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Failed to load blog posts</h3>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No blog posts found</h3>
        <p className="text-muted-foreground">Check back later for new content.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1">
        <BlogFilter
          categories={categories}
          tags={tags}
          selectedCategory={selectedCategory}
          selectedTags={selectedTags}
          onCategoryChange={setSelectedCategory}
          onTagsChange={setSelectedTags}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Blog Posts Grid */}
      <div className="lg:col-span-3">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No posts match your filters</h3>
            <p className="text-muted-foreground">Try adjusting your filters to see more posts.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
                {selectedCategory && ` in ${selectedCategory}`}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}