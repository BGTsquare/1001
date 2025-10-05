# 🚀 New Simplified Payment System Setup Guide

## 📋 **Overview**

This guide will help you set up the new simplified payment system that replaces the old Telegram-based payment workflow with:

- ✅ **Deep-link wallet integration** (no callbacks expected)
- ✅ **Manual TX ID entry** with fallback
- ✅ **OCR receipt processing** for automatic data extraction
- ✅ **Auto-matching rules** for intelligent payment verification
- ✅ **Admin verification dashboard** for manual review

## 🗄️ **Database Migration**

### Step 1: Apply New Database Schema

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** → **New Query**

2. **Execute Migration Script**
   - Copy the entire content of `NEW_PAYMENT_SYSTEM_MIGRATION.sql`
   - Paste into SQL Editor
   - Click **"Run"**

3. **Verify Migration Success**
   - Check that all new tables were created:
     - `wallet_config`
     - `payment_requests`
     - `payment_verification_logs`
     - `auto_matching_rules`
   - Verify storage bucket `payment-receipts` was created
   - Confirm all functions and triggers are in place

## 🔧 **Environment Configuration**

### Step 2: Update Environment Variables

Add these new environment variables to your `.env.local` and Vercel:

```env
# OCR Configuration (Optional - for enhanced OCR processing)
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here
AZURE_COGNITIVE_ENDPOINT=your_azure_cognitive_endpoint
AZURE_COGNITIVE_KEY=your_azure_cognitive_key

# Payment System Configuration
PAYMENT_AUTO_MATCH_THRESHOLD=0.7
PAYMENT_OCR_CONFIDENCE_THRESHOLD=0.6
```

### Step 3: Install Dependencies

```bash
cd astewai-bookstore
npm install tesseract.js@^5.0.4
```

## 🎯 **Payment System Features**

### **1. Wallet Deep-Link Integration**

The system supports multiple wallet types with deep-link templates:

- **Mobile Money**: Telebirr, M-Birr, Chapa
- **Bank Apps**: CBE Mobile, Dashen Mobile
- **Crypto**: Bitcoin, Ethereum (extensible)

**Example Deep-Link Templates:**
```
telebirr://send?amount={amount}&reference={reference}
mbirr://transfer?amount={amount}&ref={reference}
cbe://transfer?amount={amount}&reference={reference}
```

### **2. OCR Receipt Processing**

Automatic text extraction from uploaded receipts with:
- **Multiple OCR Providers**: Tesseract.js (client-side), Google Vision API, Azure Cognitive Services
- **Pattern Recognition**: Extracts TX IDs and amounts using regex patterns
- **Confidence Scoring**: Calculates reliability of extracted data
- **Fallback Support**: Graceful degradation when OCR fails

### **3. Auto-Matching Rules Engine**

Intelligent payment verification using configurable rules:

- **Amount Matching**: Exact or tolerance-based amount verification
- **TX ID Pattern Matching**: Regex-based transaction ID validation
- **Time Window Matching**: Payment completion within expected timeframe
- **User History**: Bonus confidence for returning customers

### **4. Admin Verification Dashboard**

Comprehensive admin interface for:
- **Payment Review**: View all payment requests with filtering
- **Manual Verification**: Approve/reject payments with notes
- **Statistics**: Real-time payment analytics and metrics
- **Audit Trail**: Complete verification history and logs

## 🚀 **Usage Examples**

### **User Payment Flow**

1. **User clicks "Purchase" button**
2. **Selects wallet** (Telebirr, M-Birr, etc.)
3. **System generates deep-link** and opens wallet app
4. **User completes payment** in their wallet
5. **User returns to app** and submits TX ID
6. **System processes** with OCR and auto-matching
7. **Admin reviews** if auto-matching fails
8. **Payment approved** and item added to library

### **Admin Verification Flow**

1. **Access admin dashboard** at `/admin/payments`
2. **Filter payment requests** by status, wallet type, etc.
3. **Review payment details** including OCR results
4. **Verify using multiple methods**:
   - Manual review
   - Bank statement check
   - SMS verification
5. **Approve or reject** with notes
6. **System updates** payment status and user library

## 🔧 **API Endpoints**

### **User Endpoints**

```typescript
// Initiate payment
POST /api/payments/initiate
{
  "item_type": "book" | "bundle",
  "item_id": "uuid",
  "amount": number,
  "currency": "ETB",
  "selected_wallet_id": "uuid"
}

// Record deep link click
POST /api/payments/{id}/deep-link-click

// Submit transaction ID
POST /api/payments/{id}/submit-tx-id
{
  "tx_id": "string",
  "amount": number
}

// Upload receipt
POST /api/payments/{id}/upload-receipt
// FormData with file

// Get active wallets
GET /api/payments/wallets
```

### **Admin Endpoints**

```typescript
// Get payment requests
GET /api/admin/payments?status=pending&wallet_type=mobile_money

// Verify payment
POST /api/admin/payments/{id}/verify
{
  "verification_method": "manual" | "bank_statement" | "sms_verification",
  "approve": boolean,
  "notes": "string"
}

// Get payment statistics
GET /api/admin/payments/stats
```

