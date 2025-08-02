import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';
import { vi } from 'vitest';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}));

// Mock date-fns functions
vi.mock('date-fns', () => ({
  subDays: vi.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
  startOfDay: vi.fn((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())),
  endOfDay: vi.fn((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)),
  format: vi.fn((date, format) => {
    if (format === 'MMM d') {
      return `Jan ${date.getDate()}`;
    }
    return date.toISOString();
  })
}));

const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      })),
      gte: vi.fn(() => ({
        lte: vi.fn(() => ({
          order: vi.fn()
        }))
      }))
    }))
  }))
};

describe('/api/admin/analytics/purchases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockReturnValue(mockSupabase);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated')
    });

    const request = new NextRequest('http://localhost:3000/api/admin/analytics/purchases');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 403 when user is not admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { role: 'user' },
            error: null
          })
        }))
      }))
    });

    const request = new NextRequest('http://localhost:3000/api/admin/analytics/purchases');
    const response = await GET(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Forbidden');
  });

  it('returns analytics data for admin user', async () => {
    const mockPurchaseRequests = [
      {
        id: '1',
        user_id: 'user-1',
        item_type: 'book',
        item_id: 'book-1',
        amount: 25.00,
        status: 'pending',
        preferred_contact_method: 'email',
        user_message: 'Test message',
        admin_notes: null,
        contacted_at: null,
        responded_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        book: { id: 'book-1', title: 'Test Book', author: 'Test Author' }
      },
      {
        id: '2',
        user_id: 'user-2',
        item_type: 'bundle',
        item_id: 'bundle-1',
        amount: 50.00,
        status: 'completed',
        preferred_contact_method: 'telegram',
        user_message: null,
        admin_notes: 'Completed successfully',
        contacted_at: '2024-01-01T01:00:00Z',
        responded_at: '2024-01-01T02:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T02:00:00Z',
        bundle: { id: 'bundle-1', title: 'Test Bundle' }
      }
    ];

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null
    });

    // Mock profile and purchase requests
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null
              })
            }))
          }))
        };
      }
      
      if (table === 'purchase_requests') {
        return {
          select: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: mockPurchaseRequests,
                  error: null
                })
              }))
            }))
          }))
        };
      }
      
      return mockSupabase.from();
    });

    const request = new NextRequest('http://localhost:3000/api/admin/analytics/purchases?range=30d');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data.data).toMatchObject({
      totalRequests: 2,
      pendingRequests: 1,
      completedRequests: 1,
      totalRevenue: 50.00, // Only completed requests
    });

    expect(data.data.recentRequests).toHaveLength(2);
  });

  it('handles empty data correctly', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null
    });

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null
              })
            }))
          }))
        };
      }
      
      if (table === 'purchase_requests') {
        return {
          select: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              }))
            }))
          }))
        };
      }
      
      return mockSupabase.from();
    });

    const request = new NextRequest('http://localhost:3000/api/admin/analytics/purchases');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data.data).toMatchObject({
      totalRequests: 0,
      pendingRequests: 0,
      totalRevenue: 0,
      conversionRate: 0,
      recentRequests: []
    });
  });
});