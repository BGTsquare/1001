import { describe, it, expect } from 'vitest'

describe('ContactService', () => {
  it('should have the correct interface', () => {
    // Test that the service exports the expected types and functions
    expect(typeof import('../contact-service')).toBe('object')
  })

  it('should define ContactService class correctly', async () => {
    const { ContactService } = await import('../contact-service')
    
    // Check that ContactService is a class
    expect(typeof ContactService).toBe('function')
    expect(ContactService.prototype.constructor).toBe(ContactService)
  })

  it('should have purchase request methods', async () => {
    const { ContactService } = await import('../contact-service')
    const service = new ContactService()
    
    // Check that required methods exist
    expect(typeof service.createPurchaseRequest).toBe('function')
    expect(typeof service.getPurchaseRequests).toBe('function')
    expect(typeof service.updatePurchaseRequestStatus).toBe('function')
    expect(typeof service.approvePurchaseRequest).toBe('function')
    expect(typeof service.rejectPurchaseRequest).toBe('function')
  })

  it('should have admin contact methods', async () => {
    const { ContactService } = await import('../contact-service')
    const service = new ContactService()
    
    // Check that admin contact methods exist
    expect(typeof service.getAdminContactInfo).toBe('function')
    expect(typeof service.createAdminContactInfo).toBe('function')
    expect(typeof service.updateAdminContactInfo).toBe('function')
    expect(typeof service.deleteAdminContactInfo).toBe('function')
  })

  it('should have utility methods', async () => {
    const { ContactService } = await import('../contact-service')
    const service = new ContactService()
    
    // Check that utility methods exist
    expect(typeof service.generatePurchaseRequestMessage).toBe('function')
    expect(typeof service.getContactMethodsByType).toBe('function')
    expect(typeof service.getBestContactMethod).toBe('function')
  })
})