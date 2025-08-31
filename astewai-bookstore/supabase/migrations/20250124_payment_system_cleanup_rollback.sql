-- Payment System Cleanup Rollback Migration
-- Restores Telegram integration and complex payment system
-- Created: 2025-01-24
-- Purpose: Rollback the payment system cleanup if needed

-- =============================================================================
-- ROLLBACK INSTRUCTIONS
-- =============================================================================
-- This script will restore the system to its previous state by:
-- 1. Recreating the dropped tables from backups
-- 2. Restoring the dropped columns to the purchases table
-- 3. Restoring the original status constraints
-- 
-- WARNING: Only run this if you have the backup tables created by the cleanup migration!

-- =============================================================================
-- PHASE 1: RESTORE TELEGRAM-RELATED TABLES
-- =============================================================================

-- Restore purchase_screenshots table from backup
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_screenshots_backup_20250124') THEN
        -- Recreate the table structure
        CREATE TABLE purchase_screenshots (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
            telegram_file_id TEXT NOT NULL,
            uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Restore data from backup
        INSERT INTO purchase_screenshots SELECT * FROM purchase_screenshots_backup_20250124;
        
        RAISE NOTICE 'Restored purchase_screenshots table with % rows', 
            (SELECT COUNT(*) FROM purchase_screenshots);
    ELSE
        RAISE WARNING 'No backup found for purchase_screenshots table';
    END IF;
END $$;

-- Restore reading_tokens table from backup
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reading_tokens_backup_20250124') THEN
        -- Recreate the table structure
        CREATE TABLE reading_tokens (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
            token TEXT NOT NULL UNIQUE,
            item_id UUID NOT NULL,
            item_type TEXT NOT NULL CHECK (item_type IN ('book', 'bundle')),
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Restore data from backup
        INSERT INTO reading_tokens SELECT * FROM reading_tokens_backup_20250124;
        
        RAISE NOTICE 'Restored reading_tokens table with % rows', 
            (SELECT COUNT(*) FROM reading_tokens);
    ELSE
        RAISE WARNING 'No backup found for reading_tokens table';
    END IF;
END $$;

-- =============================================================================
-- PHASE 2: RESTORE PURCHASES TABLE COLUMNS
-- =============================================================================

-- Restore Telegram-specific columns to purchases table
DO $$
BEGIN
    -- Add telegram_chat_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' AND column_name = 'telegram_chat_id'
    ) THEN
        ALTER TABLE purchases ADD COLUMN telegram_chat_id BIGINT;
        RAISE NOTICE 'Restored column: purchases.telegram_chat_id';
    END IF;

    -- Add telegram_user_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' AND column_name = 'telegram_user_id'
    ) THEN
        ALTER TABLE purchases ADD COLUMN telegram_user_id BIGINT;
        RAISE NOTICE 'Restored column: purchases.telegram_user_id';
    END IF;

    -- Add initiation_token column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' AND column_name = 'initiation_token'
    ) THEN
        ALTER TABLE purchases ADD COLUMN initiation_token TEXT;
        RAISE NOTICE 'Restored column: purchases.initiation_token';
    END IF;

    -- Add amount_in_birr column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' AND column_name = 'amount_in_birr'
    ) THEN
        ALTER TABLE purchases ADD COLUMN amount_in_birr DECIMAL(10,2);
        RAISE NOTICE 'Restored column: purchases.amount_in_birr';
    END IF;
END $$;

-- =============================================================================
-- PHASE 3: RESTORE ORIGINAL STATUS CONSTRAINTS
-- =============================================================================

-- Restore complex purchase status constraint
DO $$
BEGIN
    -- Drop simplified status constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'purchases' AND constraint_name = 'purchases_status_check'
    ) THEN
        ALTER TABLE purchases DROP CONSTRAINT purchases_status_check;
        RAISE NOTICE 'Dropped simplified status constraint';
    END IF;

    -- Add original complex status constraint
    ALTER TABLE purchases ADD CONSTRAINT purchases_status_check
    CHECK (status IN ('pending_initiation', 'awaiting_payment', 'pending_verification', 'completed', 'rejected', 'pending', 'approved'));

    RAISE NOTICE 'Restored original status constraint with complex statuses';
END $$;

-- =============================================================================
-- PHASE 4: RESTORE DATA FROM BACKUP
-- =============================================================================

-- Restore original purchases data if backup exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchases_backup_20250124') THEN
        -- Clear current purchases data
        DELETE FROM purchases;

        -- Restore from backup (this will restore all original columns and data)
        INSERT INTO purchases SELECT * FROM purchases_backup_20250124;

        RAISE NOTICE 'Restored purchases table data from backup with % rows',
            (SELECT COUNT(*) FROM purchases);
    ELSE
        RAISE WARNING 'No backup found for purchases table - data may be incomplete';
    END IF;
END $$;

-- =============================================================================
-- PHASE 5: RESTORE COMMENTS
-- =============================================================================

-- Restore original table comments
COMMENT ON TABLE purchases IS 'Purchase status: pending_initiation, awaiting_payment, pending_verification, completed, rejected';
COMMENT ON COLUMN purchases.telegram_chat_id IS 'Telegram chat ID for bot communication';
COMMENT ON COLUMN purchases.telegram_user_id IS 'Telegram user ID for bot user identification';
COMMENT ON COLUMN purchases.initiation_token IS 'Single-use token for secure Telegram bot linking';
COMMENT ON COLUMN purchases.amount_in_birr IS 'Purchase amount converted to Ethiopian Birr';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'ROLLBACK VERIFICATION:';

    -- Verify tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_screenshots') THEN
        RAISE NOTICE '✓ purchase_screenshots table restored';
    ELSE
        RAISE WARNING '✗ purchase_screenshots table not found';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reading_tokens') THEN
        RAISE NOTICE '✓ reading_tokens table restored';
    ELSE
        RAISE WARNING '✗ reading_tokens table not found';
    END IF;

    -- Verify columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'telegram_chat_id') THEN
        RAISE NOTICE '✓ telegram_chat_id column restored';
    ELSE
        RAISE WARNING '✗ telegram_chat_id column not found';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'telegram_user_id') THEN
        RAISE NOTICE '✓ telegram_user_id column restored';
    ELSE
        RAISE WARNING '✗ telegram_user_id column not found';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'initiation_token') THEN
        RAISE NOTICE '✓ initiation_token column restored';
    ELSE
        RAISE WARNING '✗ initiation_token column not found';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'amount_in_birr') THEN
        RAISE NOTICE '✓ amount_in_birr column restored';
    ELSE
        RAISE WARNING '✗ amount_in_birr column not found';
    END IF;

    RAISE NOTICE 'ROLLBACK COMPLETED!';
END $$;
