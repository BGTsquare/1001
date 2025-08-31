# Phase 2: Code Cleanup Plan
## Payment System Simplification - Code Removal

After completing Phase 1 (Database Cleanup), this phase removes unnecessary code, components, and dependencies to complete the payment system simplification.

## 🎯 Objectives
- Remove Telegram bot integration code
- Remove unused payment service references (Chapa, Stripe)
- Simplify purchase flow components
- Clean up API routes and services
- Remove unused dependencies

## 📁 Files and Directories to Remove

### 1. Telegram Bot Integration (Complete Removal)

#### **A. Telegram Bot Directory**
```
telegram-bot/                          # REMOVE ENTIRE DIRECTORY
├── src/
├── package.json
├── README.md
└── All bot-related files
```

#### **B. Telegram API Routes**
```
src/app/api/telegram/                   # REMOVE ENTIRE DIRECTORY
├── webhook/route.ts
├── purchase-info/route.ts
└── Any other telegram routes
```

#### **C. Telegram Services**
```
src/lib/services/
├── telegram-service.ts                # REMOVE
├── telegram-webhook-handler.ts        # REMOVE
├── telegram-purchase-service.ts       # REMOVE
├── telegram-message-builder.ts        # REMOVE
├── telegram-command-handler.ts        # REMOVE
├── telegram-service-factory.ts        # REMOVE
└── telegram-commands/                 # REMOVE ENTIRE DIRECTORY
    ├── help-command.ts
    ├── order-status-command.ts
    └── start-command.ts
```

#### **D. Telegram Configuration**
```
src/lib/config/
├── telegram-config.ts                 # REMOVE
```

#### **E. Telegram Types**
```
src/lib/types/
├── telegram.ts                        # REMOVE
```

#### **F. Telegram Tests**
```
src/lib/services/__tests__/
├── telegram-purchase-service.test.ts  # REMOVE
└── Any other telegram-related tests
```

#### **G. Telegram Scripts**
```
scripts/
├── test-telegram-webhook.js           # REMOVE
├── setup-telegram-bot.js              # REMOVE
└── Any other telegram scripts
```

### 2. Unused Payment Services

#### **A. Chapa Service References**
```
src/lib/services/
├── chapa.ts                           # REMOVE (if exists)
└── Any chapa-related files
```

#### **B. Stripe Integration Placeholders**
```
src/lib/services/
├── stripe.ts                          # REMOVE (if exists)
└── Any stripe-related files
```

### 3. Complex Purchase Flow Components

#### **A. Telegram Purchase Components**
```
src/components/purchases/
├── telegram-purchase-button.tsx       # REMOVE (if exists)
└── Any telegram-specific purchase components
```

#### **B. Bundle Actions with Telegram**
```
src/components/bundles/
├── bundle-actions.tsx                 # MODIFY (remove Telegram flow)
```

#### **C. Book Actions with Telegram**
```
src/hooks/
├── use-book-actions.ts                # MODIFY (remove Telegram flow)
```

### 4. API Routes to Clean Up

#### **A. Purchase API Routes**
```
src/app/api/purchases/
├── initiate-telegram/route.ts         # REMOVE
└── Any other telegram-specific routes
```

#### **B. Payment Configuration Routes**
```
src/app/api/payments/
├── config/route.ts                    # MODIFY (remove bot authentication)
```

### 5. Configuration Files

#### **A. Environment Variables**
Remove from `.env.example` and documentation:
```
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_NAME=
TELEGRAM_ADMIN_CHANNEL_ID=
TELEGRAM_BOT_SECRET=
```

#### **B. Configuration Services**
```
src/lib/config/
├── env.ts                             # MODIFY (remove telegram config)
```

### 6. Documentation Files

#### **A. Telegram-Specific Documentation**
```
TELEGRAM_BOT_SETUP.md                  # REMOVE
COMPLETE_FIX.md                        # REMOVE (if telegram-specific)
test_telegram_integration.md           # REMOVE
```

#### **B. Update Existing Documentation**
```
README.md                              # MODIFY (remove Telegram references)
PAYMENT_APPROVAL_SUMMARY.md           # MODIFY (update to reflect simplified system)
```

## 🔧 Files to Modify (Not Remove)

### 1. Core Purchase Components
```
src/components/payments/
├── simple-purchase-button.tsx         # KEEP & ENHANCE (make primary)
├── manual-payment-instructions.tsx    # KEEP (core functionality)
└── payment-history.tsx               # KEEP (user purchase tracking)
```

