'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BundleInfoTab } from './bundle-info-tab'
import { BundleBooksTab } from './bundle-books-tab'
import { BundlePricingTab } from './bundle-pricing-tab'
import type { BundleFormData, NewBookData } from './types'

interface BundleFormTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  bundleData: BundleFormData
  onBundleUpdate: (updates: Partial<BundleFormData>) => void
  books: NewBookData[]
  onBooksUpdate: (books: NewBookData[]) => void
  categories: string[]
  errors: Record<string, string>
}

export function BundleFormTabs({
  activeTab,
  onTabChange,
  bundleData,
  onBundleUpdate,
  books,
  onBooksUpdate,
  categories,
  errors
}: BundleFormTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="bundle-info">Bundle Info</TabsTrigger>
        <TabsTrigger value="books">Books ({books.length})</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
      </TabsList>

      <TabsContent value="bundle-info">
        <BundleInfoTab
          data={bundleData}
          onUpdate={onBundleUpdate}
          errors={errors}
        />
      </TabsContent>

      <TabsContent value="books">
        <BundleBooksTab
          books={books}
          onUpdate={onBooksUpdate}
          categories={categories}
          errors={errors}
        />
      </TabsContent>

      <TabsContent value="pricing">
        <BundlePricingTab
          bundlePrice={bundleData.price}
          books={books}
          errors={errors}
        />
      </TabsContent>
    </Tabs>
  )
}