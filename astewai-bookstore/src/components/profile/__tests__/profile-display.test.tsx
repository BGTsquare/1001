import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ProfileDisplay } from '../profile-display'
import { useAuth } from '@/contexts/auth-context'
import type { Profile } from '@/types'

// Mock the auth context
vi.mock('@/contexts/auth-context')
const mockUseAuth = useAuth as any

// Mock the profile edit form
vi.mock('../profile-edit-form', () => ({
  ProfileEditForm: ({ onSave, onCancel }: any) => (
    <div data-testid="profile-edit-form">
      <button onClick={() => onSave(mockProfile)}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}))

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

const mockUser = {
  id: 'user-123',
  email: 'john@example.com',
}

describe('ProfileDisplay', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders profile information correctly', () => {
    render(<ProfileDisplay profile={mockProfile} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('user')).toBeInTheDocument()
    expect(screen.getByText('medium')).toBeInTheDocument()
    expect(screen.getByText('light')).toBeInTheDocument()
    expect(screen.getByText('sans-serif')).toBeInTheDocument()
  })

  it('displays user initials in avatar circle when no avatar image', () => {
    const profileWithoutAvatar = { ...mockProfile, avatar_url: null }
    render(<ProfileDisplay profile={profileWithoutAvatar} />)

    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('displays initials when no avatar_url is provided', () => {
    const profileWithoutAvatar = { ...mockProfile, avatar_url: null }
    render(<ProfileDisplay profile={profileWithoutAvatar} />)

    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('switches to edit mode when edit button is clicked', () => {
    render(<ProfileDisplay profile={mockProfile} />)

    const editButton = screen.getByText('Edit Profile')
    fireEvent.click(editButton)

    expect(screen.getByTestId('profile-edit-form')).toBeInTheDocument()
  })

  it('calls onProfileUpdate when profile is saved', () => {
    const mockOnProfileUpdate = vi.fn()
    render(<ProfileDisplay profile={mockProfile} onProfileUpdate={mockOnProfileUpdate} />)

    const editButton = screen.getByText('Edit Profile')
    fireEvent.click(editButton)

    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)

    expect(mockOnProfileUpdate).toHaveBeenCalledWith(mockProfile)
  })

  it('exits edit mode when cancel is clicked', () => {
    render(<ProfileDisplay profile={mockProfile} />)

    const editButton = screen.getByText('Edit Profile')
    fireEvent.click(editButton)

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(screen.queryByTestId('profile-edit-form')).not.toBeInTheDocument()
    expect(screen.getByText('Edit Profile')).toBeInTheDocument()
  })

  it('displays default values for missing reading preferences', () => {
    const profileWithoutPrefs = {
      ...mockProfile,
      reading_preferences: {},
    }
    render(<ProfileDisplay profile={profileWithoutPrefs} />)

    expect(screen.getByText('Medium')).toBeInTheDocument() // default fontSize
    expect(screen.getByText('Light')).toBeInTheDocument() // default theme
    expect(screen.getByText('Sans-serif')).toBeInTheDocument() // default fontFamily
  })

  it('formats dates correctly', () => {
    render(<ProfileDisplay profile={mockProfile} />)

    const dates = screen.getAllByText('01/01/2024')
    expect(dates).toHaveLength(2) // Member Since and Last Updated
  })
})