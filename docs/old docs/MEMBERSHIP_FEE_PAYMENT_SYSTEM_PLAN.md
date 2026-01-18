# Membership Fee Payment System - Implementation Plan

## Executive Summary

This document outlines the plan for implementing a membership fee payment tracking system. The system will:
1. Track membership fees at the category level (different amounts per category)
2. Display payment status with color indicators in the member list
3. Provide detailed payment history on member cards/detail view
4. Support full CRUD operations on payments
5. Track payments by calendar year

---

## Current Database State Analysis

### Existing Tables

#### 1. **members** Table
Based on code analysis, the members table has:
```typescript
interface Member {
  id: string;                      // UUID primary key
  registration_number: string;     // Unique registration number
  name: string;
  surname: string;
  date_of_birth?: string;
  category_id?: string;            // UUID reference to categories
  sex: Genders;
  functions: MemberFunctionEnum[]; // Array of functions
  is_external: boolean;
  core_club_id?: string;
  current_club_id?: string;
  external_club_name?: string;
  position?: string;
  jersey_number?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

**Key Points:**
- Uses UUID for id and category_id
- Has relationship with categories table
- Already has metadata support via member_metadata table

#### 2. **member_metadata** Table
Located in: `scripts/development/create-member-metadata.sql`

```sql
CREATE TABLE IF NOT EXISTS member_metadata (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,

  -- Contact Information
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,

  -- Parent/Guardian Information
  parent_name VARCHAR(255),
  parent_phone VARCHAR(20),
  parent_email VARCHAR(255),

  -- Medical Information
  medical_notes TEXT,
  allergies TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),

  -- Additional Information
  notes TEXT,
  preferred_position VARCHAR(100),
  jersey_size VARCHAR(10),
  shoe_size VARCHAR(10),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(member_id)
);
```

**Key Points:**
- One-to-one relationship with members
- Auto-created via trigger when member is created
- Currently no financial fields

#### 3. **categories** Table
Located in: `scripts/development/create-category-metadata.sql`

```sql
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  age_min INTEGER,
  age_max INTEGER,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'mixed')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Points:**
- No membership fee field currently
- Would need extension to track fees per year
- Has slug field for routing (per TypeScript interface)

#### 4. **Existing Payment Infrastructure**
The codebase has a betting system with payment patterns:
- `betting_wallets` table (tracks balances)
- `betting_transactions` table (tracks all transactions with types, amounts, status)

**Reusable Patterns:**
- Transaction tracking with status
- Balance calculations
- RLS policies for user-specific data
- Materialized views for aggregations

### UI Current State

#### Admin Members Page
Location: `src/app/admin/members/page.tsx.backup`

**Current Features:**
- Two tabs: "Seznam členů" (Members List) and "Statistiky" (Statistics)
- Member list with filtering and search
- CRUD operations via modals
- No payment/fee tracking

**Components:**
- `MembersInternalTab` - Table view with filters
- `MembersStatisticTab` - Statistics dashboard
- `MemberFormModal` - Add/Edit member modal
- `BulkEditModal` - Bulk operations
- `MembersCsvImport` - CSV import

**Missing:**
- No member detail card/view (opens modal for edit)
- No payment information display
- No color indicators for payment status

---

## Recommended Solution

### Option A: New Related Tables (Recommended)

**Create separate tables for:**
1. `category_membership_fees` - Store fee amounts per category per year
2. `membership_fee_payments` - Store individual payment records

**Rationale:**
- Clean separation of concerns
- Better data normalization
- Flexible: supports multiple payments per year
- Easy to query and aggregate
- Supports historical tracking (fee changes over years)
- Follows existing patterns (separate metadata tables)
- No risk of breaking existing member_metadata structure

### Option B: Extend member_metadata Table

**Add payment tracking fields to member_metadata:**
- membership_fee_status (enum: paid, partial, unpaid)
- membership_fee_amount_paid (numeric)
- last_payment_date (timestamp)

**Rationale:**
- Simpler structure
- Fewer joins needed
- Quick implementation

**Drawbacks:**
- Only tracks current year/status
- No historical data
- No support for multiple payments per year
- Mixes concerns (metadata vs. financial)
- Not flexible for future requirements

### Decision: **Option A - New Related Tables**

This approach provides:
- Better data modeling
- Historical tracking
- Flexibility for complex scenarios
- Separation of financial data from personal metadata
- Easier auditing and reporting

---

## Implementation Plan

### Phase 1: Database Schema - Category Fee Configuration

#### 1.1 Create category_membership_fees Table

**Purpose:** Store the membership fee amount for each category for each calendar year.

Create migration file: `scripts/migrations/20251016_create_membership_fee_system.sql`

```sql
-- =====================================================
-- CATEGORY_MEMBERSHIP_FEES TABLE
-- Store membership fee amounts per category per year
-- =====================================================
CREATE TABLE IF NOT EXISTS category_membership_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    calendar_year INTEGER NOT NULL CHECK (calendar_year >= 2000 AND calendar_year <= 2100),
    fee_amount NUMERIC(10, 2) NOT NULL CHECK (fee_amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'CZK',

    -- Optional: different fee periods (year, semester, quarter)
    fee_period VARCHAR(20) DEFAULT 'yearly' CHECK (fee_period IN ('yearly', 'semester', 'quarterly', 'monthly')),

    -- Metadata
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),

    -- Ensure one fee configuration per category per year per period
    UNIQUE(category_id, calendar_year, fee_period)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_category_fees_category_id
    ON category_membership_fees(category_id);
CREATE INDEX IF NOT EXISTS idx_category_fees_year
    ON category_membership_fees(calendar_year);
CREATE INDEX IF NOT EXISTS idx_category_fees_active
    ON category_membership_fees(is_active);
CREATE INDEX IF NOT EXISTS idx_category_fees_category_year
    ON category_membership_fees(category_id, calendar_year);

-- Enable RLS
ALTER TABLE category_membership_fees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All authenticated users can read fee configuration
CREATE POLICY "Authenticated users can view membership fees"
    ON category_membership_fees FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only admins can manage fee configuration
CREATE POLICY "Admins can manage membership fees"
    ON category_membership_fees FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Add comment
COMMENT ON TABLE category_membership_fees IS 'Membership fee configuration per category per calendar year';
COMMENT ON COLUMN category_membership_fees.fee_period IS 'Payment period: yearly (default), semester, quarterly, monthly';
```

