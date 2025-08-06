# Analytics and Monitoring Implementation

This document describes the comprehensive analytics and monitoring infrastructure implemented for the Astewai Digital Bookstore.

## Overview

The analytics system provides:
- **Privacy-friendly analytics** with Vercel Analytics and Plausible
- **Error tracking and monitoring** with Sentry
- **Performance monitoring** and alerting
- **User behavior tracking** for key metrics
- **Conversion tracking** for purchases and signups
- **Admin analytics dashboard** for comprehensive insights

## Architecture

### Analytics Providers

1. **Vercel Analytics** - Built-in analytics for Vercel deployments
2. **Plausible Analytics** - Privacy-friendly alternative to Google Analytics
3. **Sentry** - Error tracking and performance monitoring

### Components

```
src/lib/analytics/
├── config.ts              # Analytics configuration
├── index.ts               # Main analytics service
└── hooks.ts               # React hooks for analytics

src/components/
├── providers/
│   └── analytics-provider.tsx  # Analytics context provider
├── admin/
│   └── analytics-dashboard.tsx # Admin analytics dashboard
└── analytics/
    └── tracking-examples.tsx   # Usage examples

src/app/api/
├── analytics/
│   └── track/route.ts     # Server-side tracking endpoint
└── admin/analytics/
    ├── route.ts           # Analytics data API
    └── export/route.ts    # Data export API
```

## Configuration

### Environment Variables

Add these to your `.env.local`:

```bash
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# Plausible Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=astewai-bookstore.com
NEXT_PUBLIC_PLAUSIBLE_API_HOST=https://plausible.io

# Analytics Storage (optional)
STORE_ANALYTICS_EVENTS=false
```

### Database Setup

Run the analytics migration to create optional event storage tables:

```bash
supabase migration up
```

This creates:
- `analytics_events` - Custom event storage
- `user_sessions` - User session tracking

## Usage

### Basic Event Tracking

```typescript
import { trackEvent } from '@/lib/analytics';

// Track a simple event
trackEvent('button_clicked', {
  button_name: 'purchase',
  page: '/books/123'
});
```

### Using React Hooks

```typescript
import { useAnalytics } from '@/lib/analytics/hooks';

function MyComponent() {
  const { track, trackConversion } = useAnalytics();

  const handlePurchase = () => {
    trackConversion('purchase_completed', {
      item_id: 'book-123',
      value: 29.99,
      currency: 'USD'
    });
  };

  return <button onClick={handlePurchase}>Buy Now</button>;
}
```

### Automatic Page Tracking

```typescript
import { usePageTracking } from '@/lib/analytics/hooks';

function MyApp() {
  usePageTracking(); // Automatically tracks page views
  return <div>My App</div>;
}
```

### Form Tracking

```typescript
import { useFormTracking } from '@/lib/analytics/hooks';

function ContactForm() {
  const { trackFormStart, trackFormSubmit } = useFormTracking('contact');

  useEffect(() => {
    trackFormStart();
  }, []);

  const handleSubmit = async (success: boolean) => {
    trackFormSubmit(success);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Search Tracking

```typescript
import { useSearchTracking } from '@/lib/analytics/hooks';

function SearchComponent() {
  const { trackSearch } = useSearchTracking();

  const handleSearch = (query: string, resultCount: number) => {
    trackSearch(query, { category: 'books' }, resultCount);
  };

  return <input onChange={(e) => handleSearch(e.target.value, 42)} />;
}
```

### Reading Progress Tracking

```typescript
import { useReadingTracking } from '@/lib/analytics/hooks';

