'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { ProfileDisplay } from '@/components/profile'

interface ProfilePageClientProps {
  profile: Profile
  user: User
}

export function ProfilePageClient({ profile: initialProfile }: ProfilePageClientProps) {
  const [profile, setProfile] = useState(initialProfile)

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account information and reading preferences
          </p>
        </div>

        <ProfileDisplay
          profile={profile}
          onProfileUpdate={handleProfileUpdate}
        />
      </div>
    </div>
  )
}