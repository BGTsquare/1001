import { z } from 'zod'
import { BOOK_CATEGORIES, MINIMUM_DISCOUNT_PERCENTAGE } from '../types'

export const fileUploadSchema = z.object({
  file: z.instanceof(File).nullable(),
  uploading: z.boolean(),
  progress: z.number().min(0).max(100),
  url: z.string().url().optional(),
  error: z.string().optional()
})

export const bookSchema = z.object({
  tempId: z.string(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  author: z.string().min(1, 'Author is required').max(100, 'Author name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.enum(BOOK_CATEGORIES as any).optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  is_free: z.boolean(),
  tags: z.array(z.string()).optional(),
  cover_image_url: z.string().url().optional(),
  content_url: z.string().url().optional(),
  coverImage: fileUploadSchema,
  contentFile: fileUploadSchema
}).refine(
  (data) => data.cover_image_url || data.coverImage.url,
  { message: 'Cover image is required', path: ['cover_image_url'] }
).refine(
  (data) => data.content_url || data.contentFile.url,
  { message: 'Content file is required', path: ['content_url'] }
)

export const bundleFormSchema = z.object({
  title: z.string().min(1, 'Bundle title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  price: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: 'Valid bundle price is required' }
  ),
  cover: fileUploadSchema,
  books: z.array(bookSchema).min(1, 'At least one book must be added')
}).refine((data) => {
  const bundlePrice = parseFloat(data.price)
  const totalBookPrice = data.books.reduce((sum, book) => sum + book.price, 0)
  
  return bundlePrice <= totalBookPrice
}, {
  message: 'Bundle price cannot exceed total book prices',
  path: ['price']
}).refine((data) => {
  const bundlePrice = parseFloat(data.price)
  const totalBookPrice = data.books.reduce((sum, book) => sum + book.price, 0)
  
  if (totalBookPrice === 0) return true
  
  return bundlePrice <= totalBookPrice * (1 - MINIMUM_DISCOUNT_PERCENTAGE)
}, {
  message: `Bundle must provide at least ${MINIMUM_DISCOUNT_PERCENTAGE * 100}% discount`,
  path: ['price']
})

export type BundleFormSchema = z.infer<typeof bundleFormSchema>
export type BookSchema = z.infer<typeof bookSchema>