import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bookService } from '@/lib/services/book-service'
import { libraryService } from '@/lib/services/library-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    const { id } = await paramsconst supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get book details
    const bookResult = await bookService.getBookById(id)
    
    if (!bookResult.success || !bookResult.data) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    const book = bookResult.data

    // Check if user owns the book or if it's free
    if (!book.is_free) {
      const ownershipResult = await libraryService.checkBookOwnership(user.id, id)
      
      if (!ownershipResult.success || !ownershipResult.data?.owned) {
        return NextResponse.json(
          { error: 'You do not own this book' },
          { status: 403 }
        )
      }
    }

    // Generate book content (in a real app, this would come from storage)
    const content = generateBookContent(book)

    return NextResponse.json({
      success: true,
      content,
      book: {
        id: book.id,
        title: book.title,
        author: book.author
      }
    })

  } catch (error) {
    console.error('Error fetching book content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Generate sample book content (in production, this would fetch from storage)
function generateBookContent(book: any): string {
  return `
    <div class="book-content">
      <header class="book-header mb-8">
        <h1 class="text-3xl font-bold mb-2">${book.title}</h1>
        <p class="text-xl text-muted-foreground mb-4">by ${book.author}</p>
        <hr class="border-t-2 border-primary/20" />
      </header>

      <div class="book-body space-y-6">
        <section class="chapter">
          <h2 class="text-2xl font-semibold mb-4">Chapter 1: Introduction</h2>
          <p class="mb-4">
            Welcome to "${book.title}" - a comprehensive guide that will take you on an enlightening journey through the subject matter. This book has been carefully crafted to provide both beginners and experienced readers with valuable insights and practical knowledge.
          </p>
          <p class="mb-4">
            ${book.description || 'In this opening chapter, we lay the foundation for everything that follows. You\'ll discover the key principles and concepts that form the backbone of this subject.'}
          </p>
          <p class="mb-4">
            Throughout this book, you'll encounter various examples, case studies, and practical exercises designed to reinforce your understanding and help you apply what you've learned in real-world scenarios.
          </p>
          <p class="mb-4">
            The journey ahead is both challenging and rewarding. Each chapter builds upon the previous one, creating a comprehensive learning experience that will transform your understanding of the subject.
          </p>
        </section>

        <section class="chapter">
          <h2 class="text-2xl font-semibold mb-4">Chapter 2: Fundamentals</h2>
          <p class="mb-4">
            Before diving into the more complex aspects of our subject, it's essential to establish a solid foundation. This chapter covers the fundamental concepts that every reader should understand.
          </p>
          <p class="mb-4">
            The principles we'll explore here are not just theoretical constructs but practical tools that you can immediately begin applying in your own work and studies.
          </p>
          <blockquote class="border-l-4 border-primary pl-4 italic my-6">
            "Understanding the fundamentals is like building a house - without a strong foundation, everything else becomes unstable."
          </blockquote>
          <p class="mb-4">
            As we progress through this chapter, you'll notice how each concept connects to the others, forming an interconnected web of knowledge that supports deeper understanding.
          </p>
          <p class="mb-4">
            Take your time with this material. The concepts presented here will serve as reference points throughout the rest of the book, so it's important to grasp them thoroughly.
          </p>
        </section>

        <section class="chapter">
          <h2 class="text-2xl font-semibold mb-4">Chapter 3: Advanced Concepts</h2>
          <p class="mb-4">
            Now that we've established the fundamentals, we can explore more sophisticated ideas and techniques. This chapter represents a significant step forward in complexity and depth.
          </p>
          <p class="mb-4">
            The advanced concepts we'll cover here are where theory meets practice in the most meaningful ways. You'll see how the principles from earlier chapters combine to create powerful solutions and insights.
          </p>
          <p class="mb-4">
            Don't be discouraged if some of these ideas seem challenging at first. Advanced concepts often require time to fully understand and internalize. The key is to remain patient and persistent.
          </p>
          <p class="mb-4">
            Each section in this chapter includes practical examples and exercises that will help you apply these advanced concepts in real-world situations.
          </p>
        </section>

        <section class="chapter">
          <h2 class="text-2xl font-semibold mb-4">Chapter 4: Practical Applications</h2>
          <p class="mb-4">
            Theory without application is merely academic exercise. In this chapter, we bridge the gap between understanding and doing, showing you how to put your knowledge to work.
          </p>
          <p class="mb-4">
            The practical applications we'll explore are drawn from real-world scenarios and case studies. These examples demonstrate how the concepts you've learned can be applied effectively in various contexts.
          </p>
          <p class="mb-4">
            As you work through the examples in this chapter, you'll develop the confidence and skills needed to tackle similar challenges in your own projects and endeavors.
          </p>
          <p class="mb-4">
            Remember that mastery comes through practice. The more you apply these concepts, the more natural and intuitive they will become.
          </p>
        </section>

        <section class="chapter">
          <h2 class="text-2xl font-semibold mb-4">Chapter 5: Looking Forward</h2>
          <p class="mb-4">
            As we near the end of our journey together, it's important to consider what comes next. This final chapter focuses on how you can continue to grow and develop your understanding beyond this book.
          </p>
          <p class="mb-4">
            The field is constantly evolving, with new developments and discoveries emerging regularly. Staying current with these changes is essential for continued growth and success.
          </p>
          <p class="mb-4">
            We'll explore resources for further learning, communities you can join, and ways to stay engaged with the latest developments in the field.
          </p>
          <p class="mb-4">
            Your learning journey doesn't end with the last page of this book - it's just the beginning of a lifelong adventure in discovery and growth.
          </p>
        </section>

        <section class="conclusion">
          <h2 class="text-2xl font-semibold mb-4">Conclusion</h2>
          <p class="mb-4">
            Congratulations on completing "${book.title}"! You've covered a lot of ground and should feel proud of your accomplishment.
          </p>
          <p class="mb-4">
            The knowledge and skills you've gained through this book will serve you well in your future endeavors. Remember to refer back to these concepts whenever you need guidance or inspiration.
          </p>
          <p class="mb-4">
            Thank you for joining me on this journey. I hope this book has been both informative and inspiring, and that it serves as a valuable resource for years to come.
          </p>
          <p class="mb-4">
            Keep learning, keep growing, and keep pushing the boundaries of what's possible.
          </p>
          <p class="text-center font-semibold mt-8">
            - ${book.author}
          </p>
        </section>
      </div>
    </div>
  `
}