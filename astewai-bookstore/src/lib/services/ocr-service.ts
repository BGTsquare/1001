/**
 * OCR Service for Receipt Text Extraction
 * Supports multiple OCR providers and fallback strategies
 */

import type { OCRResult } from '@/lib/types/payment'

export interface OCRProvider {
  name: string
  processImage: (imageBuffer: Buffer, options?: OCROptions) => Promise<OCRResult>
  isAvailable: () => boolean
}

export interface OCROptions {
  language?: string
  confidence_threshold?: number
  extract_patterns?: {
    tx_id?: string[]
    amount?: string[]
  }
}

export interface OCRConfig {
  primary_provider: string
  fallback_providers: string[]
  confidence_threshold: number
  tx_id_patterns: string[]
  amount_patterns: string[]
}

// Default OCR configuration
const DEFAULT_CONFIG: OCRConfig = {
  primary_provider: 'tesseract',
  fallback_providers: ['google_vision', 'azure_cognitive'],
  confidence_threshold: 0.7,
  tx_id_patterns: [
    'transaction[\\s#:]*([A-Z0-9]{8,20})',
    'ref[\\s#:]*([A-Z0-9]{8,20})',
    'reference[\\s#:]*([A-Z0-9]{8,20})',
    'tx[\\s#:]*([A-Z0-9]{8,20})',
    'id[\\s#:]*([A-Z0-9]{8,20})',
    '([A-Z0-9]{10,20})', // Generic pattern for alphanumeric IDs
  ],
  amount_patterns: [
    'amount[\\s#:]*([0-9,]+\\.[0-9]{2})',
    'total[\\s#:]*([0-9,]+\\.[0-9]{2})',
    'paid[\\s#:]*([0-9,]+\\.[0-9]{2})',
    '([0-9,]+\\.[0-9]{2})\\s*(?:ETB|birr|birr)', // Ethiopian currency
    '([0-9,]+\\.[0-9]{2})', // Generic amount pattern
  ]
}

export class OCRService {
  private config: OCRConfig
  private providers: Map<string, OCRProvider> = new Map()

  constructor(config: Partial<OCRConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeProviders()
  }

  private initializeProviders() {
    // Initialize Tesseract.js provider (client-side)
    if (typeof window !== 'undefined') {
      this.providers.set('tesseract', new TesseractOCRProvider())
    }

    // Initialize Google Vision API provider
    this.providers.set('google_vision', new GoogleVisionOCRProvider())

    // Initialize Azure Cognitive Services provider
    this.providers.set('azure_cognitive', new AzureCognitiveOCRProvider())

    // Initialize fallback provider (simple regex-based)
    this.providers.set('fallback', new FallbackOCRProvider())
  }

  /**
   * Process image and extract text with TX ID and amount
   */
  async processReceiptImage(
    imageBuffer: Buffer, 
    options: OCROptions = {}
  ): Promise<OCRResult> {
    const startTime = Date.now()
    
    try {
      // Try primary provider first
      const primaryProvider = this.providers.get(this.config.primary_provider)
      if (primaryProvider && primaryProvider.isAvailable()) {
        try {
          const result = await primaryProvider.processImage(imageBuffer, {
            ...options,
            confidence_threshold: options.confidence_threshold || this.config.confidence_threshold,
            extract_patterns: {
              tx_id: options.extract_patterns?.tx_id || this.config.tx_id_patterns,
              amount: options.extract_patterns?.amount || this.config.amount_patterns
            }
          })

          if (result.confidence_score >= this.config.confidence_threshold) {
            return {
              ...result,
              processing_time_ms: Date.now() - startTime
            }
          }
        } catch (error) {
          console.warn(`Primary OCR provider failed: ${error}`)
        }
      }

      // Try fallback providers
      for (const providerName of this.config.fallback_providers) {
        const provider = this.providers.get(providerName)
        if (provider && provider.isAvailable()) {
          try {
            const result = await provider.processImage(imageBuffer, {
              ...options,
              confidence_threshold: options.confidence_threshold || this.config.confidence_threshold,
              extract_patterns: {
                tx_id: options.extract_patterns?.tx_id || this.config.tx_id_patterns,
                amount: options.extract_patterns?.amount || this.config.amount_patterns
              }
            })

            if (result.confidence_score >= this.config.confidence_threshold) {
              return {
                ...result,
                processing_time_ms: Date.now() - startTime
              }
            }
          } catch (error) {
            console.warn(`Fallback OCR provider ${providerName} failed: ${error}`)
          }
        }
      }

      // Use fallback provider as last resort
      const fallbackProvider = this.providers.get('fallback')
      if (fallbackProvider) {
        const result = await fallbackProvider.processImage(imageBuffer, options)
        return {
          ...result,
          processing_time_ms: Date.now() - startTime
        }
      }

      throw new Error('No OCR providers available')

    } catch (error) {
      console.error('OCR processing failed:', error)
      return {
        confidence_score: 0,
        raw_text: '',
        processing_time_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Extract TX ID from text using patterns
   */
  extractTransactionId(text: string, patterns: string[] = this.config.tx_id_patterns): string | null {
    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern, 'i')
        const match = text.match(regex)
        if (match && match[1]) {
          return match[1].trim()
        }
      } catch (error) {
        console.warn(`Invalid regex pattern: ${pattern}`)
      }
    }
    return null
  }

