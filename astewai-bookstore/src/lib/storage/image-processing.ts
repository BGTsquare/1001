import { ImageOptimizationOptions } from './types'

/**
 * Optimizes an image file by resizing and compressing
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'webp'
  } = options

  // Skip optimization for non-image files
  if (!file.type.startsWith('image/')) {
    return file
  }

  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')

    const img = await loadImage(file)
    
    // Calculate new dimensions while maintaining aspect ratio
    const { width: newWidth, height: newHeight } = calculateDimensions(
      img.width,
      img.height,
      maxWidth,
      maxHeight
    )

    // Set canvas dimensions
    canvas.width = newWidth
    canvas.height = newHeight

    // Draw and compress image
    ctx.drawImage(img, 0, 0, newWidth, newHeight)

    // Convert to blob with specified format and quality
    const blob = await canvasToBlob(canvas, format, quality)
    
    // Create new file with optimized content
    const optimizedFile = new File(
      [blob],
      file.name.replace(/\.[^/.]+$/, `.${format}`),
      { type: `image/${format}` }
    )

    return optimizedFile
  } catch (error) {
    console.warn('Image optimization failed, returning original file:', error)
    return file
  }
}

/**
 * Creates a thumbnail from an image file
 */
export async function createThumbnail(
  file: File,
  size: number = 200
): Promise<File | null> {
  if (!file.type.startsWith('image/')) {
    return null
  }

  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')

    const img = await loadImage(file)
    
    // Calculate square thumbnail dimensions
    const minDimension = Math.min(img.width, img.height)
    const scale = size / minDimension
    
    canvas.width = size
    canvas.height = size

    // Calculate crop area for center crop
    const cropX = (img.width - minDimension) / 2
    const cropY = (img.height - minDimension) / 2

    // Draw cropped and scaled image
    ctx.drawImage(
      img,
      cropX, cropY, minDimension, minDimension,
      0, 0, size, size
    )

    const blob = await canvasToBlob(canvas, 'webp', 0.8)
    
    const thumbnailFile = new File(
      [blob],
      `thumb_${file.name.replace(/\.[^/.]+$/, '.webp')}`,
      { type: 'image/webp' }
    )

    return thumbnailFile
  } catch (error) {
    console.warn('Thumbnail creation failed:', error)
    return null
  }
}

/**
 * Loads an image file into an Image element
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

/**
 * Converts canvas to blob with specified format and quality
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to convert canvas to blob'))
        }
      },
      `image/${format}`,
      quality
    )
  })
}

/**
 * Calculates new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight }

  // If image is smaller than max dimensions, return original size
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height }
  }

  // Calculate scaling factor
  const widthRatio = maxWidth / width
  const heightRatio = maxHeight / height
  const ratio = Math.min(widthRatio, heightRatio)

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  }
}

/**
 * Gets image metadata including dimensions and file info
 */
export async function getImageMetadata(file: File): Promise<{
  width: number
  height: number
  size: number
  type: string
  name: string
}> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image')
  }

  const img = await loadImage(file)
  
  return {
    width: img.width,
    height: img.height,
    size: file.size,
    type: file.type,
    name: file.name
  }
}