### 2. Admin Components
```
src/components/admin/
├── payment-approval-dashboard.tsx     # KEEP (core admin functionality)
├── payment-request-card.tsx          # KEEP
└── payment-request-details.tsx       # KEEP
```

### 3. Services to Simplify
```
src/lib/services/
├── purchase-service.ts               # MODIFY (remove Telegram methods)
├── payment-config-service.ts         # KEEP (core manual payment config)
└── Any services with Telegram references
```

### 4. Database Types
```
src/lib/types/
├── payment.ts                        # MODIFY (remove Chapa references)
└── database.ts                       # MODIFY (remove Telegram table types)
```

## 📋 Step-by-Step Execution Plan

### Step 1: Remove Telegram Bot Directory
```bash
# Remove entire telegram bot
rm -rf telegram-bot/
```

### Step 2: Remove Telegram API Routes
```bash
# Remove telegram API directory
rm -rf src/app/api/telegram/
```

### Step 3: Remove Telegram Services
```bash
# Remove individual telegram service files
rm src/lib/services/telegram-*.ts
rm -rf src/lib/services/telegram-commands/
```

### Step 4: Remove Telegram Configuration
```bash
# Remove telegram config files
rm src/lib/config/telegram-config.ts
rm src/lib/types/telegram.ts
```

### Step 5: Remove Telegram Tests
```bash
# Remove telegram test files
rm src/lib/services/__tests__/telegram-*.test.ts
```

### Step 6: Remove Scripts and Documentation
```bash
# Remove telegram scripts
rm scripts/*telegram*
rm scripts/setup-telegram-bot.js

# Remove telegram documentation
rm TELEGRAM_BOT_SETUP.md
rm test_telegram_integration.md
rm COMPLETE_FIX.md
```

### Step 7: Clean Up Package Dependencies
```bash
# Check for telegram-related dependencies
npm ls | grep telegram

# Remove any telegram-specific packages (if any)
# npm uninstall <telegram-package-name>
```

### Step 8: Modify Existing Files
1. **Update `src/components/bundles/bundle-actions.tsx`**
   - Remove Telegram purchase flow
   - Use only `SimplePurchaseButton`

2. **Update `src/hooks/use-book-actions.ts`**
   - Remove Telegram purchase logic
   - Simplify to manual payment only

3. **Update `src/lib/services/purchase-service.ts`**
   - Remove `initiateTelegramPurchase` method
   - Remove Telegram-related interfaces
   - Keep only manual purchase methods

4. **Update `src/lib/config/env.ts`**
   - Remove Telegram configuration
   - Clean up environment variable definitions

5. **Update `src/lib/types/payment.ts`**
   - Remove Chapa payment method references
   - Keep only 'manual' payment method

6. **Update `src/lib/types/database.ts`**
   - Remove Telegram table type definitions
   - Update purchases table type to reflect simplified schema

### Step 9: Update Documentation
1. **Update `README.md`**
   - Remove Telegram bot references
   - Update feature list to reflect manual-only payments
   - Update tech stack (remove Telegram)

2. **Update `PAYMENT_APPROVAL_SUMMARY.md`**
   - Focus on manual payment system only
   - Remove Telegram integration references

## ✅ Verification Checklist

After completing Phase 2:

### Build and Type Checking
- [ ] `npm run build` succeeds without errors
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes

### Functionality Testing
- [ ] Manual purchase flow works end-to-end
- [ ] Payment approval dashboard functions correctly
- [ ] No broken imports or missing dependencies
- [ ] All tests pass (`npm test`)

### Code Quality
- [ ] No unused imports remain
- [ ] No dead code references to removed services
- [ ] TypeScript types are consistent
- [ ] ESLint warnings are resolved

## 🎉 Expected Results

After Phase 2 completion:

### Simplified Architecture
```
Manual Payment System:
├── User Flow: SimplePurchaseButton → ManualPaymentInstructions → Admin Approval
├── Admin Flow: PaymentApprovalDashboard → Approve/Reject
├── Backend: purchase_requests table + payment_config table
└── APIs: Simple CRUD operations only
```

### Reduced Complexity
- **~50% fewer files** in the payment system
- **Simpler codebase** with single payment flow
- **Easier maintenance** with fewer dependencies
- **Better performance** without unused code
- **Clearer user experience** with consistent manual flow

### Maintained Functionality
- ✅ Manual payment requests
- ✅ Admin approval workflow  
- ✅ Payment method configuration
- ✅ Purchase history tracking
- ✅ User notifications
- ✅ Ethiopian payment methods (Telebirr, CBE, etc.)

The system will be significantly simpler while maintaining all essential manual payment functionality.
