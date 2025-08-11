import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { Database } from '@/types/database'

type BookInsert = Database['public']['Tables']['books']['Insert']

interface FileUploadState {
    file: File | null
    uploading: boolean
    progress: number
    url?: string
    error?: string
}

interface NewBookData extends BookInsert {
    tempId: string
    coverImage: FileUploadState
    contentFile: FileUploadState
}

interface BundleCoverState {
    file: File | null
    uploading: boolean
    progress: number
    url?: string
    error?: string
}

interface BundleFormData {
    title: string
    description: string
    price: string
    cover: BundleCoverState
    books: NewBookData[]
}

export function useBundleCreation() {
    const [formData, setFormData] = useState<BundleFormData>({
        title: '',
        description: '',
        price: '',
        cover: { file: null, uploading: false, progress: 0 },
        books: []
    })
    
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Create bundle mutation
    const createMutation = useMutation({
        mutationFn: async (bundleData: {
            title: string
            description: string
            price: number
            cover_image_url?: string
            books: Omit<BookInsert, 'id'>[]
        }) => {
            const response = await fetch('/api/admin/bundles/create-with-books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bundleData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create bundle')
            }

            return response.json()
        },
        onError: (error: Error) => {
            setErrors({ general: error.message })
        }
    })

    const resetForm = useCallback(() => {
        setFormData({
            title: '',
            description: '',
            price: '',
            cover: { file: null, uploading: false, progress: 0 },
            books: []
        })
        setErrors({})
    }, [])

    const updateBundleInfo = useCallback((updates: Partial<Pick<BundleFormData, 'title' | 'description' | 'price'>>) => {
        setFormData(prev => ({ ...prev, ...updates }))
    }, [])

    const updateBundleCover = useCallback((cover: BundleCoverState) => {
        setFormData(prev => ({ ...prev, cover }))
    }, [])

    const addBook = useCallback(() => {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newBook: NewBookData = {
            tempId,
            title: '',
            author: '',
            description: '',
            category: '',
            price: 0,
            is_free: true,
            tags: [],
            cover_image_url: '',
            content_url: '',
            coverImage: { file: null, uploading: false, progress: 0 },
            contentFile: { file: null, uploading: false, progress: 0 }
        }
        setFormData(prev => ({ ...prev, books: [...prev.books, newBook] }))
    }, [])

    const removeBook = useCallback((tempId: string) => {
        setFormData(prev => ({ 
            ...prev, 
            books: prev.books.filter(book => book.tempId !== tempId) 
        }))
    }, [])

    const updateBook = useCallback((tempId: string, updates: Partial<NewBookData>) => {
        setFormData(prev => ({
            ...prev,
            books: prev.books.map(book => 
                book.tempId === tempId ? { ...book, ...updates } : book
            )
        }))
    }, [])

    // Validation
    const validateForm = useCallback(() => {
        const newErrors: Record<string, string> = {}

        if (!formData.title.trim()) {
            newErrors.bundleTitle = 'Bundle title is required'
        }

        if (!formData.price || parseFloat(formData.price) <= 0) {
            newErrors.bundlePrice = 'Valid bundle price is required'
        }

        if (formData.books.length === 0) {
            newErrors.books = 'At least one book must be added to the bundle'
        }

        // Validate each book
        formData.books.forEach((book, index) => {
            if (!book.title?.trim()) {
                newErrors[`book-${index}-title`] = `Book ${index + 1} title is required`
            }
            if (!book.author?.trim()) {
                newErrors[`book-${index}-author`] = `Book ${index + 1} author is required`
            }
            if (!book.cover_image_url && !book.coverImage.url) {
                newErrors[`book-${index}-cover`] = `Book ${index + 1} cover image is required`
            }
            if (!book.content_url && !book.contentFile.url) {
                newErrors[`book-${index}-content`] = `Book ${index + 1} content file is required`
            }
        })

        const bundlePriceNum = parseFloat(formData.price) || 0
        const totalBookPrice = formData.books.reduce((sum, book) => sum + (book.price || 0), 0)

        if (bundlePriceNum > totalBookPrice) {
            newErrors.bundlePrice = 'Bundle price cannot exceed total book prices'
        }

        // Validate minimum discount requirement
        if (totalBookPrice > 0 && bundlePriceNum > totalBookPrice * 0.99) {
            newErrors.bundlePrice = 'Bundle must provide at least a 1% discount'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }, [formData])

    // Pricing calculations
    const calculateTotalBookPrice = useCallback(() => {
        return formData.books.reduce((sum, book) => sum + (book.price || 0), 0)
    }, [formData.books])

    const calculateSavings = useCallback(() => {
        const totalBookPrice = calculateTotalBookPrice()
        const bundlePriceNum = parseFloat(formData.price) || 0
        return totalBookPrice - bundlePriceNum
    }, [formData.price, calculateTotalBookPrice])

    const calculateDiscountPercentage = useCallback(() => {
        const totalBookPrice = calculateTotalBookPrice()
        const savings = calculateSavings()
        return totalBookPrice > 0 ? (savings / totalBookPrice) * 100 : 0
    }, [calculateTotalBookPrice, calculateSavings])

    return {
        formData,
        errors,
        createMutation,
        resetForm,
        updateBundleInfo,
        updateBundleCover,
        addBook,
        removeBook,
        updateBook,
        validateForm,
        calculateTotalBookPrice,
        calculateSavings,
        calculateDiscountPercentage
    }
}