# Bundle Repository Migration Guide

## Overview
This guide outlines the migration from the current bundle repository implementations to the improved, standardized version.

## Current Issues
1. **Duplicate Implementations**: Two different bundle repositories exist
2. **Inconsistent Error Handling**: Mixed patterns of throwing vs returning null
3. **Large Classes**: Single class handling multiple responsibilities
4. **No Caching**: Performance issues with repeated queries
5. **Poor Testability**: Difficult to mock and test

## Migration Steps

### Phase 1: Implement New Repository (✅ Complete)
- [x] Create improved bundle repository with standardized error handling
- [x] Implement separation of concerns (BundleBookService)
- [x] Add comprehensive validation
- [x] Create caching layer
- [x] Add business logic service for pricing

### Phase 2: Update Imports (In Progress)
Replace imports across the codebase:

```typescript
// Old imports
import { getBundles, getBundleById } from '@/lib/repositories/bundleRepository'
import { BundleRepository } from '@/lib/repositories/bundle-repository'

// New imports
import { cachedBundleRepository } from '@/lib/repositories/cached-bundle-repository'
import { createBundlePricingService } from '@/lib/services/bundle-pricing-service'
```

### Phase 3: Update API Routes
Update API routes to use the new repository pattern:

```typescript
// Before
const bundles = await getBundles(options)

// After
const result = await cachedBundleRepository.getAll(options)
if (!result.success) {
  return NextResponse.json({ error: result.error.message }, { status: 500 })
}
const bundles = result.data
```

### Phase 4: Update Components
Update React components to handle the new Result type:

```typescript
// Before
const bundles = await bundleRepository.getAll()

// After
const result = await bundleRepository.getAll()
if (result.success) {
  setBundles(result.data)
} else {
  setError(result.error.message)
}
```

### Phase 5: Remove Old Files
After migration is complete:
- [ ] Remove `src/lib/repositories/bundleRepository.ts`
- [ ] Remove old `bundle-repository.ts` if not needed
- [ ] Update all imports and references

## Benefits After Migration

### 1. **Consistent Error Handling**
```typescript
// Standardized Result type
type RepositoryResult<T> = 
  | { success: true; data: T }
  | { success: false; error: BundleRepositoryError }
```

### 2. **Better Performance**
- Intelligent caching with TTL
- Optimized queries
- Concurrent book fetching

### 3. **Improved Maintainability**
- Single responsibility classes
- Clear separation of concerns
- Comprehensive validation

### 4. **Enhanced Testing**
- Mockable dependencies
- Comprehensive test coverage
- Isolated business logic

### 5. **Type Safety**
- Strict TypeScript types
- Runtime validation
- Better IDE support

## Breaking Changes

### Error Handling
```typescript
// Old way - throws exceptions
try {
  const bundle = await getBundleById(id)
} catch (error) {
  // Handle error
}

// New way - returns Result type
const result = await bundleRepository.getById(id)
if (!result.success) {
  // Handle result.error
}
```

### Return Types
```typescript
// Old way - returns null on error
const bundle = await getBundleById(id) // Bundle | null

// New way - returns Result type
const result = await bundleRepository.getById(id) // RepositoryResult<Bundle>
```

## Testing Strategy

### Unit Tests
- Repository methods with mocked Supabase client
- Business logic validation
- Error handling scenarios

### Integration Tests
- End-to-end API testing
- Database interaction testing
- Cache behavior validation

### Performance Tests
- Query optimization verification
- Cache hit/miss ratios
- Concurrent operation handling

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**: Revert imports to old repository
2. **Partial Rollback**: Use feature flags to switch between implementations
3. **Gradual Migration**: Migrate one API route at a time

## Timeline

- **Week 1**: Phase 1 & 2 (Repository implementation and import updates)
- **Week 2**: Phase 3 & 4 (API routes and component updates)
- **Week 3**: Phase 5 & Testing (Cleanup and comprehensive testing)
- **Week 4**: Monitoring and optimization

## Monitoring

After migration, monitor:
- Error rates and types
- Performance metrics
- Cache hit ratios
- User experience impact

## Support

For questions or issues during migration:
- Check this guide first
- Review test files for usage examples
- Consult the improved repository documentation