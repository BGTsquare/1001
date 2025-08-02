import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNav } from '../mobile-nav';
import { AuthProvider } from '@/contexts/auth-context';
import { QueryProvider } from '@/components/providers';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock auth context
const mockAuthContext = {
  user: null,
  profile: null,
  signOut: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  loading: false,
};

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const renderMobileNav = () => {
  return render(
    <QueryProvider>
      <AuthProvider>
        <MobileNav />
      </AuthProvider>
    </QueryProvider>
  );
};

describe('MobileNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the mobile navigation trigger', () => {
    renderMobileNav();
    
    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    expect(trigger).toBeInTheDocument();
  });

  it('opens navigation when trigger is clicked', () => {
    renderMobileNav();
    
    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(trigger);
    
    // Check if navigation items are visible
    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByText('Bundles')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('shows sign in and sign up buttons when user is not authenticated', () => {
    renderMobileNav();
    
    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(trigger);
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('shows user navigation when user is authenticated', () => {
    mockAuthContext.user = { id: '1', email: 'test@example.com' };
    mockAuthContext.profile = { display_name: 'Test User', role: 'user' };
    
    renderMobileNav();
    
    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(trigger);
    
    expect(screen.getByText('My Library')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('shows admin dashboard link for admin users', () => {
    mockAuthContext.user = { id: '1', email: 'admin@example.com' };
    mockAuthContext.profile = { display_name: 'Admin User', role: 'admin' };
    
    renderMobileNav();
    
    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(trigger);
    
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('calls signOut when sign out button is clicked', async () => {
    mockAuthContext.user = { id: '1', email: 'test@example.com' };
    mockAuthContext.profile = { display_name: 'Test User', role: 'user' };
    
    renderMobileNav();
    
    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(trigger);
    
    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);
    
    expect(mockAuthContext.signOut).toHaveBeenCalled();
  });
});