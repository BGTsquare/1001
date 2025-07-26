import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { updateProfile, getProfile, createProfile, uploadAvatar } from '../profile'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

// Mock Supabase client
vi.mock('@/lib/supabase/server')
const mockCreateClient = createClient as any

// Mock Next.js revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const mockSupabaseClient = {
  from: vi.fn(),
  storage: {
    from: vi.fn(),
  },
}

const mockProfile: Profile = {
  id: 'user-123',
  display_name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg',
  role: 'user',
  reading_preferences: {
    fontSize: 'medium',
    theme: 'light',
    fontFamily: 'sans-serif',
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('Profile Actions', () => {
  beforeEach(() => {
    mockCreateClient.mockResolvedValue(mockSupabaseClient)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('updateProfile', () => {
    it('updates profile successfully', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      })

      const result = await updateProfile('user-123', {
        display_name: 'Jane Doe',
        reading_preferences: { fontSize: 'large' },
      })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockUpdate).toHaveBeenCalledWith({
        display_name: 'Jane Doe',
        reading_preferences: { fontSize: 'large' },
        updated_at: expect.any(String),
      })
      expect(result).toEqual(mockProfile)
    })

    it('throws error when update fails', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Update failed' },
            }),
          }),
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      })

      await expect(updateProfile('user-123', { display_name: 'Jane Doe' }))
        .rejects.toThrow('Update failed')
    })
  })

  describe('getProfile', () => {
    it('fetches profile successfully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      })

      const result = await getProfile('user-123')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(result).toEqual(mockProfile)
    })

    it('returns null when profile not found', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Profile not found' },
          }),
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      })

      const result = await getProfile('user-123')

      expect(result).toBeNull()
    })
  })

  describe('createProfile', () => {
    it('creates profile successfully', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      })

      const result = await createProfile('user-123', 'John Doe')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockInsert).toHaveBeenCalledWith({
        id: 'user-123',
        display_name: 'John Doe',
        role: 'user',
        reading_preferences: {
          fontSize: 'medium',
          theme: 'light',
          fontFamily: 'sans-serif',
        },
      })
      expect(result).toEqual(mockProfile)
    })

    it('throws error when creation fails', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Creation failed' },
          }),
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      })

      await expect(createProfile('user-123', 'John Doe'))
        .rejects.toThrow('Creation failed')
    })
  })

  describe('uploadAvatar', () => {
    it('uploads avatar successfully', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      
      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'avatars/user-123-123456789.jpg' },
        error: null,
      })

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/avatar.jpg' },
      })

      const mockStorage = {
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }

      mockSupabaseClient.storage.from.mockReturnValue(mockStorage)

      const result = await uploadAvatar('user-123', mockFile)

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('avatars')
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^avatars\/user-123-\d+\.jpg$/),
        mockFile,
        {
          cacheControl: '3600',
          upsert: true,
        }
      )
      expect(result).toBe('https://example.com/avatar.jpg')
    })

    it('throws error when upload fails', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      
      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      })

      const mockStorage = {
        upload: mockUpload,
      }

      mockSupabaseClient.storage.from.mockReturnValue(mockStorage)

      await expect(uploadAvatar('user-123', mockFile))
        .rejects.toThrow('Failed to upload avatar')
    })
  })
})