## 🎨 **UI Components**

### **PaymentButton Component**

```tsx
import { PaymentButton } from '@/components/payments/payment-button'

<PaymentButton
  item={book}
  itemType="book"
  onPaymentInitiated={(payment) => console.log('Payment initiated:', payment)}
  onPaymentCompleted={(payment) => console.log('Payment completed:', payment)}
/>
```

### **Admin Dashboard**

```tsx
import { PaymentDashboard } from '@/components/admin/payment-dashboard'

<PaymentDashboard />
```

## 🔍 **Testing the System**

### **1. Test Payment Flow**

1. **Create a test book** in admin panel
2. **Initiate payment** as a regular user
3. **Select wallet** and click deep-link
4. **Submit fake TX ID** for testing
5. **Check admin dashboard** for the request
6. **Verify payment** as admin
7. **Confirm item** added to user library

### **2. Test OCR Processing**

1. **Upload receipt image** with visible TX ID and amount
2. **Check OCR results** in payment details
3. **Verify auto-matching** works correctly
4. **Test with poor quality images** to see fallback behavior

### **3. Test Auto-Matching Rules**

1. **Create test payments** with known amounts
2. **Submit TX IDs** matching configured patterns
3. **Verify auto-approval** works for high-confidence matches
4. **Test edge cases** with mismatched amounts or invalid patterns

## 📊 **Monitoring and Analytics**

### **Key Metrics to Monitor**

- **Payment Success Rate**: Percentage of completed payments
- **Auto-Match Rate**: Percentage of payments auto-verified
- **Average Processing Time**: Time from initiation to completion
- **OCR Accuracy**: Success rate of text extraction
- **Wallet Usage**: Most popular payment methods

### **Admin Dashboard Features**

- **Real-time Statistics**: Live payment metrics
- **Filtering and Search**: Find specific payments quickly
- **Bulk Operations**: Process multiple payments at once
- **Audit Trail**: Complete history of all verification actions
- **Export Functionality**: Download payment reports

## 🛠️ **Customization Options**

### **Adding New Wallets**

1. **Add wallet config** to database:
```sql
INSERT INTO wallet_config (wallet_name, wallet_type, deep_link_template, tx_id_pattern, is_active, display_order, instructions)
VALUES ('New Wallet', 'mobile_money', 'newwallet://pay?amount={amount}&ref={reference}', '^[A-Z0-9]{10,15}$', true, 6, 'Send payment via New Wallet');
```

2. **Update wallet icons** in UI components
3. **Test deep-link integration**

### **Customizing Auto-Matching Rules**

1. **Modify rules** in database:
```sql
UPDATE auto_matching_rules 
SET conditions = '{"base_confidence": 0.8, "tolerance_percentage": 3}'
WHERE rule_name = 'Amount Match with 5% Tolerance';
```

2. **Add new rule types** by extending the service
3. **Adjust confidence thresholds** based on your needs

### **OCR Pattern Customization**

Update regex patterns in `ocr-service.ts`:

```typescript
const DEFAULT_CONFIG: OCRConfig = {
  tx_id_patterns: [
    'transaction[\\s#:]*([A-Z0-9]{8,20})',
    'ref[\\s#:]*([A-Z0-9]{8,20})',
    // Add your custom patterns here
  ],
  amount_patterns: [
    'amount[\\s#:]*([0-9,]+\\.[0-9]{2})',
    'total[\\s#:]*([0-9,]+\\.[0-9]{2})',
    // Add your custom patterns here
  ]
}
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Deep-links not working**
   - Check wallet app is installed
   - Verify deep-link template format
   - Test with different browsers/devices

2. **OCR not extracting data**
   - Check image quality and format
   - Verify regex patterns match your receipt format
   - Test with different OCR providers

3. **Auto-matching not working**
   - Check rule configuration in database
   - Verify confidence thresholds
   - Review verification logs

4. **Admin dashboard not loading**
   - Check user has admin role
   - Verify API endpoints are accessible
   - Check browser console for errors

### **Debug Mode**

Enable debug logging by setting:
```env
DEBUG_PAYMENTS=true
```

This will log detailed information about:
- Payment initiation
- OCR processing
- Auto-matching decisions
- Admin verification actions

## 📞 **Support**

If you encounter issues:

1. **Check the logs** in Supabase dashboard
2. **Review verification logs** in the database
3. **Test with debug mode** enabled
4. **Check browser console** for client-side errors
5. **Verify environment variables** are set correctly

## 🎉 **Success Checklist**

After setup, verify these features work:

- ✅ Users can initiate payments with wallet selection
- ✅ Deep-links open wallet apps correctly
- ✅ Manual TX ID submission works
- ✅ Receipt upload and OCR processing functions
- ✅ Auto-matching rules approve high-confidence payments
- ✅ Admin dashboard shows all payment requests
- ✅ Admin can verify payments manually
- ✅ Completed payments add items to user library
- ✅ Statistics and analytics are accurate

Your new simplified payment system is now ready for production! 🚀


