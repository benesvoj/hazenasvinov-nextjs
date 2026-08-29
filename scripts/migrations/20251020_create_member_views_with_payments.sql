-- ============================================
-- Member Views with Payment Information
-- ============================================
-- This script creates three views for different member types:
-- 1. members_internal - Our own club members (WITH payment info)
-- 2. members_external - External players from other clubs (NO payment info)
-- 3. members_on_loan - Players on loan (NO payment info)
--
-- Run this in Supabase SQL Editor to recreate the views
-- ============================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS members_internal;
DROP VIEW IF EXISTS members_external;
DROP VIEW IF EXISTS members_on_loan;

-- ============================================
-- 1. MEMBERS_INTERNAL VIEW
-- Our own club members with payment information
-- ============================================
CREATE OR REPLACE VIEW members_internal AS
SELECT
    m.id,
    m.name,
    m.surname,
    m.registration_number,
    m.date_of_birth,
    m.sex,
    m.category_id,
    m.functions,
    m.is_active,
    m.created_at,
    m.updated_at,

    -- Club information
    c.name as club_name,

    -- Relationship information
    mcr.relationship_type,
    mcr.status as relationship_status,
    mcr.valid_from,
    mcr.valid_to,

    -- Payment information (from member_fee_status view)
    -- These fields are only relevant for internal members
    mfs.category_name,
    mfs.payment_status,
    mfs.expected_fee_amount,
    mfs.net_paid,
    mfs.total_paid,
    mfs.total_refunded,
    mfs.last_payment_date,
    mfs.payment_count,
    mfs.calendar_year,
    mfs.currency
FROM
    members m
    INNER JOIN member_club_relationships mcr ON m.id = mcr.member_id
    INNER JOIN clubs c ON mcr.club_id = c.id
    LEFT JOIN member_fee_status mfs ON m.id = mfs.member_id
WHERE
    c.is_own_club = true
    AND mcr.relationship_type = 'own_member'
    AND mcr.status = 'active'
    AND (mcr.valid_to IS NULL OR mcr.valid_to > CURRENT_DATE);

-- ============================================
-- 2. MEMBERS_EXTERNAL VIEW
-- External players from other clubs (no payment info)
-- ============================================
CREATE OR REPLACE VIEW members_external AS
SELECT
    m.id,
    m.name,
    m.surname,
    m.registration_number,
    m.date_of_birth,
    m.sex,
    m.category_id,
    m.functions,
    m.is_active,
    m.notes,
    m.created_at,
    m.updated_at,

    -- Origin club information (where the player comes from)
    c.name as origin_club_name,
    c.short_name as origin_club_short_name,

    -- Relationship information
    mcr.relationship_type,
    mcr.status as relationship_status,
    mcr.valid_from,
    mcr.valid_to
FROM
    members m
    INNER JOIN member_club_relationships mcr ON m.id = mcr.member_id
    INNER JOIN clubs c ON mcr.club_id = c.id
WHERE
    c.is_own_club = false
    AND mcr.relationship_type = 'external_player'
    AND mcr.status = 'active'
    AND (mcr.valid_to IS NULL OR mcr.valid_to > CURRENT_DATE);

-- ============================================
-- 3. MEMBERS_ON_LOAN VIEW
-- Players on loan from other clubs (no payment info)
-- ============================================
CREATE OR REPLACE VIEW members_on_loan AS
SELECT
    m.id,
    m.name,
    m.surname,
    m.registration_number,
    m.date_of_birth,
    m.sex,
    m.category_id,
    m.functions,
    m.is_active,
    m.notes,
    m.created_at,
    m.updated_at,

    -- Origin club information (the club they're on loan from)
    c.name as origin_club_name,
    c.short_name as origin_club_short_name,

    -- Relationship information
    mcr.relationship_type,
    mcr.status as relationship_status,
    mcr.valid_from,
    mcr.valid_to
FROM
    members m
    INNER JOIN member_club_relationships mcr ON m.id = mcr.member_id
    INNER JOIN clubs c ON mcr.club_id = c.id
WHERE
    mcr.relationship_type = 'on_loan'
    AND mcr.status = 'active'
    AND (mcr.valid_to IS NULL OR mcr.valid_to > CURRENT_DATE);

-- ============================================
-- Grant Permissions
-- ============================================
GRANT SELECT ON members_internal TO authenticated;
GRANT SELECT ON members_internal TO anon;

GRANT SELECT ON members_external TO authenticated;
GRANT SELECT ON members_external TO anon;

GRANT SELECT ON members_on_loan TO authenticated;
GRANT SELECT ON members_on_loan TO anon;

-- ============================================
-- Add Comments
-- ============================================
COMMENT ON VIEW members_internal IS 'Internal club members with payment status information. Includes all active members who belong to our own club with their current payment status.';

COMMENT ON VIEW members_external IS 'External players from other clubs. These are players who play for other clubs but may participate in our events or activities.';

COMMENT ON VIEW members_on_loan IS 'Players on loan from other clubs. These are temporary members playing for us while registered with another club.';

-- ============================================
-- Verification Queries (optional - comment out if not needed)
-- ============================================
-- SELECT COUNT(*) as internal_count FROM members_internal;
-- SELECT COUNT(*) as external_count FROM members_external;
-- SELECT COUNT(*) as on_loan_count FROM members_on_loan;
