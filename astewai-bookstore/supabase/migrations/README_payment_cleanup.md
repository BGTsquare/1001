# Payment System Cleanup Migration

This directory contains migration scripts to simplify the Astewai Bookstore payment system by removing complex Telegram bot integration and focusing on manual payment processing.

## Overview

The cleanup migration removes unnecessary complexity from the payment system while preserving the core manual payment functionality that is already working well.

## Migration Files

### 1. `20250124_payment_system_cleanup.sql`
**Main cleanup migration** - Removes Telegram integration and simplifies the system.

**What it does:**
- ✅ Creates backup tables for safety
- ✅ Removes `purchase_screenshots` table (Telegram payment proof)
- ✅ Removes `reading_tokens` table (Telegram secure access)
- ✅ Removes Telegram columns from `purchases` table:
  - `telegram_chat_id`
  - `telegram_user_id` 
  - `initiation_token`
  - `amount_in_birr`
- ✅ Simplifies purchase status constraint to: `pending`, `approved`, `rejected`, `completed`
- ✅ Updates existing complex status values to simplified ones
- ✅ Verifies `purchase_requests` table integrity
- ✅ Updates table comments and documentation
- ✅ Provides comprehensive verification output

### 2. `20250124_payment_system_cleanup_rollback.sql`
**Rollback migration** - Restores the system to its previous state if needed.

**What it does:**
- ✅ Recreates dropped tables from backups
- ✅ Restores dropped columns to purchases table
- ✅ Restores original status constraints
- ✅ Restores data from backup tables
- ✅ Restores original comments and documentation

## Before Running the Migration

### Prerequisites
1. **Database backup** - Always create a full database backup before running
2. **Test environment** - Run on staging/test environment first
3. **Application downtime** - Plan for brief downtime during migration
4. **Verification** - Ensure `purchase_requests` table exists and is populated

### Current System Check
Run these queries to understand your current state:

```sql
-- Check table existence
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('purchases', 'purchase_requests', 'purchase_screenshots', 'reading_tokens', 'payment_config');

-- Check purchases table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'purchases' ORDER BY ordinal_position;

-- Check current purchase statuses
SELECT status, COUNT(*) FROM purchases GROUP BY status;

-- Check purchase_requests data
SELECT status, COUNT(*) FROM purchase_requests GROUP BY status;
```

## Running the Migration

### Step 1: Apply Cleanup Migration
```bash
# Using Supabase CLI
supabase db push

# Or apply directly in Supabase Dashboard SQL Editor
# Copy and paste the contents of 20250124_payment_system_cleanup.sql
```

### Step 2: Verify Results
The migration includes built-in verification that will output:
- Backup table creation confirmations
- Column removal confirmations  
- Table drop confirmations
- Final verification status

Look for these success messages:
- `✓ purchase_screenshots table successfully removed`
- `✓ reading_tokens table successfully removed`
- `✓ telegram_chat_id column successfully removed from purchases`
- `✓ telegram_user_id column successfully removed from purchases`
- `✓ initiation_token column successfully removed from purchases`
- `✓ amount_in_birr column successfully removed from purchases`
- `CLEANUP COMPLETED SUCCESSFULLY!`

### Step 3: Test Manual Payment System
After migration, test the core functionality:
1. User can create purchase requests
2. Payment instructions are displayed correctly
3. Admin can approve/reject requests
4. Purchase status updates work correctly

## If Something Goes Wrong

### Rollback Process
If you need to restore the previous system:

```bash
# Apply rollback migration
# Copy and paste contents of 20250124_payment_system_cleanup_rollback.sql
```

**Note:** Rollback only works if the backup tables exist. The cleanup migration creates these automatically.

### Manual Recovery
If rollback fails, you can manually restore from your database backup:
1. Restore full database from backup
2. Identify what went wrong
3. Fix the issue before re-attempting

## After Migration Success

### Immediate Next Steps
1. **Verify manual payment flow** works end-to-end
2. **Update application code** (Phase 2) to remove Telegram references
3. **Remove unused dependencies** from package.json
4. **Update documentation** to reflect simplified system

### Cleanup Backup Tables (Optional)
After confirming everything works (recommend waiting 1-2 weeks):

```sql
-- Remove backup tables to free up space
DROP TABLE IF EXISTS purchases_backup_20250124;
DROP TABLE IF EXISTS purchase_screenshots_backup_20250124;
DROP TABLE IF EXISTS reading_tokens_backup_20250124;
```

## What Remains After Cleanup

### Core Tables (Kept)
- ✅ `purchase_requests` - Primary table for manual payment system
- ✅ `payment_config` - Bank account and mobile money configuration
- ✅ `purchases` - Simplified legacy table (consider migrating data to purchase_requests)

### Core Functionality (Preserved)
- ✅ Manual payment request creation
- ✅ Payment instructions display
- ✅ Admin approval dashboard
- ✅ Purchase status tracking
- ✅ User purchase history
- ✅ Payment method configuration

### Removed Complexity
- ❌ Telegram bot integration
- ❌ Complex purchase status workflow
- ❌ Payment proof screenshot handling
- ❌ Secure token generation for external access
- ❌ Currency conversion complexity
- ❌ Multiple parallel payment flows

## Support

If you encounter issues:
1. Check the verification output from the migration
2. Review the backup tables to understand what was changed
3. Use the rollback migration if needed
4. Consult the application logs for any related errors

The migration is designed to be safe and reversible, with comprehensive logging and verification at each step.