---

### Phase 2: Database Schema - Payment Tracking

#### 2.1 Create membership_fee_payments Table

**Purpose:** Store individual payment records for members.

```sql
-- =====================================================
-- MEMBERSHIP_FEE_PAYMENTS TABLE
-- Track individual payment records for members
-- =====================================================
CREATE TABLE IF NOT EXISTS membership_fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,

    -- Payment details
    calendar_year INTEGER NOT NULL CHECK (calendar_year >= 2000 AND calendar_year <= 2100),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'CZK',

    -- Payment metadata
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'other')),
    payment_reference VARCHAR(100), -- e.g., transaction ID, check number

    -- Categorization
    fee_type VARCHAR(20) DEFAULT 'membership' CHECK (fee_type IN ('membership', 'registration', 'additional', 'refund')),

    -- Additional info
    notes TEXT,
    receipt_number VARCHAR(50),

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_membership_payments_member_id
    ON membership_fee_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_membership_payments_category_id
    ON membership_fee_payments(category_id);
CREATE INDEX IF NOT EXISTS idx_membership_payments_year
    ON membership_fee_payments(calendar_year);
CREATE INDEX IF NOT EXISTS idx_membership_payments_date
    ON membership_fee_payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_membership_payments_member_year
    ON membership_fee_payments(member_id, calendar_year);

-- Enable RLS
ALTER TABLE membership_fee_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins and coaches can view payments for their categories
CREATE POLICY "Admins can view all payments"
    ON membership_fee_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Coaches can view payments for their categories"
    ON membership_fee_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('coach', 'head_coach')
            AND category_id = ANY(assigned_categories)
        )
    );

-- Only admins can manage payments
CREATE POLICY "Admins can manage payments"
    ON membership_fee_payments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Add comment
COMMENT ON TABLE membership_fee_payments IS 'Individual membership fee payment records';
COMMENT ON COLUMN membership_fee_payments.fee_type IS 'Type of fee: membership (regular), registration (initial), additional, refund';
```

---

### Phase 3: Database Schema - Views and Functions

#### 3.1 Create View for Payment Status

**Purpose:** Aggregate payment data per member per year for easy querying.

```sql
-- =====================================================
-- MEMBER_FEE_STATUS_VIEW
-- Aggregated view of payment status per member per year
-- =====================================================
CREATE OR REPLACE VIEW member_fee_status AS
SELECT
    m.id as member_id,
    m.registration_number,
    m.name,
    m.surname,
    m.category_id,
    c.name as category_name,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER as calendar_year,

    -- Expected fee amount from category configuration
    COALESCE(cf.fee_amount, 0) as expected_fee_amount,

    -- Total amount paid by member this year
    COALESCE(SUM(p.amount) FILTER (
        WHERE p.calendar_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        AND p.fee_type != 'refund'
    ), 0) as total_paid,

    -- Refunds this year
    COALESCE(SUM(p.amount) FILTER (
        WHERE p.calendar_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        AND p.fee_type = 'refund'
    ), 0) as total_refunded,

    -- Net amount paid (paid - refunds)
    COALESCE(SUM(p.amount) FILTER (
        WHERE p.calendar_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        AND p.fee_type != 'refund'
    ), 0) - COALESCE(SUM(p.amount) FILTER (
        WHERE p.calendar_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        AND p.fee_type = 'refund'
    ), 0) as net_paid,

    -- Payment status: 'paid', 'partial', 'unpaid'
    CASE
        WHEN COALESCE(cf.fee_amount, 0) = 0 THEN 'not_required'
        WHEN (
            COALESCE(SUM(p.amount) FILTER (
                WHERE p.calendar_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
                AND p.fee_type != 'refund'
            ), 0) - COALESCE(SUM(p.amount) FILTER (
                WHERE p.calendar_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
                AND p.fee_type = 'refund'
            ), 0)
        ) >= COALESCE(cf.fee_amount, 0) THEN 'paid'
        WHEN (
            COALESCE(SUM(p.amount) FILTER (
                WHERE p.calendar_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
                AND p.fee_type != 'refund'
            ), 0) - COALESCE(SUM(p.amount) FILTER (
                WHERE p.calendar_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
                AND p.fee_type = 'refund'
            ), 0)
        ) > 0 THEN 'partial'
        ELSE 'unpaid'
    END as payment_status,

    -- Latest payment date
    MAX(p.payment_date) FILTER (
        WHERE p.calendar_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    ) as last_payment_date,

    -- Payment count this year
    COUNT(p.id) FILTER (
        WHERE p.calendar_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        AND p.fee_type != 'refund'
    ) as payment_count

FROM members m
LEFT JOIN categories c ON m.category_id = c.id
LEFT JOIN category_membership_fees cf ON (
    c.id = cf.category_id
    AND cf.calendar_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    AND cf.is_active = TRUE
)
LEFT JOIN membership_fee_payments p ON m.id = p.member_id
GROUP BY
    m.id,
    m.registration_number,
    m.name,
    m.surname,
    m.category_id,
    c.name,
    cf.fee_amount;

-- Add comment
COMMENT ON VIEW member_fee_status IS 'Current year payment status for all active members with color indicator logic';
```

#### 3.2 Create Helper Function for Historical Status

