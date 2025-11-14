-- =====================================================
-- DIAGNOSTIC: Check what categories exist
-- =====================================================
-- Run this first to see what's in your database
-- =====================================================

-- Check all categories
SELECT
    id,
    name,
    type,
    is_custom,
    user_id,
    created_at
FROM categories
ORDER BY type, name;

-- Count categories by type
SELECT
    type,
    COUNT(*) as count
FROM categories
GROUP BY type;

-- Check for "Other" categories specifically
SELECT
    id,
    name,
    type,
    user_id
FROM categories
WHERE name ILIKE '%other%'
ORDER BY type;
