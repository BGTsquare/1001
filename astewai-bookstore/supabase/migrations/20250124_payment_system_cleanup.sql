-- Payment System Cleanup Migration
-- Removes Telegram integration and simplifies payment system to manual-only
-- Created: 2025-01-24
-- Purpose: Simplify payment system by removing complex Telegram bot integration

-- =============================================================================
-- BACKUP AND SAFETY CHECKS
-- =============================================================================

-- Create backup tables before making changes
DO $$
BEGIN
    -- Backup purchases table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchases') THEN
        DROP TABLE IF EXISTS purchases_backup_20250124;
        CREATE TABLE purchases_backup_20250124 AS SELECT * FROM purchases;
        RAISE NOTICE 'Created backup: purchases_backup_20250124 with % rows', 
            (SELECT COUNT(*) FROM purchases_backup_20250124);
    END IF;

    -- Backup purchase_screenshots if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_screenshots') THEN
        DROP TABLE IF EXISTS purchase_screenshots_backup_20250124;
        CREATE TABLE purchase_screenshots_backup_20250124 AS SELECT * FROM purchase_screenshots;
        RAISE NOTICE 'Created backup: purchase_screenshots_backup_20250124 with % rows', 
            (SELECT COUNT(*) FROM purchase_screenshots_backup_20250124);
    END IF;

    -- Backup reading_tokens if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reading_tokens') THEN
        DROP TABLE IF EXISTS reading_tokens_backup_20250124;
        CREATE TABLE reading_tokens_backup_20250124 AS SELECT * FROM reading_tokens;
        RAISE NOTICE 'Created backup: reading_tokens_backup_20250124 with % rows', 
            (SELECT COUNT(*) FROM reading_tokens_backup_20250124);
    END IF;
END $$;

-- =============================================================================
-- PHASE 1: REMOVE TELEGRAM-RELATED TABLES
-- =============================================================================

-- Drop purchase_screenshots table (used for Telegram bot payment proof)
DROP TABLE IF EXISTS purchase_screenshots CASCADE;

-- Drop reading_tokens table (used for secure book access via Telegram)
DROP TABLE IF EXISTS reading_tokens CASCADE;

-- =============================================================================
-- PHASE 2: CLEAN UP PURCHASES TABLE
-- =============================================================================

-- Remove Telegram-specific columns from purchases table
DO $$
BEGIN
    -- Remove telegram_chat_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' AND column_name = 'telegram_chat_id'
    ) THEN
        ALTER TABLE purchases DROP COLUMN telegram_chat_id;
        RAISE NOTICE 'Removed column: purchases.telegram_chat_id';
    END IF;

    -- Remove telegram_user_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' AND column_name = 'telegram_user_id'
    ) THEN
        ALTER TABLE purchases DROP COLUMN telegram_user_id;
        RAISE NOTICE 'Removed column: purchases.telegram_user_id';
    END IF;

    -- Remove initiation_token column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' AND column_name = 'initiation_token'
    ) THEN
        ALTER TABLE purchases DROP COLUMN initiation_token;
        RAISE NOTICE 'Removed column: purchases.initiation_token';
    END IF;

    -- Remove amount_in_birr column (redundant with amount)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' AND column_name = 'amount_in_birr'
    ) THEN
        ALTER TABLE purchases DROP COLUMN amount_in_birr;
        RAISE NOTICE 'Removed column: purchases.amount_in_birr';
    END IF;
END $$;

-- =============================================================================
-- PHASE 3: SIMPLIFY PURCHASE STATUS CONSTRAINTS
-- =============================================================================

-- Update purchase status constraint to focus on manual payment workflow
DO $$
BEGIN
    -- Drop existing status constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'purchases' AND constraint_name = 'purchases_status_check'
    ) THEN
        ALTER TABLE purchases DROP CONSTRAINT purchases_status_check;
        RAISE NOTICE 'Dropped existing status constraint: purchases_status_check';
    END IF;

    -- Add simplified status constraint for manual payments only
    ALTER TABLE purchases ADD CONSTRAINT purchases_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed'));

    RAISE NOTICE 'Added simplified status constraint: pending, approved, rejected, completed';