```sql
-- =====================================================
-- FUNCTION: get_member_fee_status_for_year
-- Get payment status for a specific member and year
-- =====================================================
CREATE OR REPLACE FUNCTION get_member_fee_status_for_year(
    p_member_id UUID,
    p_calendar_year INTEGER
)
RETURNS TABLE (
    expected_fee NUMERIC,
    total_paid NUMERIC,
    payment_status TEXT,
    payment_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(cf.fee_amount, 0) as expected_fee,
        COALESCE(SUM(p.amount) FILTER (WHERE p.fee_type != 'refund'), 0) -
            COALESCE(SUM(p.amount) FILTER (WHERE p.fee_type = 'refund'), 0) as total_paid,
        CASE
            WHEN COALESCE(cf.fee_amount, 0) = 0 THEN 'not_required'
            WHEN (COALESCE(SUM(p.amount) FILTER (WHERE p.fee_type != 'refund'), 0) -
                  COALESCE(SUM(p.amount) FILTER (WHERE p.fee_type = 'refund'), 0)) >=
                  COALESCE(cf.fee_amount, 0) THEN 'paid'
            WHEN (COALESCE(SUM(p.amount) FILTER (WHERE p.fee_type != 'refund'), 0) -
                  COALESCE(SUM(p.amount) FILTER (WHERE p.fee_type = 'refund'), 0)) > 0 THEN 'partial'
            ELSE 'unpaid'
        END as payment_status,
        COUNT(p.id) FILTER (WHERE p.fee_type != 'refund') as payment_count
    FROM members m
    LEFT JOIN category_membership_fees cf ON (
        m.category_id = cf.category_id
        AND cf.calendar_year = p_calendar_year
        AND cf.is_active = TRUE
    )
    LEFT JOIN membership_fee_payments p ON (
        m.id = p.member_id
        AND p.calendar_year = p_calendar_year
    )
    WHERE m.id = p_member_id
    GROUP BY cf.fee_amount;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION get_member_fee_status_for_year IS 'Calculate payment status for specific member and year';
```

#### 3.3 Create Update Trigger

```sql
-- =====================================================
-- TRIGGER: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_membership_fee_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for category_membership_fees
DROP TRIGGER IF EXISTS update_category_fees_timestamp ON category_membership_fees;
CREATE TRIGGER update_category_fees_timestamp
    BEFORE UPDATE ON category_membership_fees
    FOR EACH ROW
    EXECUTE FUNCTION update_membership_fee_updated_at();

-- Trigger for membership_fee_payments
DROP TRIGGER IF EXISTS update_payments_timestamp ON membership_fee_payments;
CREATE TRIGGER update_payments_timestamp
    BEFORE UPDATE ON membership_fee_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_membership_fee_updated_at();
```

---

### Phase 4: Type Definitions

#### 4.1 Create TypeScript Interfaces

File: `src/types/entities/membershipFee/categoryMembershipFee.ts`

```typescript
export interface CategoryMembershipFee {
  id: string;
  category_id: string;
  calendar_year: number;
  fee_amount: number;
  currency: string;
  fee_period: 'yearly' | 'semester' | 'quarterly' | 'monthly';
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CategoryWithFee {
  id: string;
  name: string;
  current_fee_amount?: number;
  current_fee_period?: string;
  current_fee_currency?: string;
}

export interface CreateCategoryFeeData {
  category_id: string;
  calendar_year: number;
  fee_amount: number;
  currency?: string;
  fee_period?: string;
  description?: string;
}

export interface UpdateCategoryFeeData extends CreateCategoryFeeData {
  id: string;
  is_active?: boolean;
}
```

File: `src/types/entities/membershipFee/membershipFeePayment.ts`

```typescript
export interface MembershipFeePayment {
  id: string;
  member_id: string;
  category_id: string;
  calendar_year: number;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method?: 'cash' | 'bank_transfer' | 'card' | 'other';
  payment_reference?: string;
  fee_type: 'membership' | 'registration' | 'additional' | 'refund';
  notes?: string;
  receipt_number?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface MemberPaymentStatus {
  member_id: string;
  registration_number: string;
  name: string;
  surname: string;
  category_id: string;
  category_name: string;
  calendar_year: number;
  expected_fee_amount: number;
  total_paid: number;
  net_paid: number;
  payment_status: 'paid' | 'partial' | 'unpaid' | 'not_required';
  last_payment_date?: string;
  payment_count: number;
}

export interface CreatePaymentData {
  member_id: string;
  category_id: string;
  calendar_year: number;
  amount: number;
  payment_date: string;
  payment_method?: string;
  payment_reference?: string;
  fee_type?: string;
  notes?: string;
  receipt_number?: string;
}

export interface UpdatePaymentData extends CreatePaymentData {
  id: string;
}

export interface MemberPaymentHistory {
  member: {
    id: string;
    name: string;
    surname: string;
    registration_number: string;
  };
  payments: MembershipFeePayment[];
  summary: {
    [year: number]: {
      expected: number;
      paid: number;
      status: string;
    };
  };
}
```

File: `src/enums/membershipFeeStatus.ts`

```typescript
export enum PaymentStatus {
  PAID = 'paid',
  PARTIAL = 'partial',
  UNPAID = 'unpaid',
  NOT_REQUIRED = 'not_required',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  OTHER = 'other',
}

export enum FeeType {
  MEMBERSHIP = 'membership',
  REGISTRATION = 'registration',
  ADDITIONAL = 'additional',
  REFUND = 'refund',
}

export enum FeePeriod {
  YEARLY = 'yearly',
  SEMESTER = 'semester',
  QUARTERLY = 'quarterly',
  MONTHLY = 'monthly',
}

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.PAID:
      return 'success'; // Green
    case PaymentStatus.PARTIAL:
      return 'warning'; // Orange/Yellow
    case PaymentStatus.UNPAID:
      return 'danger'; // Red
    case PaymentStatus.NOT_REQUIRED:
      return 'default'; // Gray
    default:
      return 'default';
  }
};

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.PAID:
      return 'Zaplaceno';
    case PaymentStatus.PARTIAL:
      return 'Částečně zaplaceno';
    case PaymentStatus.UNPAID:
      return 'Nezaplaceno';
    case PaymentStatus.NOT_REQUIRED:
      return 'Nevyžadováno';
    default:
      return 'Neznámý stav';
  }
};
```

---

### Phase 5: Backend API Endpoints

#### 5.1 Category Fees API

File: `src/app/api/category-fees/route.ts`

