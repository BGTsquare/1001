'use client'

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

const BUNDLE_CATEGORIES = [
  'All Bundles',
  'Fiction',
  'Non-Fiction',
  'Science Fiction',
  'Mystery',
  'Romance',
  'Business',
  'Self-Help',
] as const;

type BundleCategory = typeof BUNDLE_CATEGORIES[number];

interface BundleCategoryFilterProps {
  onCategoryChange?: (category: BundleCategory) => void;
  initialCategory?: BundleCategory;
}

export function BundleCategoryFilter({ 
  onCategoryChange,
  initialCategory = 'All Bundles' 
}: BundleCategoryFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<BundleCategory>(initialCategory);

  const handleCategoryClick = (category: BundleCategory) => {
    setSelectedCategory(category);
    onCategoryChange?.(category);
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
      <div className="flex flex-wrap gap-2">
        {BUNDLE_CATEGORIES.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className="cursor-pointer transition-colors hover:bg-primary/80"
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </Badge>
        ))}
      </div>
    </div>
  );
}