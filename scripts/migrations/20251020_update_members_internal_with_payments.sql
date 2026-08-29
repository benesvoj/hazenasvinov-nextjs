-- Update members_internal view to include payment information
-- This view should join with member_fee_status to include payment data for internal members

-- Drop the existing view
DROP VIEW IF EXISTS members_internal;

-- Recreate the view with payment information
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

-- Grant permissions
GRANT SELECT ON members_internal TO authenticated;
GRANT SELECT ON members_internal TO anon;

-- Add comment
COMMENT ON VIEW members_internal IS 'Internal club members with payment status information. Includes all active members who belong to our own club with their current payment status.';