```typescript
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('category_id');
  const year = searchParams.get('year') || new Date().getFullYear();

  try {
    let query = supabase
      .from('category_membership_fees')
      .select('*, categories(name)')
      .eq('calendar_year', year)
      .eq('is_active', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.order('fee_amount', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching category fees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category fees' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  try {
    const body = await request.json();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('category_membership_fees')
      .insert({
        ...body,
        created_by: userData.user.id,
        updated_by: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating category fee:', error);
    return NextResponse.json(
      { error: 'Failed to create category fee' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('category_membership_fees')
      .update({
        ...updates,
        updated_by: userData.user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error updating category fee:', error);
    return NextResponse.json(
      { error: 'Failed to update category fee' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing fee ID' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('category_membership_fees')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting category fee:', error);
    return NextResponse.json(
      { error: 'Failed to delete category fee' },
      { status: 500 }
    );
  }
}
```

#### 5.2 Member Payments API

File: `src/app/api/member-payments/route.ts`

```typescript
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const searchParams = request.nextUrl.searchParams;
  const memberId = searchParams.get('member_id');
  const year = searchParams.get('year');

  if (!memberId) {
    return NextResponse.json({ error: 'Missing member_id' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('membership_fee_payments')
      .select('*')
      .eq('member_id', memberId);

    if (year) {
      query = query.eq('calendar_year', year);
    }

    const { data, error } = await query.order('payment_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching member payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  try {
    const body = await request.json();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('membership_fee_payments')
      .insert({
        ...body,
        created_by: userData.user.id,
        updated_by: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('membership_fee_payments')
      .update({
        ...updates,
        updated_by: userData.user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('membership_fee_payments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment' },
      { status: 500 }
    );
  }
}
```

#### 5.3 Payment Status API

File: `src/app/api/member-payment-status/route.ts`

```typescript
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get('year') || new Date().getFullYear();

  try {
    // Fetch from the view
    const { data, error } = await supabase
      .from('member_fee_status')
      .select('*')
      .order('surname', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}
```

---

### Phase 6: Frontend Hooks

#### 6.1 Category Fees Hook

File: `src/hooks/admin/useCategoryMembershipFees.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { CategoryMembershipFee, CreateCategoryFeeData, UpdateCategoryFeeData } from '@/types';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export const useCategoryMembershipFees = (year?: number) => {
  const [fees, setFees] = useState<CategoryMembershipFee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentYear = year || new Date().getFullYear();

  const loadFees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/category-fees?year=${currentYear}`);
      const { data, error } = await response.json();

      if (error) throw new Error(error);

      setFees(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load fees';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  const createFee = useCallback(async (feeData: CreateCategoryFeeData) => {
    try {
      const response = await fetch('/api/category-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feeData),
      });

      const { data, error } = await response.json();

      if (error) throw new Error(error);

      toast.success('Členský poplatek byl vytvořen');
      loadFees();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create fee';
      toast.error(errorMessage);
      throw err;
    }
  }, [loadFees]);

  const updateFee = useCallback(async (feeData: UpdateCategoryFeeData) => {
    try {
      const response = await fetch('/api/category-fees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feeData),
      });

      const { data, error } = await response.json();

      if (error) throw new Error(error);

      toast.success('Členský poplatek byl aktualizován');
      loadFees();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update fee';
      toast.error(errorMessage);
      throw err;
    }
  }, [loadFees]);

  const deleteFee = useCallback(async (feeId: string) => {
    try {
      const response = await fetch(`/api/category-fees?id=${feeId}`, {
        method: 'DELETE',
      });

      const { error } = await response.json();

      if (error) throw new Error(error);

      toast.success('Členský poplatek byl smazán');
      loadFees();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete fee';
      toast.error(errorMessage);
      throw err;
    }
  }, [loadFees]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  return {
    fees,
    loading,
    error,
    loadFees,
    createFee,
    updateFee,
    deleteFee,
  };
};
```

#### 6.2 Member Payments Hook

File: `src/hooks/admin/useMemberPayments.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { MembershipFeePayment, CreatePaymentData, UpdatePaymentData } from '@/types';
import { toast } from 'sonner';