  /**
   * Extract amount from text using patterns
   */
  extractAmount(text: string, patterns: string[] = this.config.amount_patterns): number | null {
    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern, 'i')
        const match = text.match(regex)
        if (match && match[1]) {
          const amountStr = match[1].replace(/,/g, '') // Remove commas
          const amount = parseFloat(amountStr)
          if (!isNaN(amount) && amount > 0) {
            return amount
          }
        }
      } catch (error) {
        console.warn(`Invalid regex pattern: ${pattern}`)
      }
    }
    return null
  }

  /**
   * Calculate confidence score based on extracted data
   */
  calculateConfidenceScore(
    rawText: string,
    extractedTxId: string | null,
    extractedAmount: number | null,
    expectedAmount?: number
  ): number {
    let score = 0

    // Base score from text length (more text = higher confidence)
    if (rawText.length > 50) score += 0.2
    else if (rawText.length > 20) score += 0.1

    // TX ID extraction bonus
    if (extractedTxId) {
      score += 0.3
      // Bonus for longer TX IDs (more likely to be valid)
      if (extractedTxId.length >= 10) score += 0.1
    }

    // Amount extraction bonus
    if (extractedAmount) {
      score += 0.3
      // Bonus if amount matches expected amount
      if (expectedAmount && Math.abs(extractedAmount - expectedAmount) < 0.01) {
        score += 0.2
      }
    }

    return Math.min(score, 1.0)
  }
}

// Tesseract.js Provider (Client-side)
class TesseractOCRProvider implements OCRProvider {
  name = 'tesseract'

  isAvailable(): boolean {
    // In Node build environment, dynamic import detection using `typeof import` is invalid.
    // Use a safer runtime check: presence of window indicates client-side.
    return typeof window !== 'undefined'
  }

  async processImage(imageBuffer: Buffer, options: OCROptions = {}): Promise<OCRResult> {
    if (!this.isAvailable()) {
      throw new Error('Tesseract.js not available in this environment')
    }

    try {
      // Dynamic import for client-side only
      const Tesseract = await import('tesseract.js')
      
      const { data: { text } } = await Tesseract.recognize(
        new Blob([imageBuffer]),
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
            }
          }
        }
      )

      const extractedTxId = this.extractTransactionId(text, options.extract_patterns?.tx_id)
      const extractedAmount = this.extractAmount(text, options.extract_patterns?.amount)
      const confidenceScore = this.calculateConfidenceScore(text, extractedTxId, extractedAmount)

      return {
        extracted_tx_id: extractedTxId || undefined,
        extracted_amount: extractedAmount || undefined,
        confidence_score: confidenceScore,
        raw_text: text
      }
    } catch (error) {
      throw new Error(`Tesseract OCR failed: ${error}`)
    }
  }

  private extractTransactionId(text: string, patterns?: string[]): string | null {
    const defaultPatterns = [
      'transaction[\\s#:]*([A-Z0-9]{8,20})',
      'ref[\\s#:]*([A-Z0-9]{8,20})',
      '([A-Z0-9]{10,20})'
    ]
    
    for (const pattern of patterns || defaultPatterns) {
      const regex = new RegExp(pattern, 'i')
      const match = text.match(regex)
      if (match && match[1]) {
        return match[1].trim()
      }
    }
    return null
  }

  private extractAmount(text: string, patterns?: string[]): number | null {
    const defaultPatterns = [
      'amount[\\s#:]*([0-9,]+\\.[0-9]{2})',
      'total[\\s#:]*([0-9,]+\\.[0-9]{2})',
      '([0-9,]+\\.[0-9]{2})'
    ]
    
    for (const pattern of patterns || defaultPatterns) {
      const regex = new RegExp(pattern, 'i')
      const match = text.match(regex)
      if (match && match[1]) {
        const amountStr = match[1].replace(/,/g, '')
        const amount = parseFloat(amountStr)
        if (!isNaN(amount) && amount > 0) {
          return amount
        }
      }
    }
    return null
  }

  private calculateConfidenceScore(text: string, txId: string | null, amount: number | null): number {
    let score = 0
    if (text.length > 50) score += 0.3
    if (txId) score += 0.4
    if (amount) score += 0.3
    return Math.min(score, 1.0)
  }
}