function BookReader({ bookId, bookTitle }) {
  const { trackBookOpen, trackReadingProgress } = useReadingTracking(bookId, bookTitle);

  useEffect(() => {
    trackBookOpen();
  }, []);

  const handleProgressUpdate = (progress: number) => {
    trackReadingProgress(progress);
  };

  return <div>Book Reader</div>;
}
```

## Predefined Events

The system includes predefined events for common actions:

### User Events
- `user_signup` - User registration
- `user_login` - User authentication
- `user_logout` - User logout

### Book Events
- `book_view` - Book page viewed
- `book_preview` - Book preview opened
- `book_search` - Search performed
- `book_filter` - Filter applied

### Purchase Events
- `purchase_initiated` - Purchase started
- `purchase_completed` - Purchase successful
- `purchase_failed` - Purchase failed

### Library Events
- `library_view` - Library accessed
- `book_open` - Book opened for reading
- `reading_progress` - Reading progress updated
- `book_completed` - Book finished

### Admin Events
- `admin_login` - Admin authentication
- `book_upload` - Book uploaded
- `bundle_create` - Bundle created
- `purchase_approve` - Purchase approved

## Admin Analytics Dashboard

The admin dashboard provides comprehensive analytics including:

### Overview Metrics
- Total users, books, purchases
- Revenue and conversion rates
- User growth metrics

### User Analytics
- New vs returning users
- User activity patterns
- Registration trends

### Book Analytics
- Most viewed books
- Popular categories
- Performance metrics

### Purchase Analytics
- Recent transactions
- Revenue trends
- Purchase status tracking

### Performance Metrics
- Page load times
- Error rates
- System uptime

### Data Export
- CSV export functionality
- Customizable date ranges
- Comprehensive data sets

## Privacy and Compliance

### Privacy-First Approach
- Uses privacy-friendly analytics providers
- No personal data collection without consent
- Respects user privacy preferences

### GDPR Compliance
- Cookie consent integration
- Data export capabilities
- User data deletion support

### Data Retention
- Automatic cleanup of old events
- Configurable retention periods
- Secure data handling

## Performance Monitoring

### Core Web Vitals
- Automatic tracking of performance metrics
- Page load time monitoring
- User experience metrics

### Error Tracking
- Automatic error capture
- Performance issue detection
- Real-time alerting

### Custom Metrics
- Business-specific KPIs
- User engagement metrics
- Conversion funnel analysis

## API Endpoints

### Tracking Endpoint
```
POST /api/analytics/track
```
Server-side event tracking with user context.

### Admin Analytics
```
GET /api/admin/analytics?range=7d
```
Comprehensive analytics data for admin dashboard.

### Data Export
```
GET /api/admin/analytics/export?range=30d
```
CSV export of analytics data.

## Best Practices

### Event Naming
- Use consistent naming conventions
- Include relevant context data
- Avoid sensitive information

### Performance
- Debounce frequent events
- Use async tracking
- Minimize payload size

### Privacy
- Respect user preferences
- Anonymize sensitive data
- Provide opt-out mechanisms

### Testing
- Test analytics in development
- Verify event data accuracy
- Monitor for tracking errors

## Troubleshooting

### Common Issues

1. **Events not tracking**
   - Check environment variables
   - Verify provider configuration
   - Check browser console for errors

2. **Dashboard not loading**
   - Verify admin permissions
   - Check API endpoint responses
   - Review database connections

3. **Performance issues**
   - Monitor tracking frequency
   - Check payload sizes
   - Review debouncing settings

### Debug Mode

Enable debug logging in development:

```typescript
// Analytics events logged to console in development
if (process.env.NODE_ENV === 'development') {
  console.log('📊 Analytics Event:', event, data);
}
```

## Future Enhancements

- Real-time analytics dashboard
- Advanced segmentation
- A/B testing integration
- Custom event builder
- Automated reporting
- Machine learning insights

## Support

For issues or questions about the analytics implementation:

1. Check the troubleshooting section
2. Review the usage examples
3. Consult the API documentation
4. Contact the development team

---

This analytics system provides comprehensive insights while maintaining user privacy and system performance. Regular monitoring and optimization ensure continued effectiveness and compliance.