export const useMemberPayments = (memberId: string, year?: number) => {
  const [payments, setPayments] = useState<MembershipFeePayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    if (!memberId) return;

    setLoading(true);
    setError(null);

    try {
      const url = year
        ? `/api/member-payments?member_id=${memberId}&year=${year}`
        : `/api/member-payments?member_id=${memberId}`;

      const response = await fetch(url);
      const { data, error } = await response.json();

      if (error) throw new Error(error);

      setPayments(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load payments';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [memberId, year]);

  const createPayment = useCallback(async (paymentData: CreatePaymentData) => {
    try {
      const response = await fetch('/api/member-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      const { data, error } = await response.json();

      if (error) throw new Error(error);

      toast.success('Platba byla zaznamenána');
      loadPayments();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment';
      toast.error(errorMessage);
      throw err;
    }
  }, [loadPayments]);

  const updatePayment = useCallback(async (paymentData: UpdatePaymentData) => {
    try {
      const response = await fetch('/api/member-payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      const { data, error } = await response.json();

      if (error) throw new Error(error);

      toast.success('Platba byla aktualizována');
      loadPayments();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment';
      toast.error(errorMessage);
      throw err;
    }
  }, [loadPayments]);

  const deletePayment = useCallback(async (paymentId: string) => {
    try {
      const response = await fetch(`/api/member-payments?id=${paymentId}`, {
        method: 'DELETE',
      });

      const { error } = await response.json();

      if (error) throw new Error(error);

      toast.success('Platba byla smazána');
      loadPayments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete payment';
      toast.error(errorMessage);
      throw err;
    }
  }, [loadPayments]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return {
    payments,
    loading,
    error,
    loadPayments,
    createPayment,
    updatePayment,
    deletePayment,
  };
};
```

#### 6.3 Payment Status Hook

File: `src/hooks/admin/usePaymentStatus.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { MemberPaymentStatus } from '@/types';
import { toast } from 'sonner';

export const usePaymentStatus = () => {
  const [statusData, setStatusData] = useState<MemberPaymentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/member-payment-status');
      const { data, error } = await response.json();

      if (error) throw new Error(error);

      setStatusData(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load payment status';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return {
    statusData,
    loading,
    error,
    loadStatus,
  };
};
```

---

### Phase 7: UI Components - Category Fee Management

#### 7.1 Update Categories Admin Page

File: `src/app/admin/categories/page.tsx.backup`

Add new tab for "Členské poplatky" (Membership Fees) where admins can:
- View fees for all categories for current year
- Add/edit/delete fee configurations
- View historical fees by year

#### 7.2 Create Category Fee Management Component

File: `src/app/admin/categories/components/CategoryFeesTab.tsx`

```typescript
'use client';

import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Select,
  SelectItem,
  useDisclosure,
  Chip,
} from '@heroui/react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

import { useCategoryMembershipFees } from '@/hooks/admin/useCategoryMembershipFees';
import { useAppData } from '@/contexts/AppDataContext';
import { DeleteConfirmationModal } from '@/components';

import CategoryFeeFormModal from './CategoryFeeFormModal';

export default function CategoryFeesTab() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { categories } = useAppData();
  const { fees, loading, deleteFee } = useCategoryMembershipFees(selectedYear);

  const {
    isOpen: isFormOpen,
    onOpen: onFormOpen,
    onClose: onFormClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [selectedFee, setSelectedFee] = useState(null);

  // Generate year options (current year ± 5 years)
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const handleEdit = (fee) => {
    setSelectedFee(fee);
    onFormOpen();
  };

  const handleDelete = async () => {
    if (selectedFee) {
      await deleteFee(selectedFee.id);
      onDeleteClose();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Year Selector and Add Button */}
      <div className="flex justify-between items-center">
        <Select
          label="Kalendářní rok"
          selectedKeys={[selectedYear.toString()]}
          onSelectionChange={(keys) => setSelectedYear(parseInt(Array.from(keys)[0] as string))}
          className="max-w-xs"
        >
          {yearOptions.map((year) => (
            <SelectItem key={year.toString()}>{year}</SelectItem>
          ))}
        </Select>

        <Button color="primary" startContent={<PlusIcon className="w-5 h-5" />} onPress={() => {
          setSelectedFee(null);
          onFormOpen();
        }}>
          Přidat poplatek
        </Button>
      </div>

      {/* Fees Table */}
      <Table aria-label="Členské poplatky">
        <TableHeader>
          <TableColumn>KATEGORIE</TableColumn>
          <TableColumn>ČÁSTKA</TableColumn>
          <TableColumn>OBDOBÍ</TableColumn>
          <TableColumn>POPIS</TableColumn>
          <TableColumn>STAV</TableColumn>
          <TableColumn>AKCE</TableColumn>
        </TableHeader>
        <TableBody
          items={fees}
          isLoading={loading}
          emptyContent={`Žádné poplatky pro rok ${selectedYear}`}
        >
          {(fee) => {
            const category = categories?.find(c => c.id === fee.category_id);
            return (
              <TableRow key={fee.id}>
                <TableCell>{category?.name || 'Neznámá kategorie'}</TableCell>
                <TableCell>{fee.fee_amount} {fee.currency}</TableCell>
                <TableCell>{fee.fee_period}</TableCell>
                <TableCell>{fee.description || '-'}</TableCell>
                <TableCell>
                  <Chip color={fee.is_active ? 'success' : 'default'} size="sm">
                    {fee.is_active ? 'Aktivní' : 'Neaktivní'}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleEdit(fee)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => {
                        setSelectedFee(fee);
                        onDeleteOpen();
                      }}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          }}
        </TableBody>
      </Table>

      {/* Modals */}
      <CategoryFeeFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        fee={selectedFee}
        categories={categories || []}
        defaultYear={selectedYear}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDelete}
        title="Smazat členský poplatek"
        message="Opravdu chcete smazat tento členský poplatek?"
      />
    </div>
  );
}
```

#### 7.3 Create Category Fee Form Modal

File: `src/app/admin/categories/components/CategoryFeeFormModal.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Switch,
} from '@heroui/react';

import { useCategoryMembershipFees } from '@/hooks/admin/useCategoryMembershipFees';
import { Category } from '@/types';
import { FeePeriod } from '@/enums';

interface CategoryFeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  fee?: any;
  categories: Category[];
  defaultYear: number;
}

export default function CategoryFeeFormModal({
  isOpen,
  onClose,
  fee,
  categories,
  defaultYear,
}: CategoryFeeFormModalProps) {
  const { createFee, updateFee } = useCategoryMembershipFees();

  const [formData, setFormData] = useState({
    category_id: '',
    calendar_year: defaultYear,
    fee_amount: '',
    currency: 'CZK',
    fee_period: FeePeriod.YEARLY,
    description: '',
    is_active: true,
  });

  useEffect(() => {
    if (fee) {
      setFormData({
        category_id: fee.category_id,
        calendar_year: fee.calendar_year,
        fee_amount: fee.fee_amount.toString(),
        currency: fee.currency,
        fee_period: fee.fee_period,
        description: fee.description || '',
        is_active: fee.is_active,
      });
    } else {
      setFormData({
        category_id: '',
        calendar_year: defaultYear,
        fee_amount: '',
        currency: 'CZK',
        fee_period: FeePeriod.YEARLY,
        description: '',
        is_active: true,
      });
    }
  }, [fee, defaultYear]);

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        fee_amount: parseFloat(formData.fee_amount),
      };

      if (fee) {
        await updateFee({ ...data, id: fee.id });
      } else {
        await createFee(data);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save fee:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>
          {fee ? 'Upravit členský poplatek' : 'Přidat členský poplatek'}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Select
              label="Kategorie"
              selectedKeys={formData.category_id ? [formData.category_id] : []}
              onSelectionChange={(keys) =>
                setFormData({ ...formData, category_id: Array.from(keys)[0] as string })
              }
              isRequired
            >
              {categories.map((cat) => (
                <SelectItem key={cat.id}>{cat.name}</SelectItem>
              ))}
            </Select>

            <Input
              type="number"
              label="Kalendářní rok"
              value={formData.calendar_year.toString()}
              onChange={(e) =>
                setFormData({ ...formData, calendar_year: parseInt(e.target.value) })
              }
              isRequired
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Částka"
                value={formData.fee_amount}
                onChange={(e) => setFormData({ ...formData, fee_amount: e.target.value })}
                isRequired
              />

              <Input
                label="Měna"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                isRequired
              />
            </div>

            <Select
              label="Období"
              selectedKeys={[formData.fee_period]}
              onSelectionChange={(keys) =>
                setFormData({ ...formData, fee_period: Array.from(keys)[0] as string })
              }
              isRequired
            >
              <SelectItem key={FeePeriod.YEARLY}>Ročně</SelectItem>
              <SelectItem key={FeePeriod.SEMESTER}>Pololetně</SelectItem>
              <SelectItem key={FeePeriod.QUARTERLY}>Čtvrtletně</SelectItem>
              <SelectItem key={FeePeriod.MONTHLY}>Měsíčně</SelectItem>
            </Select>

            <Textarea
              label="Popis"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Volitelný popis poplatku"
            />

            <Switch
              isSelected={formData.is_active}
              onValueChange={(value) => setFormData({ ...formData, is_active: value })}
            >
              Aktivní
            </Switch>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Zrušit
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {fee ? 'Uložit' : 'Přidat'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
```

---

### Phase 8: UI Components - Member List Payment Status

#### 8.1 Update MembersInternalTab Component

File: `src/app/admin/members/components/MembersInternalTab.tsx`

**Changes needed:**
1. Add payment status column to the table
2. Fetch payment status data using `usePaymentStatus` hook
3. Display color-coded chip/badge based on payment status

```typescript
// Add to existing imports
import { usePaymentStatus } from '@/hooks/admin/usePaymentStatus';
import { getPaymentStatusColor, getPaymentStatusLabel } from '@/enums';
import { Chip } from '@heroui/react';

// Inside component, add hook
const { statusData, loading: statusLoading } = usePaymentStatus();

// Add helper function to get status for member
const getMemberPaymentStatus = (memberId: string) => {
  return statusData.find(s => s.member_id === memberId);
};

// In table columns, add:
<TableColumn>ČLENSKÝ POPLATEK</TableColumn>

// In table cell rendering, add:
<TableCell>
  {(() => {
    const status = getMemberPaymentStatus(member.id);
    if (!status) return <span className="text-gray-400">-</span>;

    return (
      <div className="flex flex-col gap-1">
        <Chip
          color={getPaymentStatusColor(status.payment_status)}
          size="sm"
          variant="flat"
        >
          {getPaymentStatusLabel(status.payment_status)}
        </Chip>
        {status.payment_status !== 'not_required' && (
          <span className="text-xs text-gray-500">
            {status.net_paid} / {status.expected_fee_amount} {status.currency || 'CZK'}
          </span>
        )}
      </div>
    );
  })()}
</TableCell>
```

---

### Phase 9: UI Components - Member Payment Card/Detail

#### 9.1 Create Member Detail Modal

File: `src/app/admin/members/components/MemberDetailModal.tsx`

```typescript
'use client';

import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Divider,
  Tabs,
  Tab,
} from '@heroui/react';

import { Member } from '@/types';

import MemberInfoTab from './MemberInfoTab';
import MemberPaymentsTab from './MemberPaymentsTab';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
}

export default function MemberDetailModal({
  isOpen,
  onClose,
  member,
}: MemberDetailModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold">
              {member.name} {member.surname}
            </h2>
            <p className="text-sm text-gray-500">{member.registration_number}</p>
          </div>
        </ModalHeader>
        <ModalBody>
          <Tabs aria-label="Member details">
            <Tab key="info" title="Informace">
              <MemberInfoTab member={member} />
            </Tab>
            <Tab key="payments" title="Členské poplatky">
              <MemberPaymentsTab member={member} />
            </Tab>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Zavřít
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
```

#### 9.2 Create Member Payments Tab

File: `src/app/admin/members/components/MemberPaymentsTab.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
  SelectItem,
  useDisclosure,
} from '@heroui/react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

import { Member } from '@/types';
import { useMemberPayments } from '@/hooks/admin/useMemberPayments';
import { getPaymentStatusColor, getPaymentStatusLabel } from '@/enums';
import { DeleteConfirmationModal } from '@/components';

import PaymentFormModal from './PaymentFormModal';

interface MemberPaymentsTabProps {
  member: Member;
}

export default function MemberPaymentsTab({ member }: MemberPaymentsTabProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { payments, loading, deletePayment } = useMemberPayments(member.id, selectedYear);

  const {
    isOpen: isFormOpen,
    onOpen: onFormOpen,
    onClose: onFormClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [selectedPayment, setSelectedPayment] = useState(null);

  // Calculate totals
  const totalPaid = payments
    .filter(p => p.fee_type !== 'refund')
    .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

  const totalRefunded = payments
    .filter(p => p.fee_type === 'refund')
    .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

  const netPaid = totalPaid - totalRefunded;

  // Year options
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    onFormOpen();
  };

  const handleDelete = async () => {
    if (selectedPayment) {
      await deletePayment(selectedPayment.id);
      onDeleteClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Celkem zaplaceno</p>
            <p className="text-2xl font-bold text-success">{formatAmount(totalPaid, 'CZK')}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Vráceno</p>
            <p className="text-2xl font-bold text-warning">{formatAmount(totalRefunded, 'CZK')}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Čistá platba</p>
            <p className="text-2xl font-bold text-primary">{formatAmount(netPaid, 'CZK')}</p>
          </CardBody>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <Select
          label="Kalendářní rok"
          selectedKeys={[selectedYear.toString()]}
          onSelectionChange={(keys) => setSelectedYear(parseInt(Array.from(keys)[0] as string))}
          className="max-w-xs"
        >
          {yearOptions.map((year) => (
            <SelectItem key={year.toString()}>{year}</SelectItem>
          ))}
        </Select>

        <Button
          color="primary"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={() => {
            setSelectedPayment(null);
            onFormOpen();
          }}
        >
          Přidat platbu
        </Button>
      </div>

      {/* Payments Table */}
      <Table aria-label="Platby členského poplatku">
        <TableHeader>
          <TableColumn>DATUM</TableColumn>
          <TableColumn>ČÁSTKA</TableColumn>
          <TableColumn>TYP</TableColumn>
          <TableColumn>ZPŮSOB PLATBY</TableColumn>
          <TableColumn>REFERENCE</TableColumn>
          <TableColumn>POZNÁMKA</TableColumn>
          <TableColumn>AKCE</TableColumn>
        </TableHeader>
        <TableBody
          items={payments}
          isLoading={loading}
          emptyContent={`Žádné platby pro rok ${selectedYear}`}
        >
          {(payment) => (
            <TableRow key={payment.id}>
              <TableCell>{formatDate(payment.payment_date)}</TableCell>
              <TableCell>
                <span className={payment.fee_type === 'refund' ? 'text-danger' : ''}>
                  {payment.fee_type === 'refund' ? '-' : ''}
                  {formatAmount(payment.amount, payment.currency)}
                </span>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">
                  {payment.fee_type}
                </Chip>
              </TableCell>
              <TableCell>{payment.payment_method || '-'}</TableCell>
              <TableCell>{payment.payment_reference || '-'}</TableCell>
              <TableCell>
                <span className="text-sm text-gray-600 line-clamp-1">
                  {payment.notes || '-'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => handleEdit(payment)}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => {
                      setSelectedPayment(payment);
                      onDeleteOpen();
                    }}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Modals */}
      <PaymentFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        payment={selectedPayment}
        member={member}
        defaultYear={selectedYear}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDelete}
        title="Smazat platbu"
        message="Opravdu chcete smazat tuto platbu?"
      />
    </div>
  );
}
```

#### 9.3 Create Payment Form Modal

File: `src/app/admin/members/components/PaymentFormModal.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react';

import { useMemberPayments } from '@/hooks/admin/useMemberPayments';
import { Member } from '@/types';
import { PaymentMethod, FeeType } from '@/enums';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment?: any;
  member: Member;
  defaultYear: number;
}

