import { AdminStatsService } from '../admin-stats-service'
import { createClient } from '@/lib/supabase/server'
import { vi } from 'vitest'

// Mock Supabase client
vi.mock('@/lib/supabase/server')
const mockCreateClient = createClient as any

describe('AdminStatsService', () => {
  let adminStatsService: AdminStatsService
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }
    
    mockCreateClient.mockReturnValue(mockSupabase)
    adminStatsService = new AdminStatsService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getDashboardStats', () => {
    it('returns correct stats when all queries succeed', async () => {
      // Mock successful responses
      mockSupabase.from
        .mockReturnValueOnce({ 
          select: vi.fn().mockResolvedValue({ count: 25 }) 
        }) // books
        .mockReturnValueOnce({ 
          select: vi.fn().mockResolvedValue({ count: 5 }) 
        }) // bundles
        .mockReturnValueOnce({ 
          select: vi.fn().mockResolvedValue({ count: 150 }) 
        }) // users
        .mockReturnValueOnce({ 
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ count: 3 })
        }) // pending purchases
        .mockReturnValueOnce({ 
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ 
            data: [
              { amount: 100 },
              { amount: 200 },
              { amount: 150.50 }
            ]
          })
        }) // revenue
        .mockReturnValueOnce({ 
          select: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({ count: 12 })
        }) // new users

      const stats = await adminStatsService.getDashboardStats()

      expect(stats).toEqual({
        totalBooks: 25,
        totalBundles: 5,
        totalUsers: 150,
        pendingPurchases: 3,
        totalRevenue: 450.50,
        newUsersThisMonth: 12
      })
    })

    it('returns default stats when queries fail', async () => {
      // Mock failed responses
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database error')
      })

      const stats = await adminStatsService.getDashboardStats()

      expect(stats).toEqual({
        totalBooks: 0,
        totalBundles: 0,
        totalUsers: 0,
        pendingPurchases: 0,
        totalRevenue: 0,
        newUsersThisMonth: 0
      })
    })

    it('handles null counts gracefully', async () => {
      // Mock responses with null counts
      mockSupabase.from
        .mockReturnValueOnce({ 
          select: vi.fn().mockResolvedValue({ count: null }) 
        })
        .mockReturnValueOnce({ 
          select: vi.fn().mockResolvedValue({ count: null }) 
        })
        .mockReturnValueOnce({ 
          select: vi.fn().mockResolvedValue({ count: null }) 
        })
        .mockReturnValueOnce({ 
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ count: null })
        })
        .mockReturnValueOnce({ 
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: null })
        })
        .mockReturnValueOnce({ 
          select: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({ count: null })
        })

      const stats = await adminStatsService.getDashboardStats()

      expect(stats).toEqual({
        totalBooks: 0,
        totalBundles: 0,
        totalUsers: 0,
        pendingPurchases: 0,
        totalRevenue: 0,
        newUsersThisMonth: 0
      })
    })

    it('calculates revenue correctly with empty data', async () => {
      mockSupabase.from
        .mockReturnValueOnce({ 
          select: vi.fn().mockResolvedValue({ count: 0 }) 
        })
        .mockReturnValueOnce({ 
          select: vi.fn().mockResolvedValue({ count: 0 }) 
        })
        .mockReturnValueOnce({ 
          select: vi.fn().mockResolvedValue({ count: 0 }) 
        })
        .mockReturnValueOnce({ 
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ count: 0 })
        })
        .mockReturnValueOnce({ 
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [] })
        })
        .mockReturnValueOnce({ 
          select: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({ count: 0 })
        })

      const stats = await adminStatsService.getDashboardStats()

      expect(stats.totalRevenue).toBe(0)
    })
  })

  describe('getRecentActivity', () => {
    it('returns recent activity when queries succeed', async () => {
      const mockPurchases = [
        { id: '1', amount: 100, status: 'completed', item_type: 'book', created_at: '2024-01-01', profiles: { display_name: 'User 1' } }
      ]
      const mockUsers = [
        { id: '1', display_name: 'New User', created_at: '2024-01-01' }
      ]

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockPurchases })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockUsers })
        })

      const activity = await adminStatsService.getRecentActivity(10)

      expect(activity).toEqual({
        recentPurchases: mockPurchases,
        recentUsers: mockUsers
      })
    })

    it('returns empty arrays when queries fail', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database error')
      })

      const activity = await adminStatsService.getRecentActivity()

      expect(activity).toEqual({
        recentPurchases: [],
        recentUsers: []
      })
    })

    it('uses default limit when none provided', async () => {
      const mockLimit = vi.fn().mockResolvedValue({ data: [] })
      
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: mockLimit
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: mockLimit
        })

      await adminStatsService.getRecentActivity()

      expect(mockLimit).toHaveBeenCalledWith(10)
    })
  })
})