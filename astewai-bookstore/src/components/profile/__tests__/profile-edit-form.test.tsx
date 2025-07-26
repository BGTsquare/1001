import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { ProfileEditForm } from '../profile-edit-form'
import { updateProfile, uploadAvatar } from '@/lib/actions/profile'
import type { Profile } from '@/types'

// Mock the profile actions
vi.mock('@/lib/actions/profile')
const mockUpdateProfile = updateProfile as any
const mockUploadAvatar = uploadAvatar as any

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

describe('ProfileEditForm', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    mockUpdateProfile.mockResolvedValue(mockProfile)
    mockUploadAvatar.mockResolvedValue('https://example.com/new-avatar.jpg')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders form with current profile data', () => {
    render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    
    // Check select elements by their selected options
    const fontSizeSelect = screen.getByLabelText('Font Size') as HTMLSelectElement
    expect(fontSizeSelect.value).toBe('medium')
    
    const themeSelect = screen.getByLabelText('Theme') as HTMLSelectElement
    expect(themeSelect.value).toBe('light')
    
    const fontFamilySelect = screen.getByLabelText('Font Family') as HTMLSelectElement
    expect(fontFamilySelect.value).toBe('sans-serif')
  })

  it('displays avatar preview when avatar_url exists', () => {
    render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const avatarImage = screen.getByAltText('Avatar preview')
    expect(avatarImage).toBeInTheDocument()
    expect(avatarImage).toHaveAttribute('src', mockProfile.avatar_url)
  })

  it('displays initials when no avatar_url exists', () => {
    const profileWithoutAvatar = { ...mockProfile, avatar_url: null }
    render(
      <ProfileEditForm
        profile={profileWithoutAvatar}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('validates display name is required', async () => {
    const user = userEvent.setup()
    render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const displayNameInput = screen.getByLabelText('Display Name')
    await user.clear(displayNameInput)
    await user.type(displayNameInput, 'A') // Too short
    
    const saveButton = screen.getByText('Save Changes')
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Display name must be at least 2 characters')).toBeInTheDocument()
    })
  })

  it('updates profile successfully', async () => {
    const user = userEvent.setup()
    render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const displayNameInput = screen.getByLabelText('Display Name')
    await user.clear(displayNameInput)
    await user.type(displayNameInput, 'Jane Doe')

    const fontSizeSelect = screen.getByLabelText('Font Size')
    await user.selectOptions(fontSizeSelect, 'large')

    const saveButton = screen.getByText('Save Changes')
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith('user-123', {
        display_name: 'Jane Doe',
        avatar_url: mockProfile.avatar_url,
        reading_preferences: {
          fontSize: 'large',
          theme: 'light',
          fontFamily: 'sans-serif',
        },
      })
      expect(mockOnSave).toHaveBeenCalledWith(mockProfile)
    })
  })

  it('handles avatar upload', async () => {
    const user = userEvent.setup()
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
    
    render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(hiddenInput, file)

    await waitFor(() => {
      expect(screen.getByAltText('Avatar preview')).toBeInTheDocument()
    })

    const saveButton = screen.getByText('Save Changes')
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockUploadAvatar).toHaveBeenCalledWith('user-123', file)
      expect(mockUpdateProfile).toHaveBeenCalledWith('user-123', {
        display_name: 'John Doe',
        avatar_url: 'https://example.com/new-avatar.jpg',
        reading_preferences: {
          fontSize: 'medium',
          theme: 'light',
          fontFamily: 'sans-serif',
        },
      })
    })
  })

  it('validates file type for avatar upload', async () => {
    const user = userEvent.setup()
    const file = new File(['document'], 'document.pdf', { type: 'application/pdf' })
    
    render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    // Simulate file selection by directly calling the change handler
    const changeEvent = {
      target: {
        files: [file]
      }
    } as React.ChangeEvent<HTMLInputElement>
    
    // Get the component instance and trigger the change handler
    fireEvent.change(hiddenInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Please select an image file')).toBeInTheDocument()
    })
  })

  it('validates file size for avatar upload', async () => {
    const user = userEvent.setup()
    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
    
    render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    // Mock the file input change event
    Object.defineProperty(hiddenInput, 'files', {
      value: [largeFile],
      writable: false,
    })
    
    // Trigger the change event
    const changeEvent = new Event('change', { bubbles: true })
    hiddenInput.dispatchEvent(changeEvent)

    await waitFor(() => {
      expect(screen.getByText('Image must be less than 5MB')).toBeInTheDocument()
    })
  })

  it('removes avatar when remove button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const removeButton = screen.getByText('Remove')
    await user.click(removeButton)

    expect(screen.getByText('J')).toBeInTheDocument() // Should show initials
    expect(screen.queryByAltText('Avatar preview')).not.toBeInTheDocument()

    const saveButton = screen.getByText('Save Changes')
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith('user-123', {
        display_name: 'John Doe',
        avatar_url: null,
        reading_preferences: {
          fontSize: 'medium',
          theme: 'light',
          fontFamily: 'sans-serif',
        },
      })
    })
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('displays error message when update fails', async () => {
    const user = userEvent.setup()
    mockUpdateProfile.mockRejectedValue(new Error('Update failed'))
    
    render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const saveButton = screen.getByText('Save Changes')
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument()
    })
  })

  it('shows loading state during save', async () => {
    const user = userEvent.setup()
    let resolveUpdate: (value: any) => void
    mockUpdateProfile.mockReturnValue(new Promise(resolve => {
      resolveUpdate = resolve
    }))
    
    render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const saveButton = screen.getByText('Save Changes')
    await user.click(saveButton)

    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(saveButton).toBeDisabled()

    // Resolve the promise
    resolveUpdate!(mockProfile)
    
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument()
    })
  })
})