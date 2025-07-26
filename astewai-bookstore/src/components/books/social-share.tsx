'use client'

import { useState } from 'react'
import { X, Copy, Check, Facebook, Twitter, Linkedin, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Book } from '@/types'
import { toast } from 'sonner'

interface SocialShareProps {
  book: Book
  isOpen: boolean
  onClose: () => void
}

export function SocialShare({ book, isOpen, onClose }: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const bookUrl = `${window.location.origin}/books/${book.id}`
  const shareText = `Check out "${book.title}" by ${book.author} on Astewai Digital Bookstore`
  const encodedText = encodeURIComponent(shareText)
  const encodedUrl = encodeURIComponent(bookUrl)

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodeURIComponent(book.title)}&body=${encodedText}%0A%0A${encodedUrl}`
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookUrl)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy link')
    }
  }

  const handleSocialShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Share Book</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Book Info */}
          <div className="text-center">
            <h3 className="font-semibold text-lg">{book.title}</h3>
            <p className="text-muted-foreground">by {book.author}</p>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share Link</label>
            <div className="flex gap-2">
              <Input
                value={bookUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="px-3"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Social Media Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share on Social Media</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleSocialShare('twitter')}
                className="flex items-center gap-2"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialShare('facebook')}
                className="flex items-center gap-2"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialShare('linkedin')}
                className="flex items-center gap-2"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialShare('email')}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}