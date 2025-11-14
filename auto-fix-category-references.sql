-- =====================================================
-- AUTOMATED FIX FOR CATEGORY REFERENCES
-- =====================================================
-- This script automatically fixes all invalid category references
-- and restores the foreign key constraint
-- =====================================================

-- =====================================================
-- STEP 1: Show current state (for your records)
-- =====================================================
DO $$
DECLARE
    v_total_transactions INTEGER;
    v_valid_references INTEGER;
    v_invalid_references INTEGER;
BEGIN
    SELECT
        COUNT(*),
        COUNT(c.id),
        COUNT(*) - COUNT(c.id)
    INTO v_total_transactions, v_valid_references, v_invalid_references
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id;

    RAISE NOTICE '📊 Current State:';
    RAISE NOTICE '  Total transactions: %', v_total_transactions;
    RAISE NOTICE '  Valid references: %', v_valid_references;
    RAISE NOTICE '  Invalid references: %', v_invalid_references;
END $$;

-- =====================================================
-- STEP 2: Update spending transactions with invalid category_ids
-- =====================================================
DO $$
DECLARE
    v_spending_other_id UUID;
    v_user_id UUID;
    v_updated_count INTEGER;
BEGIN
    -- Get a user_id from categories table
    SELECT user_id INTO v_user_id
    FROM categories
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found in categories table';
    END IF;

    -- Find the "Other" spending category for this user
    SELECT id INTO v_spending_other_id
    FROM categories
    WHERE user_id = v_user_id
      AND name = 'Other'
      AND type = 'spending'
    LIMIT 1;

    IF v_spending_other_id IS NULL THEN
        RAISE EXCEPTION 'Could not find "Other" spending category';
    END IF;

    -- Update spending transactions with invalid category_ids
    UPDATE transactions
    SET category_id = v_spending_other_id
    WHERE type = 'spending'
      AND user_id = v_user_id
      AND category_id NOT IN (
        SELECT id FROM categories WHERE user_id = v_user_id
      );

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE '✅ Updated % spending transactions to use "Other" category', v_updated_count;
END $$;

-- =====================================================
-- STEP 3: Update earning transactions with invalid category_ids
-- =====================================================
DO $$
DECLARE
    v_earning_other_id UUID;
    v_user_id UUID;
    v_updated_count INTEGER;
BEGIN
    -- Get a user_id from categories table
    SELECT user_id INTO v_user_id
    FROM categories
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found in categories table';
    END IF;

    -- Find the "Other" earning category for this user
    SELECT id INTO v_earning_other_id
    FROM categories
    WHERE user_id = v_user_id
      AND name = 'Other'
      AND type = 'earning'
    LIMIT 1;

    IF v_earning_other_id IS NULL THEN
        RAISE EXCEPTION 'Could not find "Other" earning category';
    END IF;

    -- Update earning transactions with invalid category_ids
    UPDATE transactions
    SET category_id = v_earning_other_id
    WHERE type = 'earning'
      AND user_id = v_user_id
      AND category_id NOT IN (
        SELECT id FROM categories WHERE user_id = v_user_id
      );

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE '✅ Updated % earning transactions to use "Other" category', v_updated_count;
END $$;

-- =====================================================
-- STEP 4: Verify all references are now valid
-- =====================================================
DO $$
DECLARE
    v_total_transactions INTEGER;
    v_valid_references INTEGER;
    v_invalid_references INTEGER;
BEGIN
    SELECT
        COUNT(*),
        COUNT(c.id),
        COUNT(*) - COUNT(c.id)
    INTO v_total_transactions, v_valid_references, v_invalid_references
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id;

    RAISE NOTICE '📊 After Update:';
    RAISE NOTICE '  Total transactions: %', v_total_transactions;
    RAISE NOTICE '  Valid references: %', v_valid_references;
    RAISE NOTICE '  Invalid references: %', v_invalid_references;

    IF v_invalid_references > 0 THEN
        RAISE EXCEPTION 'Still have % invalid references after update!', v_invalid_references;
    END IF;

    RAISE NOTICE '✅ All category references are now valid!';
END $$;

-- =====================================================
-- STEP 5: Add foreign key constraint back
-- =====================================================
DO $$
BEGIN
    -- Drop constraint if it exists (just in case)
    ALTER TABLE transactions
        DROP CONSTRAINT IF EXISTS transactions_category_id_fkey;

    -- Add the foreign key constraint
    ALTER TABLE transactions
        ADD CONSTRAINT transactions_category_id_fkey
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT;

    RAISE NOTICE '✅ Foreign key constraint added successfully!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error adding foreign key constraint: %', SQLERRM;
        RAISE;
END $$;

-- =====================================================
-- STEP 6: Final verification
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ALL DONE!';
    RAISE NOTICE '';
    RAISE NOTICE 'What was fixed:';
    RAISE NOTICE '  ✅ Invalid category references updated to "Other" categories';
    RAISE NOTICE '  ✅ Foreign key constraint restored';
    RAISE NOTICE '  ✅ All transaction data preserved';
    RAISE NOTICE '';
    RAISE NOTICE 'Your app should now work without the category relationship error!';
END $$;
