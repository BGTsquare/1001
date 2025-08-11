import { useCallback } from 'react'
import type { NewBookData } from '../types'

export function useBookManagement(
  books: NewBookData[],
  updateBook: (tempId: string, updates: Partial<NewBookData>) => void
) {
  const handleFileSelect = useCallback((tempId: string, type: 'cover' | 'content', file: File) => {
    updateBook(tempId, {
      [type === 'cover' ? 'coverImage' : 'contentFile']: {
        file,
        uploading: false,
        progress: 0,
        error: undefined
      }
    })
  }, [updateBook])

  const addTag = useCallback((tempId: string, tag: string) => {
    const book = books.find(b => b.tempId === tempId)
    if (book && tag.trim() && !book.tags?.includes(tag.trim())) {
      updateBook(tempId, {
        tags: [...(book.tags || []), tag.trim()]
      })
    }
  }, [books, updateBook])

  const removeTag = useCallback((tempId: string, tagToRemove: string) => {
    const book = books.find(b => b.tempId === tempId)
    if (book) {
      updateBook(tempId, {
        tags: book.tags?.filter(tag => tag !== tagToRemove) || []
      })
    }
  }, [books, updateBook])

  const uploadBookFile = useCallback(async (
    tempId: string, 
    type: 'cover' | 'content',
    uploadFn: (file: File, type: 'cover' | 'content') => Promise<string>
  ) => {
    const book = books.find(b => b.tempId === tempId)
    if (!book) return

    const fileState = type === 'cover' ? book.coverImage : book.contentFile
    if (!fileState.file) return

    updateBook(tempId, {
      [type === 'cover' ? 'coverImage' : 'contentFile']: {
        ...fileState,
        uploading: true,
        progress: 0
      }
    })

    try {
      const url = await uploadFn(fileState.file, type)
      
      updateBook(tempId, {
        [type === 'cover' ? 'coverImage' : 'contentFile']: {
          ...fileState,
          uploading: false,
          progress: 100,
          url,
          error: undefined
        },
        [type === 'cover' ? 'cover_image_url' : 'content_url']: url
      })
    } catch (error) {
      console.error('Upload error:', error)
      updateBook(tempId, {
        [type === 'cover' ? 'coverImage' : 'contentFile']: {
          ...fileState,
          uploading: false,
          progress: 0,
          error: 'Upload failed. Please try again.'
        }
      })
    }
  }, [books, updateBook])

  return {
    handleFileSelect,
    addTag,
    removeTag,
    uploadBookFile
  }
}