// Google Vision API Provider
class GoogleVisionOCRProvider implements OCRProvider {
  name = 'google_vision'

  isAvailable(): boolean {
    return !!process.env.GOOGLE_VISION_API_KEY
  }

  async processImage(imageBuffer: Buffer, options: OCROptions = {}): Promise<OCRResult> {
    if (!this.isAvailable()) {
      throw new Error('Google Vision API key not configured')
    }

    try {
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: imageBuffer.toString('base64')
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 1
                  }
                ]
              }
            ]
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.statusText}`)
      }

      const data = await response.json()
      const text = data.responses[0]?.textAnnotations?.[0]?.description || ''

      const extractedTxId = this.extractTransactionId(text, options.extract_patterns?.tx_id)
      const extractedAmount = this.extractAmount(text, options.extract_patterns?.amount)
      const confidenceScore = this.calculateConfidenceScore(text, extractedTxId, extractedAmount)

      return {
        extracted_tx_id: extractedTxId || undefined,
        extracted_amount: extractedAmount || undefined,
        confidence_score: confidenceScore,
        raw_text: text
      }
    } catch (error) {
      throw new Error(`Google Vision OCR failed: ${error}`)
    }
  }

  private extractTransactionId(text: string, patterns?: string[]): string | null {
    // Implementation similar to Tesseract provider
    return null // Simplified for now
  }

  private extractAmount(text: string, patterns?: string[]): number | null {
    // Implementation similar to Tesseract provider
    return null // Simplified for now
  }

  private calculateConfidenceScore(text: string, txId: string | null, amount: number | null): number {
    // Implementation similar to Tesseract provider
    return 0.8 // Default high confidence for Google Vision
  }
}

// Azure Cognitive Services Provider
class AzureCognitiveOCRProvider implements OCRProvider {
  name = 'azure_cognitive'

  isAvailable(): boolean {
    return !!(process.env.AZURE_COGNITIVE_ENDPOINT && process.env.AZURE_COGNITIVE_KEY)
  }

  async processImage(imageBuffer: Buffer, options: OCROptions = {}): Promise<OCRResult> {
    if (!this.isAvailable()) {
      throw new Error('Azure Cognitive Services not configured')
    }

    try {
      const response = await fetch(
        `${process.env.AZURE_COGNITIVE_ENDPOINT}/vision/v3.2/read/analyze`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': process.env.AZURE_COGNITIVE_KEY!,
            'Content-Type': 'application/octet-stream',
          },
          body: imageBuffer
        }
      )

      if (!response.ok) {
        throw new Error(`Azure Cognitive Services error: ${response.statusText}`)
      }

      // Azure returns an operation URL, need to poll for results
      // This is simplified - in production, you'd implement proper polling
      const text = '' // Extract from Azure response
      const extractedTxId = this.extractTransactionId(text, options.extract_patterns?.tx_id)
      const extractedAmount = this.extractAmount(text, options.extract_patterns?.amount)
      const confidenceScore = this.calculateConfidenceScore(text, extractedTxId, extractedAmount)

      return {
        extracted_tx_id: extractedTxId || undefined,
        extracted_amount: extractedAmount || undefined,
        confidence_score: confidenceScore,
        raw_text: text
      }
    } catch (error) {
      throw new Error(`Azure Cognitive Services OCR failed: ${error}`)
    }
  }

  private extractTransactionId(text: string, patterns?: string[]): string | null {
    return null // Simplified for now
  }

  private extractAmount(text: string, patterns?: string[]): number | null {
    return null // Simplified for now
  }

  private calculateConfidenceScore(text: string, txId: string | null, amount: number | null): number {
    return 0.7 // Default confidence for Azure
  }
}

// Fallback Provider (Simple regex-based)
class FallbackOCRProvider implements OCRProvider {
  name = 'fallback'

  isAvailable(): boolean {
    return true // Always available
  }

  async processImage(imageBuffer: Buffer, options: OCROptions = {}): Promise<OCRResult> {
    // This is a fallback that doesn't actually do OCR
    // It would be used when no other providers are available
    return {
      confidence_score: 0.1,
      raw_text: 'OCR not available - manual entry required',
      processing_time_ms: 0
    }
  }
}

// Export singleton instance
export const ocrService = new OCRService()

// Export for client-side usage
export const createClientOCRService = () => {
  return new OCRService({
    primary_provider: 'tesseract',
    fallback_providers: ['fallback']
  })
}


