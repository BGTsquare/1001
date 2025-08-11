'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
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

interface BundleFormState {
  bundleTitle: string
  bundleDescription: string
  bundlePrice: string
  bundleCover: BundleCoverState
  newBooks: NewBookData[]
  errors: Record<string, string>
  activeTab: string
}

interface BundleFormContextType extends BundleFormState {
  setBundleTitle: (title: string) => void
  setBundleDescription: (description: string) => void
  setBundlePrice: (price: string) => void
  setBundleCover: (cover: BundleCoverState) => void
  setNewBooks: (books: NewBookData[] | ((prev: NewBookData[]) => NewBookData[])) => void
  setErrors: (errors: Record<string, string>) => void
  setActiveTab: (tab: string) => void
  resetForm: () => void
}

const BundleFormContext = createContext<BundleFormContextType | undefined>(undefined)

export function BundleFormProvider({ children }: { children: ReactNode }) {
  const [bundleTitle, setBundleTitle] = useState('')
  const [bundleDescription, setBundleDescription] = useState('')
  const [bundlePrice, setBundlePrice] = useState('')
  const [bundleCover, setBundleCover] = useState<BundleCoverState>({
    file: null,
    uploading: false,
    progress: 0
  })
  const [newBooks, setNewBooks] = useState<NewBookData[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState('bundle-info')

  const resetForm = () => {
    setBundleTitle('')
    setBundleDescription('')
    setBundlePrice('')
    setBundleCover({ file: null, uploading: false, progress: 0 })
    setNewBooks([])
    setErrors({})
    setActiveTab('bundle-info')
  }

  return (
    <BundleFormContext.Provider
      value={{
        bundleTitle,
        bundleDescription,
        bundlePrice,
        bundleCover,
        newBooks,
        errors,
        activeTab,
        setBundleTitle,
        setBundleDescription,
        setBundlePrice,
        setBundleCover,
        setNewBooks,
        setErrors,
        setActiveTab,
        resetForm,
      }}
    >
      {children}
    </BundleFormContext.Provider>
  )
}

export function useBundleForm() {
  const context = useContext(BundleFormContext)
  if (context === undefined) {
    throw new Error('useBundleForm must be used within a BundleFormProvider')
  }
  return context
}

export type { NewBookData, FileUploadState, BundleCoverState }