export default function PaymentFormModal({
  isOpen,
  onClose,
  payment,
  member,
  defaultYear,
}: PaymentFormModalProps) {
  const { createPayment, updatePayment } = useMemberPayments(member.id);

  const [formData, setFormData] = useState({
    member_id: member.id,
    category_id: member.category_id || '',
    calendar_year: defaultYear,
    amount: '',
    currency: 'CZK',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: PaymentMethod.CASH,
    payment_reference: '',
    fee_type: FeeType.MEMBERSHIP,
    notes: '',
    receipt_number: '',
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        member_id: payment.member_id,
        category_id: payment.category_id,
        calendar_year: payment.calendar_year,
        amount: payment.amount.toString(),
        currency: payment.currency,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        payment_reference: payment.payment_reference || '',
        fee_type: payment.fee_type,
        notes: payment.notes || '',
        receipt_number: payment.receipt_number || '',
      });
    } else {
      setFormData({
        member_id: member.id,
        category_id: member.category_id || '',
        calendar_year: defaultYear,
        amount: '',
        currency: 'CZK',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: PaymentMethod.CASH,
        payment_reference: '',
        fee_type: FeeType.MEMBERSHIP,
        notes: '',
        receipt_number: '',
      });
    }
  }, [payment, member, defaultYear]);

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (payment) {
        await updatePayment({ ...data, id: payment.id });
      } else {
        await createPayment(data);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save payment:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>
          {payment ? 'Upravit platbu' : 'Přidat platbu'}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Kalendářní rok"
                value={formData.calendar_year.toString()}
                onChange={(e) =>
                  setFormData({ ...formData, calendar_year: parseInt(e.target.value) })
                }
                isRequired
              />

              <Input
                type="date"
                label="Datum platby"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                isRequired
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Částka"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                isRequired
              />

              <Input
                label="Měna"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                isRequired
              />
            </div>

            <Select
              label="Typ platby"
              selectedKeys={[formData.fee_type]}
              onSelectionChange={(keys) =>
                setFormData({ ...formData, fee_type: Array.from(keys)[0] as string })
              }
              isRequired
            >
              <SelectItem key={FeeType.MEMBERSHIP}>Členský poplatek</SelectItem>
              <SelectItem key={FeeType.REGISTRATION}>Registrační poplatek</SelectItem>
              <SelectItem key={FeeType.ADDITIONAL}>Dodatečný poplatek</SelectItem>
              <SelectItem key={FeeType.REFUND}>Vrácení</SelectItem>
            </Select>

            <Select
              label="Způsob platby"
              selectedKeys={[formData.payment_method]}
              onSelectionChange={(keys) =>
                setFormData({ ...formData, payment_method: Array.from(keys)[0] as string })
              }
            >
              <SelectItem key={PaymentMethod.CASH}>Hotovost</SelectItem>
              <SelectItem key={PaymentMethod.BANK_TRANSFER}>Bankovní převod</SelectItem>
              <SelectItem key={PaymentMethod.CARD}>Karta</SelectItem>
              <SelectItem key={PaymentMethod.OTHER}>Jiné</SelectItem>
            </Select>

            <Input
              label="Reference platby"
              value={formData.payment_reference}
              onChange={(e) =>
                setFormData({ ...formData, payment_reference: e.target.value })
              }
              placeholder="Číslo transakce, šeku, atd."
            />

            <Input
              label="Číslo dokladu"
              value={formData.receipt_number}
              onChange={(e) =>
                setFormData({ ...formData, receipt_number: e.target.value })
              }
              placeholder="Volitelné"
            />

            <Textarea
              label="Poznámka"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Volitelná poznámka k platbě"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Zrušit
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {payment ? 'Uložit' : 'Přidat'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
```

---

### Phase 10: Testing & Documentation

#### 10.1 Testing Checklist

**Database:**
- [ ] Migration runs successfully
- [ ] All tables created with correct structure
- [ ] RLS policies work correctly
- [ ] Indexes created
- [ ] Views return correct data
- [ ] Functions work as expected
- [ ] Triggers fire correctly

**Category Fee Management:**
- [ ] Admin can create fee configuration
- [ ] Admin can view fees by year
- [ ] Admin can update fee configuration
- [ ] Admin can delete fee configuration
- [ ] Duplicate fee prevention works (unique constraint)
- [ ] Only admins have access

**Payment Recording:**
- [ ] Admin can add payment for member
- [ ] Admin can edit payment
- [ ] Admin can delete payment
- [ ] Multiple payments per year supported
- [ ] Refunds are calculated correctly
- [ ] Payment date validation works

**Payment Status Display:**
- [ ] Member list shows correct status colors
- [ ] Green for fully paid
- [ ] Orange/Yellow for partially paid
- [ ] Red for unpaid
- [ ] Gray for not required
- [ ] Amounts display correctly

**Member Detail:**
- [ ] Payment history loads correctly
- [ ] Payments filtered by year
- [ ] Summary totals calculated correctly
- [ ] CRUD operations work
- [ ] Modal forms validate input

**Edge Cases:**
- [ ] Member without category (no fee required)
- [ ] Category without fee configuration
- [ ] Multiple payments in same year
- [ ] Payments exceeding expected amount
- [ ] Refunds larger than payments
- [ ] Year changes handle correctly
- [ ] Currency conversion (if needed)

#### 10.2 Documentation

Create user guide: `docs/MEMBERSHIP_FEE_SYSTEM_USER_GUIDE.md`

**Contents:**
1. Overview of the system
2. How to configure fees per category
3. How to record payments
4. How to view payment status
5. How to generate reports
6. Common tasks and workflows

---

## Implementation Timeline

### Week 1: Database & Backend
- [ ] Create database migration
- [ ] Test migration locally
- [ ] Create views and functions
- [ ] Add type definitions
- [ ] Create API endpoints
- [ ] Test APIs with Postman/Insomnia

### Week 2: Category Fee Management
- [ ] Create hooks for category fees
- [ ] Build category fee tab UI
- [ ] Build category fee form modal
- [ ] Test CRUD operations
- [ ] Add validation

### Week 3: Payment Recording & Display
- [ ] Create hooks for member payments
- [ ] Update member list with status column
- [ ] Build member detail modal
- [ ] Build member payments tab
- [ ] Build payment form modal
- [ ] Test all operations

### Week 4: Testing & Polish
- [ ] Comprehensive testing
- [ ] Fix bugs
- [ ] Refine UI/UX
- [ ] Add loading states
- [ ] Add error handling
- [ ] Performance optimization

### Week 5: Documentation & Deployment
- [ ] Write user documentation
- [ ] Create admin guide
- [ ] Record demo video (optional)
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production

---

## Technical Considerations

### Performance
- Indexes on all foreign keys and frequently queried columns
- Materialized view for complex aggregations (if needed)
- Pagination for large payment lists
- Lazy loading of payment history

### Security
- RLS policies enforce access control
- Admins can manage all fees and payments
- Coaches can only view data for their categories
- Audit trail with created_by/updated_by fields
- Input validation on all forms

### Data Integrity
- Foreign key constraints prevent orphaned records
- Check constraints ensure valid amounts (positive, within range)
- Unique constraints prevent duplicate fee configurations
- ON DELETE CASCADE for cleanup
- ON DELETE RESTRICT to prevent accidental category deletion with fees

### Scalability
- Current design supports thousands of members and payments
- Queries optimized with proper indexes
- Views calculated on-demand (or materialized if needed)
- Archive old payments after X years (if needed)

### Accessibility
- Keyboard navigation
- Screen reader support
- ARIA labels
- Color indicators supplemented with text
- High contrast mode support

### Mobile Responsiveness
- Tables responsive or scrollable
- Forms work on mobile
- Touch-friendly controls
- Readable on small screens

---

## Alternative Approaches

### 1. Extension of member_metadata (Not Chosen)
**Reason:** Lacks flexibility, no historical tracking, mixes concerns

### 2. Single payments table without category fees (Not Chosen)
**Reason:** No central fee configuration, harder to manage

### 3. Complex financial module (Not Chosen)
**Reason:** Over-engineering for current needs, can evolve later

---

## Future Enhancements (Out of Scope)

1. **Automated Payment Reminders**
   - Email reminders for unpaid fees
   - Scheduled notifications before due dates

2. **Payment Plans**
   - Installment payments
   - Custom payment schedules

3. **Online Payment Integration**
   - Payment gateway integration
   - Automated payment recording

4. **Reporting & Analytics**
   - Financial reports
   - Payment trends
   - Export to Excel/PDF

5. **Receipt Generation**
   - PDF receipt generation
   - Automated email sending

6. **Late Fees**
   - Automatic late fee calculation
   - Penalty tracking

7. **Family Discounts**
   - Multi-member discounts
   - Sibling discounts

8. **Budget vs Actual**
   - Expected revenue tracking
   - Variance analysis

---

## Questions for Stakeholders

1. **Fee Configuration:**
   - Should fees vary by period (yearly, semester, etc.)?
   - Should there be different fee types (registration vs. membership)?
   - How far back should historical fees be tracked?

2. **Payment Methods:**
   - What payment methods are used?
   - Do we need to track bank transaction IDs?
   - Are receipts numbered?

3. **Status Thresholds:**
   - What percentage paid counts as "partial"? (Currently: any amount > 0 and < expected)
   - Should there be a grace period before marking as unpaid?

4. **Permissions:**
   - Can coaches view payment status for their teams?
   - Can coaches record payments?
   - Or is it admin-only?

5. **Reporting:**
   - What reports are needed?
   - Export requirements?
   - Frequency of reporting?

---

## Conclusion

This plan extends the existing database structure with two new related tables, providing a flexible and scalable solution for membership fee tracking. The implementation follows existing patterns in the codebase (separate metadata tables, RLS policies, typed APIs, HeroUI components) and integrates seamlessly with the current member management system.

**Recommended Next Steps:**
1. Review and approve this plan
2. Answer stakeholder questions
3. Create and test database migration
4. Begin Phase 1 implementation

---

**Document Version:** 1.0
**Date:** 2025-10-16
**Author:** Claude Code Analysis
**Status:** Proposal - Awaiting Approval
