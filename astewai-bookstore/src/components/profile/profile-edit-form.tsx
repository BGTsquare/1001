'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { updateProfile, uploadAvatar } from '@/lib/actions/profile'
import type { Profile, ReadingPreferences } from '@/types'

const profileSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  reading_preferences: z.object({
    fontSize: z.enum(['small', 'medium', 'large']).optional(),
    theme: z.enum(['light', 'dark', 'sepia']).optional(),
    fontFamily: z.enum(['serif', 'sans-serif', 'monospace']).optional(),
  }).optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileEditFormProps {
  profile: Profile
  onSave: (profile: Profile) => void
  onCancel: () => void
}

export function ProfileEditForm({ profile, onSave, onCancel }: ProfileEditFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const readingPrefs = profile.reading_preferences as ReadingPreferences || {}

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile.display_name || '',
      reading_preferences: {
        fontSize: readingPrefs.fontSize || 'medium',
        theme: readingPrefs.theme || 'light',
        fontFamily: readingPrefs.fontFamily || 'sans-serif',
      },
    },
  })

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Clear any previous errors
      setError(null)
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB')
        return
      }

      setAvatarFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarRemove = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      let avatarUrl = profile.avatar_url

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const uploadResult = await uploadAvatar(profile.id, avatarFile)
        if (uploadResult) {
          avatarUrl = uploadResult
        }
      } else if (avatarPreview === null && profile.avatar_url) {
        // Avatar was removed
        avatarUrl = null
      }

      const updatedProfile = await updateProfile(profile.id, {
        display_name: data.display_name,
        avatar_url: avatarUrl,
        reading_preferences: data.reading_preferences || {},
      })

      if (updatedProfile) {
        onSave(updatedProfile)
      } else {
        setError('Failed to update profile')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Avatar Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Profile Picture</h3>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-2xl font-semibold text-gray-600">
                    {profile.display_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    Upload Photo
                  </Button>
                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAvatarRemove}
                      disabled={isLoading}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label htmlFor="display_name" className="text-sm font-medium">
              Display Name
            </label>
            <Input
              id="display_name"
              type="text"
              {...register('display_name')}
              aria-invalid={errors.display_name ? 'true' : 'false'}
            />
            {errors.display_name && (
              <p className="text-sm text-red-600" role="alert">
                {errors.display_name.message}
              </p>
            )}
          </div>

          {/* Reading Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Reading Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="fontSize" className="text-sm font-medium">
                  Font Size
                </label>
                <select
                  id="fontSize"
                  className="w-full h-9 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('reading_preferences.fontSize')}
                  defaultValue={readingPrefs.fontSize || 'medium'}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="theme" className="text-sm font-medium">
                  Theme
                </label>
                <select
                  id="theme"
                  className="w-full h-9 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('reading_preferences.theme')}
                  defaultValue={readingPrefs.theme || 'light'}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="sepia">Sepia</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="fontFamily" className="text-sm font-medium">
                  Font Family
                </label>
                <select
                  id="fontFamily"
                  className="w-full h-9 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('reading_preferences.fontFamily')}
                  defaultValue={readingPrefs.fontFamily || 'sans-serif'}
                >
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans-serif</option>
                  <option value="monospace">Monospace</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}