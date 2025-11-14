-- =====================================================
-- AUTOMATED FIX WITH CATEGORY CREATION
-- =====================================================
-- This script will:
-- 1. Check current state
-- 2. Create missing default categories if needed
-- 3. Fix invalid category references
-- 4. Restore foreign key constraint
-- =====================================================

-- =====================================================
-- STEP 1: Show current state
-- =====================================================
DO $$
DECLARE
    v_total_transactions INTEGER;
    v_valid_references INTEGER;
    v_invalid_references INTEGER;
    v_category_count INTEGER;
BEGIN
    -- Check categories
    SELECT COUNT(*) INTO v_category_count FROM categories;

    -- Check transactions
    SELECT
        COUNT(*),
        COUNT(c.id),
        COUNT(*) - COUNT(c.id)
    INTO v_total_transactions, v_valid_references, v_invalid_references
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id;

    RAISE NOTICE '📊 Current State:';
    RAISE NOTICE '  Total categories: %', v_category_count;
    RAISE NOTICE '  Total transactions: %', v_total_transactions;
    RAISE NOTICE '  Valid references: %', v_valid_references;
    RAISE NOTICE '  Invalid references: %', v_invalid_references;
END $$;

-- =====================================================
-- STEP 2: Ensure default categories exist
-- =====================================================
DO $$
DECLARE
    v_user_id UUID;
    v_spending_categories INTEGER;
    v_earning_categories INTEGER;
BEGIN
    -- Get user_id from existing categories or transactions
    SELECT user_id INTO v_user_id FROM categories LIMIT 1;

    IF v_user_id IS NULL THEN
        SELECT user_id INTO v_user_id FROM transactions LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Could not find user_id in categories or transactions';
    END IF;

    RAISE NOTICE '👤 Found user_id: %', v_user_id;

    -- Check if spending categories exist
    SELECT COUNT(*) INTO v_spending_categories
    FROM categories
    WHERE user_id = v_user_id AND type = 'spending';

    -- Check if earning categories exist
    SELECT COUNT(*) INTO v_earning_categories
    FROM categories
    WHERE user_id = v_user_id AND type = 'earning';

    RAISE NOTICE '📦 Existing categories: % spending, % earning', v_spending_categories, v_earning_categories;

    -- Create default spending categories if none exist
    IF v_spending_categories = 0 THEN
        RAISE NOTICE '📝 Creating default spending categories...';
        INSERT INTO categories (user_id, name, type, is_custom) VALUES
            (v_user_id, 'Food & Dining', 'spending', false),
            (v_user_id, 'Transportation', 'spending', false),
            (v_user_id, 'Shopping', 'spending', false),
            (v_user_id, 'Bills & Utilities', 'spending', false),
            (v_user_id, 'Entertainment', 'spending', false),
            (v_user_id, 'Healthcare', 'spending', false),
            (v_user_id, 'Education', 'spending', false),
            (v_user_id, 'Other', 'spending', false);
        RAISE NOTICE '✅ Created 8 default spending categories';
    ELSE
        -- Ensure "Other" spending category exists
        IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = v_user_id AND name = 'Other' AND type = 'spending') THEN
            INSERT INTO categories (user_id, name, type, is_custom)
            VALUES (v_user_id, 'Other', 'spending', false);
            RAISE NOTICE '✅ Created "Other" spending category';
        END IF;
    END IF;

    -- Create default earning categories if none exist
    IF v_earning_categories = 0 THEN
        RAISE NOTICE '📝 Creating default earning categories...';
        INSERT INTO categories (user_id, name, type, is_custom) VALUES
            (v_user_id, 'Salary', 'earning', false),
            (v_user_id, 'Freelance', 'earning', false),
            (v_user_id, 'Investment', 'earning', false),
            (v_user_id, 'Gift', 'earning', false),
            (v_user_id, 'Refund', 'earning', false),
            (v_user_id, 'Other', 'earning', false);
        RAISE NOTICE '✅ Created 6 default earning categories';
    ELSE
        -- Ensure "Other" earning category exists
        IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = v_user_id AND name = 'Other' AND type = 'earning') THEN
            INSERT INTO categories (user_id, name, type, is_custom)
            VALUES (v_user_id, 'Other', 'earning', false);
            RAISE NOTICE '✅ Created "Other" earning category';
        END IF;
    END IF;
END $$;

-- =====================================================
-- STEP 3: Update spending transactions with invalid category_ids
-- =====================================================
DO $$
DECLARE
    v_spending_other_id UUID;
    v_user_id UUID;
    v_updated_count INTEGER;
BEGIN
    -- Get user_id
    SELECT user_id INTO v_user_id FROM categories LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found in categories table';
    END IF;

    -- Find the "Other" spending category (should exist now)
    SELECT id INTO v_spending_other_id
    FROM categories
    WHERE user_id = v_user_id
      AND name = 'Other'
      AND type = 'spending'
    LIMIT 1;

    IF v_spending_other_id IS NULL THEN
        RAISE EXCEPTION 'Could not find "Other" spending category even after creation';
    END IF;

    RAISE NOTICE '🔍 Using spending "Other" category: %', v_spending_other_id;

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
-- STEP 4: Update earning transactions with invalid category_ids
-- =====================================================
DO $$
DECLARE
    v_earning_other_id UUID;
    v_user_id UUID;
    v_updated_count INTEGER;
BEGIN
    -- Get user_id
    SELECT user_id INTO v_user_id FROM categories LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found in categories table';
    END IF;

    -- Find the "Other" earning category (should exist now)
    SELECT id INTO v_earning_other_id
    FROM categories
    WHERE user_id = v_user_id
      AND name = 'Other'
      AND type = 'earning'
    LIMIT 1;

    IF v_earning_other_id IS NULL THEN
        RAISE EXCEPTION 'Could not find "Other" earning category even after creation';
    END IF;

    RAISE NOTICE '🔍 Using earning "Other" category: %', v_earning_other_id;

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
-- STEP 5: Verify all references are now valid
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

    RAISE NOTICE '';
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
-- STEP 6: Add foreign key constraint back
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
-- STEP 7: Final verification
-- =====================================================
DO $$
DECLARE
    v_category_count INTEGER;
    v_spending_count INTEGER;
    v_earning_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_category_count FROM categories;
    SELECT COUNT(*) INTO v_spending_count FROM categories WHERE type = 'spending';
    SELECT COUNT(*) INTO v_earning_count FROM categories WHERE type = 'earning';

    RAISE NOTICE '';
    RAISE NOTICE '🎉 ALL DONE!';
    RAISE NOTICE '';
    RAISE NOTICE '📦 Final category count:';
    RAISE NOTICE '  Total: %', v_category_count;
    RAISE NOTICE '  Spending: %', v_spending_count;
    RAISE NOTICE '  Earning: %', v_earning_count;
    RAISE NOTICE '';
    RAISE NOTICE 'What was fixed:';
    RAISE NOTICE '  ✅ Created missing default categories (if needed)';
    RAISE NOTICE '  ✅ Invalid category references updated to "Other" categories';
    RAISE NOTICE '  ✅ Foreign key constraint restored';
    RAISE NOTICE '  ✅ All transaction data preserved';
    RAISE NOTICE '';
    RAISE NOTICE 'Your app should now work without the category relationship error!';
END $$;
