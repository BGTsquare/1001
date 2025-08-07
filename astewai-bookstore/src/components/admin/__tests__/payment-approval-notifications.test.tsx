import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaymentApprovalNotifications } from '../payment-approval-notifications';
import { NotificationProvider } from '@/contexts/notification-context';
import { AuthProvider } from '@/contexts/auth-context';
import type { NotificationData } from '@/lib/types/notifications';

// Mock the contexts
const mockNotifications: NotificationData[] = [
  {
    id: '1',
    user_id: 'user1',
    type: 'admin_approval_required',
    title: 'New Purchase Request',
    message: 'John Doe requested to purchase "Test Book"',
    data: {
      requestId: 'req1',
      amount: 29.99,
      userDisplayName: 'John Doe',
      itemTitle: 'Test Book'
    },
    read: false,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'user2',
    type: 'purchase_status_update',
    title: 'Purchase Approved',
    message: 'Your purchase has been approved',
    data: {
      status: 'approved',
      amount: 19.99
    },
    read: true,
    created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  }
];

const mockNotificationContext = {
  notifications: mockNotifications,
  unreadCount: 1,
  isConnected: true,
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  clearNotification: jest.fn(),
  clearAllNotifications: jest.fn(),
  updateConfig: jest.fn(),
  config: {
    enablePurchaseUpdates: true,
    enableAdminNotifications: true,
    enableProgressSync: true,
    enableActivityFeed: true,
    enablePushNotifications: false
  }
};

const mockAuthContext = {
  user: { id: 'admin1', email: 'admin@test.com' },
  profile: { id: 'admin1', role: 'admin', display_name: 'Admin User' },
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn()
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      data: [
        {
          id: 'req1',
          user_id: 'user1',
          item_type: 'book',
          item_id: 'book1',
          amount: 29.99,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]
    })
  })
) as jest.Mock;

jest.mock('@/contexts/notification-context', () => ({
  useNotifications: () => mockNotificationContext,
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          {component}
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('PaymentApprovalNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders payment notifications correctly', async () => {
    renderWithProviders(<PaymentApprovalNotifications />);

    expect(screen.getByText('Payment Notifications')).toBeInTheDocument();
    expect(screen.getByText('1 pending')).toBeInTheDocument();
    expect(screen.getByText('1 unread')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('New Purchase Request')).toBeInTheDocument();
      expect(screen.getByText('Purchase Approved')).toBeInTheDocument();
    });
  });

  it('handles notification click correctly', async () => {
    const mockOnViewRequest = jest.fn();
    renderWithProviders(<PaymentApprovalNotifications onViewRequest={mockOnViewRequest} />);

    await waitFor(() => {
      const notification = screen.getByText('New Purchase Request');
      fireEvent.click(notification.closest('div[role="button"], div[tabindex], div[onclick]') || notification);
    });

    expect(mockNotificationContext.markAsRead).toHaveBeenCalledWith('1');
    expect(mockOnViewRequest).toHaveBeenCalledWith('req1');
  });

  it('handles clear notification correctly', async () => {
    renderWithProviders(<PaymentApprovalNotifications />);

    await waitFor(() => {
      const clearButtons = screen.getAllByLabelText('Clear notification');
      fireEvent.click(clearButtons[0]);
    });

    expect(mockNotificationContext.clearNotification).toHaveBeenCalledWith('1');
  });

  it('shows loading state', () => {
    // Mock loading state
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderWithProviders(<PaymentApprovalNotifications />);
    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<PaymentApprovalNotifications />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', () => {
    const emptyContext = {
      ...mockNotificationContext,
      notifications: []
    };

    jest.mocked(require('@/contexts/notification-context').useNotifications).mockReturnValue(emptyContext);

    renderWithProviders(<PaymentApprovalNotifications />);
    expect(screen.getByText('No payment notifications')).toBeInTheDocument();
  });

  it('displays urgent badge for old notifications', async () => {
    const urgentNotification: NotificationData = {
      ...mockNotifications[0],
      created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
    };

    const urgentContext = {
      ...mockNotificationContext,
      notifications: [urgentNotification]
    };

    jest.mocked(require('@/contexts/notification-context').useNotifications).mockReturnValue(urgentContext);

    renderWithProviders(<PaymentApprovalNotifications />);

    await waitFor(() => {
      expect(screen.getByText('Urgent')).toBeInTheDocument();
    });
  });

  it('handles Review All button click', async () => {
    const mockOnViewRequest = jest.fn();
    renderWithProviders(<PaymentApprovalNotifications onViewRequest={mockOnViewRequest} />);

    await waitFor(() => {
      const reviewAllButton = screen.getByText('Review All');
      fireEvent.click(reviewAllButton);
    });

    expect(mockOnViewRequest).toHaveBeenCalledWith('all');
  });
});