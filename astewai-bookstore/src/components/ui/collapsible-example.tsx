import { ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

/**
 * Example usage of the Collapsible component
 * This demonstrates proper implementation patterns
 */
export function CollapsibleExample() {
  return (
    <Collapsible className="w-full space-y-2">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-4 py-2 hover:bg-muted/50">
        <span className="font-semibold">Can I use this in my project?</span>
        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border px-4 py-3 text-sm">
          Yes. Free to use for personal and commercial projects. No attribution
          required.
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}