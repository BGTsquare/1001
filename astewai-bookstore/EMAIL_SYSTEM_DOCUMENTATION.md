# Email Notification System Documentation

## Overview

The Astewai Digital Bookstore includes a comprehensive email notification system built with React Email templates and Resend service integration. The system handles transactional emails for user registration, purchases, security notifications, and admin communications.

## Architecture

### Core Components

1. **Email Service** (`src/lib/services/email.ts`)
   - Resend integration
   - Email sending functionality
   - Batch email support
   - Error handling

2. **Email Notifications** (`src/lib/services/email-notifications.ts`)
   - High-level notification functions
   - Business logic integration
   - Template orchestration

3. **React Email Templates** (`src/components/emails/`)
   - Responsive HTML email templates
   - Consistent branding and styling
   - Tailwind CSS integration

4. **API Routes** (`src/app/api/emails/`)
   - RESTful email sending endpoints
   - Authentication and authorization
   - Request validation

5. **Server Actions** (`src/lib/actions/email-actions.ts`)
   - Server-side email triggers
   - Database integration
   - User data fetching

## Email Templates

### 1. Welcome Email (`welcome-email.tsx`)
**Trigger:** New user registration
**Purpose:** Welcome new users and introduce platform features

**Features:**
- Personalized greeting
- Platform feature highlights
- Call-to-action to explore books
- Support information

### 2. Purchase Receipt Email (`purchase-receipt-email.tsx`)
**Trigger:** Immediate after purchase submission
**Purpose:** Confirm purchase receipt and set expectations

**Features:**
- Order details and items
- Payment information
- Pending approval status
- Next steps information

### 3. Purchase Confirmation Email (`purchase-confirmation-email.tsx`)
**Trigger:** After admin approves purchase
**Purpose:** Confirm purchase approval and provide access

**Features:**
- Approval confirmation
- Item availability status
- Library access links
- Reading tips and guidance

### 4. Password Reset Email (`password-reset-email.tsx`)
**Trigger:** User requests password reset
**Purpose:** Secure password reset process

**Features:**
- Secure reset link
- Expiration information
- Security warnings
- Alternative access instructions

### 5. Security Notification Email (`security-notification-email.tsx`)
**Trigger:** Security events (login, password change, suspicious activity)
**Purpose:** Keep users informed about account security

**Features:**
- Event details (time, location, device)
- Risk-based styling and messaging
- Action recommendations
- Security best practices

### 6. Admin Purchase Approval Email (`admin-purchase-approval-email.tsx`)
**Trigger:** New purchase requires approval
**Purpose:** Notify admins of pending purchases

**Features:**
- Purchase overview
- Customer information
- Item details
- Quick approval/rejection actions
- Admin guidelines

## Configuration

### Environment Variables

```bash
# Required
RESEND_API_KEY=your-resend-api-key-here

# Optional (defaults provided)
ADMIN_EMAIL=admin@astewai-bookstore.com
SUPPORT_EMAIL=support@astewai-bookstore.com
NEXT_PUBLIC_SITE_URL=https://astewai-bookstore.com
```

### Email Service Setup

