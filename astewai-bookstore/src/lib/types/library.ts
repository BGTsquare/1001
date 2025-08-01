// Library-specific types that can be shared between client and server
export interface LibrarySearchOptions {
  status?: 'owned' | 'pending' | 'completed'
  limit?: number
  offset?: number
  sortBy?: 'added_at' | 'progress' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export interface ReadingProgressUpdate {
  progress: number
  lastReadPosition?: string
  status?: 'owned' | 'pending' | 'completed'
}

export interface LibraryStats {
  total: number
  owned: number
  pending: number
  completed: number
  inProgress: number
  averageProgress: number
}

export interface LibraryServiceOptions {
  isClient?: boolean
}