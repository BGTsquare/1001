import { GET } from '../route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AdminStatsService } from '@/lib/services/admin-stats-service'
import { vi } from 'vitest'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/admin-stats-service')

const mockCreateClient = createClient as any
const MockAdminStatsService = AdminStatsService as any

describe('/api/admin/stats', () => {
  let mockSupabase: any
  let mockStatsService: jest.Mocked<AdminStatsService>

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn()
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }

    mockStatsService = {
      getDashboardStats: vi.fn(),
      getRecentActivity: vi.fn()
    } as any

    mockCreateClient.mockReturnValue(mockSupabase)
    MockAdminStatsService.mockImplementation(() => mockStatsService)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns stats for admin users', async () => {
      const mockStats = {
        totalBooks: 25,
        totalBundles: 5,
        totalUsers: 150,
        pendingPurchases: 3,
        totalRevenue: 1250.50,
        newUsersThisMonth: 12
      }

      // Mock authenticated admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id', email: 'admin@test.com' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      })

      mockStatsService.getDashboardStats.mockResolvedValue(mockStats)

      const request = new NextRequest('http://localhost:3000/api/admin/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ data: mockStats })
      expect(mockStatsService.getDashboardStats).toHaveBeenCalled()
    })

    it('returns 401 for unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
      expect(mockStatsService.getDashboardStats).not.toHaveBeenCalled()
    })

    it('returns 403 for non-admin users', async () => {
      // Mock authenticated regular user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id', email: 'user@test.com' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { role: 'user' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/admin/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({ error: 'Forbidden' })
      expect(mockStatsService.getDashboardStats).not.toHaveBeenCalled()
    })

    it('returns 500 when stats service throws error', async () => {
      // Mock authenticated admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id', email: 'admin@test.com' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      })

      mockStatsService.getDashboardStats.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/admin/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch dashboard statistics' })
    })

    it('returns 401 when auth check fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/admin/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('returns 403 when profile check fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id', email: 'user@test.com' } },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({ error: 'Forbidden' })
    })
  })
})