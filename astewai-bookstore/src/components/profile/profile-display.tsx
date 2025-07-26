'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { ProfileEditForm } from './profile-edit-form'
import type { Profile, ReadingPreferences } from '@/types'

interface ProfileDisplayProps {
  profile: Profile
  onProfileUpdate?: (profile: Profile) => void
}

export function ProfileDisplay({ profile, onProfileUpdate }: ProfileDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { user } = useAuth()

  const readingPrefs = profile.reading_preferences as ReadingPreferences || {}

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setIsEditing(false)
    onProfileUpdate?.(updatedProfile)
  }

  if (isEditing) {
    return (
      <ProfileEditForm
        profile={profile}
        onSave={handleProfileUpdate}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Profile</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          Edit Profile
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={`${profile.display_name}'s avatar`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = `<div class="text-2xl font-semibold text-gray-600">${profile.display_name?.charAt(0).toUpperCase() || 'U'}</div>`
                  }
                }}
              />
            ) : (
              <div className="text-2xl font-semibold text-gray-600">
                {profile.display_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{profile.display_name}</h2>
            <p className="text-gray-600">{user?.email}</p>
            <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
          </div>
        </div>

        {/* Reading Preferences */}
        <div>
          <h3 className="text-lg font-medium mb-3">Reading Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Font Size</label>
              <p className="text-sm text-gray-600 capitalize">
                {readingPrefs.fontSize || 'Medium'}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Theme</label>
              <p className="text-sm text-gray-600 capitalize">
                {readingPrefs.theme || 'Light'}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Font Family</label>
              <p className="text-sm text-gray-600 capitalize">
                {readingPrefs.fontFamily || 'Sans-serif'}
              </p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div>
          <h3 className="text-lg font-medium mb-3">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Member Since</label>
              <p className="text-sm text-gray-600">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Last Updated</label>
              <p className="text-sm text-gray-600">
                {new Date(profile.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}