1. **Sign up for Resend**
   - Create account at [resend.com](https://resend.com)
   - Generate API key
   - Add to environment variables

2. **Domain Configuration**
   - Add your domain to Resend
   - Configure DNS records
   - Verify domain ownership

3. **From Address Setup**
   - Configure sender addresses
   - Set up DKIM/SPF records
   - Test deliverability

## Usage

### Server Actions (Recommended)

```typescript
import { sendWelcomeEmailAction } from '@/lib/actions/email-actions';

// Send welcome email
const result = await sendWelcomeEmailAction(userId);

if (result.success) {
  console.log('Welcome email sent:', result.id);
} else {
  console.error('Failed to send email:', result.error);
}
```

### API Routes

```typescript
// Send email via API
const response = await fetch('/api/emails/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'welcome',
    data: {
      user: { id: 'user-123', name: 'John Doe', email: 'john@example.com' }
    }
  })
});
```

### React Hook

```typescript
import { useEmailNotifications } from '@/lib/hooks/use-email-notifications';

function MyComponent() {
  const { sendWelcomeEmail, isLoading } = useEmailNotifications();
  
  const handleSendWelcome = () => {
    sendWelcomeEmail({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com'
    });
  };
  
  return (
    <button onClick={handleSendWelcome} disabled={isLoading}>
      Send Welcome Email
    </button>
  );
}
```

## Integration Points

### User Registration
- Automatically sends welcome email after profile creation
- Integrated with Supabase auth triggers

### Purchase Flow
1. **Purchase Submission:** Receipt email sent immediately
2. **Admin Approval:** Approval notification sent to admins
3. **Purchase Approval:** Confirmation email sent to customer

### Security Events
- Login notifications for new devices/locations
- Password change confirmations
- Suspicious activity alerts

### Admin Workflows
- Purchase approval notifications
- Batch admin communications
- System alerts and updates

## Testing

### Unit Tests
```bash
# Run email service tests
pnpm test src/lib/services/__tests__/email.test.ts

# Run email notification tests
pnpm test src/lib/services/__tests__/email-notifications.test.ts

# Run template tests
pnpm test src/components/emails/__tests__/
```

### Integration Tests
```bash
# Run API route tests
pnpm test src/app/api/emails/__tests__/

# Run server action tests
pnpm test src/lib/actions/__tests__/
```

### Manual Testing
1. **Admin Panel:** Use the email test panel in admin dashboard
2. **Development API:** Use `/api/emails/test` endpoint
3. **Staging Environment:** Test full user flows

### Test Email Panel
Access the admin email test panel to send test emails:
- Navigate to Admin Dashboard
- Find "Email Template Testing" section
- Select template type
- Enter test email address
- Send test email

## Monitoring and Debugging

### Logging
- All email operations are logged to console
- Failed emails include error details
- Success emails include Resend message ID

### Error Handling
- Graceful degradation for email failures
- User-friendly error messages
- Retry mechanisms for transient failures

### Monitoring
- Track email delivery rates
- Monitor bounce and complaint rates
- Set up alerts for high failure rates

## Security Considerations

### Data Protection
- No sensitive data in email templates
- Secure token handling for password resets
- PII masking in logs

### Authentication
- API routes require proper authentication
- Admin endpoints require admin role
- Rate limiting on email endpoints

### Email Security
- SPF/DKIM configuration
- Secure unsubscribe links
- Anti-phishing measures

## Performance Optimization

### Batch Processing
- Use `sendBatchEmails` for multiple recipients
- Queue emails for high-volume operations
- Implement retry logic for failures

### Template Optimization
- Minimize template complexity
- Optimize images and assets
- Use efficient CSS practices

### Caching
- Cache rendered templates when possible
- Optimize database queries for user data
- Use connection pooling for high volume

## Troubleshooting

### Common Issues

1. **Emails Not Sending**
   - Check Resend API key configuration
   - Verify domain setup and DNS records
   - Check rate limits and quotas

2. **Template Rendering Issues**
   - Validate React Email component syntax
   - Check for missing props or data
   - Test template rendering in isolation

3. **Authentication Errors**
   - Verify user authentication status
   - Check admin role permissions
   - Validate API request format

4. **Delivery Issues**
   - Check spam folder
   - Verify recipient email address
   - Review Resend delivery logs

### Debug Commands

```bash
# Test email service configuration
node -e "console.log(process.env.RESEND_API_KEY ? 'API key configured' : 'Missing API key')"

# Test template rendering
pnpm test src/components/emails/__tests__/welcome-email.test.tsx

# Check API endpoint
curl -X POST http://localhost:3000/api/emails/test \
  -H "Content-Type: application/json" \
  -d '{"testEmail":"test@example.com","templateType":"welcome"}'
```

## Future Enhancements

### Planned Features
- Email template editor in admin panel
- A/B testing for email templates
- Advanced analytics and reporting
- Email preference management
- Automated email sequences

### Scalability Improvements
- Queue-based email processing
- Multiple email service providers
- Advanced retry mechanisms
- Email template versioning

## Support

For issues with the email system:
1. Check this documentation
2. Review error logs and console output
3. Test with the admin email panel
4. Contact the development team

## API Reference

### Email Types
- `welcome`: Welcome email for new users
- `purchase_receipt`: Purchase receipt email
- `purchase_confirmation`: Purchase confirmation email
- `password_reset`: Password reset email
- `security_notification`: Security event notification
- `admin_purchase_approval`: Admin purchase approval notification

### Response Format
```json
{
  "success": true,
  "message": "Email sent successfully",
  "id": "resend-message-id"
}
```

### Error Format
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```