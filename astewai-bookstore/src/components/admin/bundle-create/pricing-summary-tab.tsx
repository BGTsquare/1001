'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Database } from '@/types/database'

type BookInsert = Database['public']['Tables']['books']['Insert']

interface NewBookData extends BookInsert {
  tempId: string
}

interface PricingSummaryTabProps {
  newBooks: NewBookData[]
  bundlePrice: string
}

export function PricingSummaryTab({ newBooks, bundlePrice }: PricingSummaryTabProps) {
  const calculateTotalBookPrice = () => {
    return newBooks.reduce((sum, book) => sum + (book.price || 0), 0)
  }

  const calculateSavings = () => {
    const totalBookPrice = calculateTotalBookPrice()
    const bundlePriceNum = parseFloat(bundlePrice) || 0
    return totalBookPrice - bundlePriceNum
  }

  const calculateDiscountPercentage = () => {
    const totalBookPrice = calculateTotalBookPrice()
    const savings = calculateSavings()
    return totalBookPrice > 0 ? (savings / totalBookPrice) * 100 : 0
  }

  return (
    <div className="space-y-4">
      {newBooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium">Total Book Price</div>
                <div className="text-lg">${calculateTotalBookPrice().toFixed(2)}</div>
              </div>
              <div>
                <div className="font-medium">Bundle Price</div>
                <div className="text-lg">${(parseFloat(bundlePrice) || 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="font-medium">Customer Savings</div>
                <div className="text-lg text-green-600">
                  ${calculateSavings().toFixed(2)} ({calculateDiscountPercentage().toFixed(1)}% off)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Books in Bundle</h3>
        {newBooks.map((book, index) => (
          <div key={book.tempId} className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-medium">{book.title || `Book ${index + 1}`}</div>
              <div className="text-sm text-muted-foreground">by {book.author || 'Unknown Author'}</div>
            </div>
            <div className="text-sm font-medium">${(book.price || 0).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}