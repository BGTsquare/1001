import { NextRequest, NextResponse } from 'next/server'
import { bookService } from '@/lib/services/book-service'

// Add caching headers for better performance
const CACHE_DURATION = 60 * 60 // 1 hour in seconds

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    // Validate UUID format early to avoid unnecessary DB calls
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid book ID format' },
        { status: 400 }
      )
    }

    // Get the book to verify it exists
    const bookResult = await bookService.getBookById(id)
    
    if (!bookResult.success || !bookResult.data) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    const book = bookResult.data

    // Check if book has content URL
    if (!book.content_url) {
      return NextResponse.json(
        { error: 'Preview not available for this book' },
        { status: 404 }
      )
    }

    // In a real implementation, you would:
    // 1. Fetch the actual book content from the content_url
    // 2. Extract a preview portion (first few pages/chapters)
    // 3. Return the formatted preview content
    
    // For now, we'll return a mock preview
    const previewContent = generatePreviewContent(book)

    const response = NextResponse.json({
      title: book.title,
      content: previewContent,
      totalPages: 250, // This would come from the actual book file
      previewPages: 25, // This would be calculated based on preview length
    })

    // Add caching headers
    response.headers.set('Cache-Control', `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=86400`)
    response.headers.set('CDN-Cache-Control', `public, s-maxage=${CACHE_DURATION}`)
    
    return response

  } catch (error) {
    console.error('Error fetching book preview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface BookPreviewData {
    title: string
    author: string
    description?: string
}

function generatePreviewContent(book: BookPreviewData): string {
  return `# ${book.title}
*by ${book.author}*

---

## Table of Contents

1. Introduction
2. Getting Started
3. Core Concepts
4. Advanced Topics
5. Practical Applications
6. Conclusion

---

## Chapter 1: Introduction

Welcome to "${book.title}" - a comprehensive guide that will take you on an enlightening journey through the subject matter. This book has been carefully crafted to provide both beginners and experienced readers with valuable insights and practical knowledge.

${book.description || 'In this opening chapter, we lay the foundation for everything that follows. You\'ll discover the key principles and concepts that form the backbone of this subject.'}

### What You'll Learn

Throughout this book, you'll gain a deep understanding of:

- Fundamental concepts and principles
- Practical applications and real-world examples
- Advanced techniques and best practices
- Common pitfalls and how to avoid them
- Future trends and developments

### How to Use This Book

This book is structured to build your knowledge progressively. Each chapter builds upon the previous one, so we recommend reading it in order, especially if you're new to the subject.

---

## Chapter 2: Getting Started

Now that we've established the foundation, let's dive into the practical aspects. This chapter will guide you through the initial steps and help you get up and running quickly.

### Prerequisites

Before we begin, make sure you have:
- A basic understanding of the subject area
- Access to the necessary tools and resources
- A willingness to learn and experiment

### Your First Steps

Let's start with a simple example that demonstrates the core concepts in action...

---

*This preview contains approximately 10% of the full book content. The complete version includes detailed explanations, comprehensive examples, exercises, and much more valuable content.*

## What's in the Full Book

The complete book contains:

- **250+ pages** of comprehensive content
- **50+ practical examples** with step-by-step explanations
- **Interactive exercises** to reinforce your learning
- **Case studies** from real-world applications
- **Resource appendix** with additional references
- **Bonus chapters** on advanced topics

---

*Purchase the full book to access all content and continue your learning journey!*`
}