END $$;

-- Update any existing complex status values to simplified ones
UPDATE purchases
SET status = CASE
    WHEN status IN ('pending_initiation', 'awaiting_payment', 'pending_verification') THEN 'pending'
    WHEN status = 'approved' THEN 'approved'
    WHEN status = 'rejected' THEN 'rejected'
    WHEN status = 'completed' THEN 'completed'
    ELSE 'pending'
END
WHERE status NOT IN ('pending', 'approved', 'rejected', 'completed');

-- =============================================================================
-- PHASE 4: ENSURE PURCHASE_REQUESTS IS PRIMARY TABLE
-- =============================================================================

-- Verify purchase_requests table exists and has correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_requests') THEN
        RAISE EXCEPTION 'purchase_requests table does not exist. This table is required for the manual payment system.';
    END IF;

    -- Verify essential columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'purchase_requests' AND column_name = 'status'
    ) THEN
        RAISE EXCEPTION 'purchase_requests table missing status column';
    END IF;

    RAISE NOTICE 'Verified purchase_requests table structure is correct';
END $$;

-- =============================================================================
-- PHASE 5: CLEANUP COMMENTS AND DOCUMENTATION
-- =============================================================================

-- Update table comments to reflect simplified system
COMMENT ON TABLE purchases IS 'Legacy purchase records - consider migrating to purchase_requests for new manual payment system';
COMMENT ON TABLE purchase_requests IS 'Primary table for manual payment system - handles user purchase requests and admin approval workflow';
COMMENT ON TABLE payment_config IS 'Configuration for manual payment methods (bank accounts, mobile money) - used by manual payment system';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify cleanup was successful
DO $$
DECLARE
    purchases_count INTEGER;
    purchase_requests_count INTEGER;
    payment_config_count INTEGER;
BEGIN
    -- Count records in main tables
    SELECT COUNT(*) INTO purchases_count FROM purchases;
    SELECT COUNT(*) INTO purchase_requests_count FROM purchase_requests;
    SELECT COUNT(*) INTO payment_config_count FROM payment_config;

    RAISE NOTICE 'CLEANUP VERIFICATION:';
    RAISE NOTICE '- purchases table: % records', purchases_count;
    RAISE NOTICE '- purchase_requests table: % records', purchase_requests_count;
    RAISE NOTICE '- payment_config table: % records', payment_config_count;

    -- Verify Telegram tables are gone
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_screenshots') THEN
        RAISE WARNING 'purchase_screenshots table still exists!';
    ELSE
        RAISE NOTICE '✓ purchase_screenshots table successfully removed';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reading_tokens') THEN
        RAISE WARNING 'reading_tokens table still exists!';
    ELSE
        RAISE NOTICE '✓ reading_tokens table successfully removed';
    END IF;

    -- Verify Telegram columns are gone from purchases
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'telegram_chat_id') THEN
        RAISE WARNING 'telegram_chat_id column still exists in purchases table!';
    ELSE
        RAISE NOTICE '✓ telegram_chat_id column successfully removed from purchases';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'telegram_user_id') THEN
        RAISE WARNING 'telegram_user_id column still exists in purchases table!';
    ELSE
        RAISE NOTICE '✓ telegram_user_id column successfully removed from purchases';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'initiation_token') THEN
        RAISE WARNING 'initiation_token column still exists in purchases table!';
    ELSE
        RAISE NOTICE '✓ initiation_token column successfully removed from purchases';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'amount_in_birr') THEN
        RAISE WARNING 'amount_in_birr column still exists in purchases table!';
    ELSE
        RAISE NOTICE '✓ amount_in_birr column successfully removed from purchases';
    END IF;

    RAISE NOTICE 'CLEANUP COMPLETED SUCCESSFULLY!';
END $$;
