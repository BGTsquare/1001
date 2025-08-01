'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

type LibraryTab = 'all' | 'in-progress' | 'completed'

interface LibraryTabsProps {
  activeTab: LibraryTab
  onTabChange: (tab: LibraryTab) => void
  children: React.ReactNode
  className?: string
  stats?: {
    total: number
    inProgress: number
    completed: number
  }
}

export function LibraryTabs({
  activeTab,
  onTabChange,
  children,
  className,
  stats
}: LibraryTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as LibraryTab)}
      className={cn('w-full', className)}
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="all" className="flex items-center gap-2">
          All Books
          {stats && (
            <span className="ml-1 rounded-full bg-muted-foreground/20 px-2 py-0.5 text-xs">
              {stats.total}
            </span>
          )}
        </TabsTrigger>
        
        <TabsTrigger value="in-progress" className="flex items-center gap-2">
          In Progress
          {stats && (
            <span className="ml-1 rounded-full bg-muted-foreground/20 px-2 py-0.5 text-xs">
              {stats.inProgress}
            </span>
          )}
        </TabsTrigger>
        
        <TabsTrigger value="completed" className="flex items-center gap-2">
          Completed
          {stats && (
            <span className="ml-1 rounded-full bg-muted-foreground/20 px-2 py-0.5 text-xs">
              {stats.completed}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-6">
        {children}
      </TabsContent>
      
      <TabsContent value="in-progress" className="mt-6">
        {children}
      </TabsContent>
      
      <TabsContent value="completed" className="mt-6">
        {children}
      </TabsContent>
    </Tabs>
  )
}