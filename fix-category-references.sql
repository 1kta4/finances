-- =====================================================
-- FIX CATEGORY REFERENCES IN TRANSACTIONS
-- =====================================================
-- This script will:
-- 1. Show what needs to be fixed
-- 2. Update transactions to use correct Supabase category IDs
-- 3. Add foreign key constraint back
--
-- ✅ YOUR DATA IS SAFE - only category_id references will be updated
-- =====================================================

-- =====================================================
-- STEP 1: DIAGNOSTIC - Check current state
-- =====================================================

-- Check all categories in Supabase
-- (Run this first to see what categories exist)
SELECT
    id,
    name,
    type,
    is_custom,
    user_id
FROM categories
ORDER BY type, name;

-- Check transactions with invalid category references
-- (This will show which transactions need fixing)
SELECT
    t.id,
    t.category_id,
    t.amount,
    t.type,
    t.item_name,
    t.transaction_date,
    CASE
        WHEN c.id IS NULL THEN '❌ INVALID - Category does not exist'
        ELSE '✅ VALID'
    END as status
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
ORDER BY status, t.transaction_date DESC;

-- Count how many transactions need fixing
SELECT
    COUNT(*) as total_transactions,
    COUNT(c.id) as valid_references,
    COUNT(*) - COUNT(c.id) as invalid_references
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id;

-- =====================================================
-- STEP 2: CREATE MAPPING TABLE (TEMPORARY)
-- =====================================================
-- This creates a temporary table to help us map old IDs to new ones
-- We'll match based on transaction type (spending/earning) to find
-- the appropriate default category

-- First, let's see what category IDs are being referenced
SELECT DISTINCT
    t.category_id as old_category_id,
    t.type as transaction_type,
    COUNT(*) as transaction_count
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE c.id IS NULL  -- Only show invalid references
GROUP BY t.category_id, t.type
ORDER BY t.type, transaction_count DESC;

-- =====================================================
-- STEP 3: UPDATE TRANSACTIONS
-- =====================================================
-- ⚠️  IMPORTANT: Before running this, you need to know:
-- - Your user_id (get it from categories table above)
-- - Which Supabase category to map to
--
-- Strategy: Map all invalid references to "Other" category of matching type
-- - spending transactions → "Other" spending category
-- - earning transactions → "Other" earning category
--
-- This is safe because it preserves all transaction data,
-- just assigns them to a generic "Other" category
-- =====================================================

-- Find the "Other" category IDs for spending and earning
-- (You'll need these for the update statements)
SELECT
    id,
    name,
    type,
    user_id
FROM categories
WHERE name = 'Other'
ORDER BY type;

-- =====================================================
-- STEP 4: ACTUAL UPDATE QUERIES
-- =====================================================
-- ⚠️  Replace <USER_ID>, <SPENDING_OTHER_ID>, <EARNING_OTHER_ID>
--     with actual values from the queries above
--
-- BEFORE RUNNING: Make sure you have the correct IDs!
-- =====================================================

-- Update spending transactions with invalid category_ids to "Other" spending category
-- UPDATE transactions
-- SET category_id = '<SPENDING_OTHER_ID>'
-- WHERE type = 'spending'
--   AND user_id = '<USER_ID>'
--   AND category_id NOT IN (
--     SELECT id FROM categories WHERE user_id = '<USER_ID>' AND type = 'spending'
--   );

-- Update earning transactions with invalid category_ids to "Other" earning category
-- UPDATE transactions
-- SET category_id = '<EARNING_OTHER_ID>'
-- WHERE type = 'earning'
--   AND user_id = '<USER_ID>'
--   AND category_id NOT IN (
--     SELECT id FROM categories WHERE user_id = '<USER_ID>' AND type = 'earning'
--   );

-- =====================================================
-- STEP 5: ADD FOREIGN KEY CONSTRAINT
-- =====================================================
-- This will enforce referential integrity going forward
-- =====================================================

-- Add the foreign key constraint back
-- ALTER TABLE transactions
-- ADD CONSTRAINT transactions_category_id_fkey
-- FOREIGN KEY (category_id)
-- REFERENCES categories(id)
-- ON DELETE RESTRICT;

-- =====================================================
-- STEP 6: VERIFICATION
-- =====================================================
-- Run these to verify everything is fixed
-- =====================================================

-- Check that no invalid references remain
-- SELECT
--     COUNT(*) as total_transactions,
--     COUNT(c.id) as valid_references,
--     COUNT(*) - COUNT(c.id) as should_be_zero
-- FROM transactions t
-- LEFT JOIN categories c ON t.category_id = c.id;

-- Test the query that was failing
-- SELECT
--     t.*,
--     c.name as category_name,
--     c.type as category_type
-- FROM transactions t
-- LEFT JOIN categories c ON t.category_id = c.id
-- LIMIT 5;

-- =====================================================
-- ✅ DONE!
-- =====================================================
-- After running all steps, your transactions will have valid
-- category references and the foreign key constraint will be back.
-- =====================================================
