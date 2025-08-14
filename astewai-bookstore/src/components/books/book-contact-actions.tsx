import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  PurchaseRequestFormComponent, 
  PurchaseContactModal, 
  QuickContactButtons 
} from '@/components/contact'
import type { Book } from '@/types'

interface BookContactActionsProps {
  book: Book
  onContactInitiated?: (method: string) => void
}

export function BookContactActions({ book, onContactInitiated }: BookContactActionsProps) {
  const handleContactInitiated = (method: string) => {
    console.log(`Contact initiated via ${method} for book ${book.id}`)
    onContactInitiated?.(method)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <PurchaseRequestFormComponent
          item={book}
          itemType="book"
          trigger={
            <Button variant="outline" className="w-full" size="lg">
              <MessageCircle className="h-4 w-4 mr-2" />
              Request Purchase
            </Button>
          }
        />
        
        <PurchaseContactModal
          item={book}
          itemType="book"
          trigger={
            <Button variant="outline" className="w-full" size="lg">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Admin
            </Button>
          }
          onContactInitiated={handleContactInitiated}
        />
      </div>
      
      <QuickContactButtons
        item={book}
        itemType="book"
        onContactInitiated={handleContactInitiated}
        className="border rounded-lg p-3"
      />
    </div>
  )
}