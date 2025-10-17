# MembersListTab Refactoring Plan

**Date**: 2025-10-17
**Component**: `src/app/admin/members/components/MembersListTab.tsx`
**Current Size**: 865 lines
**Status**: ⚠️ Needs Refactoring

---

## Executive Summary

The `MembersListTab` component violates project standards and best practices. It mixes data fetching, business logic, UI rendering, and state management in a single 865-line file. This refactoring plan outlines how to bring it in line with the codebase's established patterns.

---

## Current Issues

### 1. **Architecture Violations**

| Issue | Current State | Project Standard |
|-------|--------------|------------------|
| **Component Size** | 865 lines | ~200-300 lines |
| **Data Sources** | 2 separate (members + payment status) | Single unified source |
| **Data Fetching** | Mixed (Context + Hook) | Consistent pattern |
| **Business Logic** | Embedded in component | Extracted to hooks |
| **Cell Rendering** | Switch statement in component | Separate cell components |

### 2. **Performance Issues**

```typescript
// ❌ Current: O(n*m) lookup on every cell render
const getMemberPaymentStatus = (memberId: string) => {
  return statusData.find((s) => s.member_id === memberId);
};

// ❌ Forces full table remount when payment data loads
<Table key={`table-${statusData.length}`} />
```

**Problems**:
- Table remounts entirely when payment status loads (loses state)
- N+1 lookup pattern: every cell does a `.find()` on statusData array
- No memoization for cell content
- Multiple re-renders as data loads asynchronously

### 3. **Data Consistency Issues**

```typescript
// ❌ Two separate data sources loaded independently
const {members} = useAppData();              // Source 1: Context
const {statusData} = usePaymentStatus();     // Source 2: API Hook

// ❌ Manual synchronization required
const status = getMemberPaymentStatus(member.id);
```

**Problems**:
- Race conditions (members load before payment status)
- Stale data (refreshing members doesn't refresh payment status)
- No error correlation (which data source failed?)
- Temporal coupling (payment status must load after members)

### 4. **Code Organization Issues**

**Component Responsibilities** (violates Single Responsibility Principle):
- ❌ Data fetching (2 sources)
- ❌ Business logic (sorting, filtering, pagination)
- ❌ State management (8 modal states, form data, filters)
- ❌ Cell rendering (500+ lines of switch statement)
- ❌ CRUD operations (add, edit, delete, bulk edit)
- ❌ Event handlers (15+ handler functions)

**Testability**: ⚠️ Difficult
- Cannot unit test business logic independently
- Requires mocking multiple contexts and hooks
- Cell rendering logic is tightly coupled

---

## Project Standards Analysis

Based on codebase exploration, here are the established patterns:

### **Standard Pattern: Three-Layer Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                    UI Components Layer                   │
│  - Presentation only (no business logic)                │
│  - Receives data as props                               │
│  - Fires callbacks for actions                          │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────┐
│                Business Logic Hooks Layer                │
│  - Data transformation & aggregation                    │
│  - Filtering, sorting, pagination                       │
│  - Combines multiple data sources                       │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────┐
│                   Data Fetching Layer                    │
│  - Raw API calls                                        │
│  - Simple CRUD operations                               │
│  - Caching & request deduplication                      │
└─────────────────────────────────────────────────────────┘
```

### **Standard Pattern: File Organization**

```
src/
├── app/api/
│   └── members-with-payment-status/
│       └── route.ts                    # API endpoint
├── hooks/
│   └── entities/
│       └── member/
│           ├── data/
│           │   └── useMembersWithPaymentStatus.ts
│           └── business/
│               ├── useMembersTable.ts
│               └── useMemberModals.ts
├── app/admin/members/components/
│   ├── MembersListTab.tsx             # Main component (~200 lines)
│   ├── MembersTableHeader.tsx
│   ├── MembersTableFilters.tsx
│   ├── MembersTable.tsx
│   └── cells/
│       ├── MembershipFeeCell.tsx
│       ├── StatusCell.tsx
│       └── ActionsCell.tsx
└── types/
    └── entities/
        └── member/
            └── memberWithPaymentStatus.ts
```

---

## Proposed Solution

### **Phase 1: Database Layer (Foundation)**

#### **1.1: Add `is_active` Column to Members Table**

**File**: `scripts/migrations/20251017_add_is_active_to_members.sql`

```sql
-- =====================================================
-- Add is_active column to members table
-- =====================================================

-- Add the column (defaults to TRUE for existing members)
ALTER TABLE members
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;

-- Add comment
COMMENT ON COLUMN members.is_active IS 'Indicates if member is currently active in the club. Independent of functions - a member can be active without having functions assigned.';

-- Create index for filtering active members
CREATE INDEX IF NOT EXISTS idx_members_is_active
  ON members(is_active);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_members_active_category
  ON members(is_active, category_id)
  WHERE is_active = TRUE;

-- =====================================================
-- Backfill is_active based on current business logic
-- =====================================================

-- IMPORTANT: Current logic uses functions array to determine active status
-- This migration preserves that logic for existing data

-- Mark members with functions as active (already TRUE by default)
-- Mark members without functions as inactive
UPDATE members
SET is_active = FALSE
WHERE (functions IS NULL OR array_length(functions, 1) IS NULL OR array_length(functions, 1) = 0);

-- Show migration stats
DO $$
DECLARE
  active_count INTEGER;
  inactive_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count FROM members WHERE is_active = TRUE;
  SELECT COUNT(*) INTO inactive_count FROM members WHERE is_active = FALSE;

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - Active members: %', active_count;
  RAISE NOTICE '  - Inactive members: %', inactive_count;
END $$;
```

**Why This Change?**

Current problematic pattern:
```typescript
// ❌ Business logic in presentation layer
<div className={`${
  member.functions && member.functions.length > 0 ? 'bg-green-500' : 'bg-red-500'
}`} />
```

**Problems**:
1. **Semantic confusion**: `functions` array represents *roles*, not *membership status*
2. **Data integrity**: Can't have active member without functions (artificial constraint)
3. **Business logic leak**: UI has to know how to determine active status
4. **Querying difficulty**: Can't filter `WHERE is_active = TRUE` (must check array)
5. **Inconsistency**: Some components might interpret "active" differently

**After migration**:
```typescript
// ✅ Clean semantic meaning
<div className={`${member.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
```

**Migration Strategy**:
- Default all existing members to `TRUE` (backwards compatible)
- Mark members with empty `functions` array as `FALSE` (preserves current behavior)
- Going forward, `is_active` is managed independently of `functions`

**Business Rules (Document for team)**:
- ✅ Active member CAN have no functions (e.g., new member not yet assigned)
- ✅ Inactive member CAN have functions (e.g., temporarily suspended)
- ✅ `is_active` represents membership status, not role assignment
- ✅ Use cases:
  - Active + No functions = New member / Transitioning roles
  - Active + Has functions = Normal active member
  - Inactive + Has functions = Suspended but role preserved
  - Inactive + No functions = Departed member

**Estimated Time**: 30 minutes

---

#### **1.2: Create Consolidated Database View**

**File**: `scripts/migrations/20251017_create_members_with_payment_status_view.sql`

```sql
-- =====================================================
-- Create consolidated view for members with payment status
-- =====================================================

CREATE OR REPLACE VIEW members_with_payment_status AS
SELECT
  -- Member fields
  m.id,
  m.registration_number,
  m.name,
  m.surname,
  m.date_of_birth,
  m.sex,
  m.category_id,
  m.functions,
  m.is_active,        -- Now using the proper column
  m.is_external,
  m.created_at,
  m.updated_at,

  -- Category info
  c.name as category_name,

  -- Payment status (current year)
  COALESCE(mfs.payment_status, 'not_required') as payment_status,
  COALESCE(mfs.expected_fee_amount, 0) as expected_fee_amount,
  COALESCE(mfs.net_paid, 0) as net_paid,
  COALESCE(mfs.total_paid, 0) as total_paid,
  COALESCE(mfs.total_refunded, 0) as total_refunded,
  mfs.last_payment_date,
  mfs.payment_count,
  COALESCE(mfs.currency, 'CZK') as currency,
  COALESCE(mfs.calendar_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER) as payment_year

FROM members m
LEFT JOIN categories c ON m.category_id = c.id
LEFT JOIN member_fee_status mfs ON m.id = mfs.member_id

WHERE m.is_active = TRUE;  -- Filter using proper is_active column

-- Add comment
COMMENT ON VIEW members_with_payment_status IS
  'Unified view of active members with their payment status for the current year. ' ||
  'Uses is_active column to filter, not functions array.';

-- Add indexes for view performance
CREATE INDEX IF NOT EXISTS idx_members_category_active
  ON members(category_id, is_active)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_member_fee_status_member_id
  ON member_fee_status(member_id);

-- Update RLS policies (security invoker means view uses caller's permissions)
ALTER VIEW members_with_payment_status SET (security_invoker = on);

-- Grant permissions (adjust based on your RLS setup)
-- GRANT SELECT ON members_with_payment_status TO authenticated;
```

**Benefits**:
- ✅ Single data source (no synchronization needed)
- ✅ Atomic reads (consistent data)
- ✅ Database-level join optimization
- ✅ Indexed for performance
- ✅ Can add computed fields easily
- ✅ Proper semantic filtering with `is_active`
- ✅ Clear separation: `is_active` = membership status, `functions` = roles

**Estimated Time**: 30 minutes

---

#### **1.3: Update Application Code to Use `is_active`**

**Files to update**:

1. **Member type definition**: Already has `is_active?: boolean` ✅

2. **Components using function-based active check**:
   ```typescript
   // ❌ OLD pattern (search for this in codebase)
   member.functions && member.functions.length > 0

   // ✅ NEW pattern
   member.is_active
   ```

3. **Common locations** (use `grep -r "member.functions && member.functions.length" src/`):
   - `MembersListTab.tsx` line 461-462 (status indicator)
   - Any other components checking "active" status
   - Form validation logic
   - Filtering logic

**Migration Code Example**:

```typescript
// In MembersListTab.tsx (line ~461)

// ❌ BEFORE
case 'status':
  return (
    <div className="flex items-center justify-center">
      <div
        className={`w-3 h-3 rounded-full ${
          member.functions && member.functions.length > 0 ? 'bg-green-500' : 'bg-red-500'
        }`}
        title={
          member.functions && member.functions.length > 0 ? 'Aktivní člen' : 'Neaktivní člen'
        }
      />
    </div>
  );

// ✅ AFTER
case 'status':
  return (
    <div className="flex items-center justify-center">
      <div
        className={`w-3 h-3 rounded-full ${
          member.is_active ? 'bg-green-500' : 'bg-red-500'
        }`}
        title={member.is_active ? 'Aktivní člen' : 'Neaktivní člen'}
      />
    </div>
  );
```

**Or better yet, extract to a component**:

```typescript
// src/app/admin/members/components/cells/StatusCell.tsx
interface StatusCellProps {
  isActive: boolean;
}

export const StatusCell: React.FC<StatusCellProps> = ({isActive}) => (
  <div className="flex items-center justify-center">
    <div
      className={`w-3 h-3 rounded-full ${
        isActive ? 'bg-green-500' : 'bg-red-500'
      }`}
      title={isActive ? 'Aktivní člen' : 'Neaktivní člen'}
    />
  </div>
);
```

**Estimated Time**: 30 minutes

---

**Total Phase 1 Time**: 1.5 hours → **2 hours** (with is_active migration)

---

#### **1.2: Create API Endpoint**

**File**: `src/app/api/members-with-payment-status/route.ts`

```typescript
import {createClient} from '@/utils/supabase/server';
import {NextResponse} from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    // Fetch from view
    const {data, error} = await supabase
      .from('members_with_payment_status')
      .select('*')
      .order('surname', {ascending: true});

    if (error) {
      console.error('Error fetching members with payment status:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({data, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
```

**Estimated Time**: 30 minutes

---

### **Phase 2: Type Definitions**

**File**: `src/types/entities/member/data/memberWithPaymentStatus.ts`

```typescript
import {Member} from './member';
import {PaymentStatus} from '../../membershipFee/membershipFeePayment';

export interface MemberWithPaymentStatus extends Member {
  // Category fields
  category_name: string;

  // Payment status fields
  payment_status: PaymentStatus;
  expected_fee_amount: number;
  net_paid: number;
  total_paid: number;
  total_refunded: number;
  last_payment_date: string | null;
  payment_count: number;
  currency: string;
  payment_year: number;
}

export type MemberFilters = {
  sex: string;
  category_id: string;
  function: string;
};

export type MemberSortDescriptor = {
  column: string;
  direction: 'ascending' | 'descending';
};
```

**File**: `src/types/index.ts` (update exports)

```typescript
export type {MemberWithPaymentStatus, MemberFilters, MemberSortDescriptor} from './entities/member/data/memberWithPaymentStatus';
```

**Estimated Time**: 15 minutes

---

### **Phase 3: Data Fetching Hook**

**File**: `src/hooks/entities/member/data/useMembersWithPaymentStatus.ts`

```typescript
import {useState, useEffect, useCallback} from 'react';
import {showToast} from '@/components';
import {MemberWithPaymentStatus} from '@/types';

export const useMembersWithPaymentStatus = () => {
  const [data, setData] = useState<MemberWithPaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/members-with-payment-status');
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load members';
      setError(errorMessage);
      showToast.danger(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
  };
};
```

**Estimated Time**: 30 minutes

---

### **Phase 4: Business Logic Hooks**

#### **4.1: Table State Management Hook**

**File**: `src/hooks/entities/member/business/useMembersTable.ts`

```typescript
import {useState, useMemo} from 'react';
import {MemberWithPaymentStatus, MemberFilters, MemberSortDescriptor} from '@/types';
import {useDebounce} from '@/hooks';
import {Genders, MemberFunction} from '@/enums';

const ROWS_PER_PAGE = 10;

export const useMembersTable = (members: MemberWithPaymentStatus[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<MemberFilters>({
    sex: Genders.EMPTY,
    category_id: '',
    function: '',
  });
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<MemberSortDescriptor>({
    column: 'surname',
    direction: 'ascending',
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtered members
  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Search filter
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(term) ||
          member.surname.toLowerCase().includes(term) ||
          (member.registration_number && member.registration_number.toLowerCase().includes(term))
      );
    }

    // Sex filter
    if (filters.sex && filters.sex !== Genders.EMPTY) {
      filtered = filtered.filter((member) => member.sex === filters.sex);
    }

    // Category filter
    if (filters.category_id) {
      filtered = filtered.filter((member) => member.category_id === filters.category_id);
    }

    // Function filter
    if (filters.function) {
      filtered = filtered.filter(
        (member) =>
          member.functions && member.functions.includes(filters.function as MemberFunction)
      );
    }

    return filtered;
  }, [members, debouncedSearchTerm, filters]);

  // Sorted members
  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof MemberWithPaymentStatus];
      const second = b[sortDescriptor.column as keyof MemberWithPaymentStatus];

      if (first === null || second === null) return 0;

      if (typeof first === 'string' && typeof second === 'string') {
        return sortDescriptor.direction === 'ascending'
          ? first.localeCompare(second)
          : second.localeCompare(first);
      }

      if (typeof first === 'number' && typeof second === 'number') {
        return sortDescriptor.direction === 'ascending' ? first - second : second - first;
      }

      // Special handling for registration numbers
      if (sortDescriptor.column === 'registration_number') {
        const extractNumber = (str: string) => {
          const match = str.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        };
        const numA = extractNumber(first as string);
        const numB = extractNumber(second as string);
        return sortDescriptor.direction === 'ascending' ? numA - numB : numB - numA;
      }

      return 0;
    });
  }, [filteredMembers, sortDescriptor]);

  // Paginated members
  const paginatedMembers = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    return sortedMembers.slice(start, end);
  }, [sortedMembers, page]);

  const totalPages = Math.ceil(filteredMembers.length / ROWS_PER_PAGE);

  const clearFilters = () => {
    setFilters({
      sex: Genders.EMPTY,
      category_id: '',
      function: '',
    });
  };

  return {
    // State
    searchTerm,
    filters,
    page,
    sortDescriptor,

    // Setters
    setSearchTerm,
    setFilters,
    setPage,
    setSortDescriptor,
    clearFilters,

    // Computed data
    filteredMembers,
    sortedMembers,
    paginatedMembers,
    totalPages,
    totalCount: filteredMembers.length,
  };
};
```

**Estimated Time**: 1 hour

---

#### **4.2: Modal Management Hook**

**File**: `src/hooks/entities/member/business/useMemberModals.ts`

```typescript
import {useState} from 'react';
import {useDisclosure} from '@heroui/react';
import {Member} from '@/types';
import {Genders} from '@/enums';

interface UseMemberModalsProps {
  onSuccess: () => void;
}

export const useMemberModals = ({onSuccess}: UseMemberModalsProps) => {
  // Modal states
  const addModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const detailModal = useDisclosure();
  const bulkEditModal = useDisclosure();

  // Selected data
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  // Form data
  const [formData, setFormData] = useState<Member>({
    registration_number: '',
    name: '',
    surname: '',
    date_of_birth: undefined,
    category_id: '',
    sex: Genders.MALE,
    functions: [],
    id: '',
    created_at: '',
    updated_at: '',
    is_external: false,
    is_active: true,
  });

  const [bulkEditFormData, setBulkEditFormData] = useState({
    sex: Genders.EMPTY,
    category: '',
    functions: [] as string[],
  });

  // Open handlers
  const openAdd = () => {
    setFormData({
      registration_number: '',
      name: '',
      surname: '',
      date_of_birth: undefined,
      category_id: '',
      sex: Genders.MALE,
      functions: [],
      id: '',
      created_at: '',
      updated_at: '',
      is_external: false,
      is_active: true,
    });
    addModal.onOpen();
  };

  const openEdit = (member: Member) => {
    setSelectedMember(member);
    setFormData({
      registration_number: member.registration_number || '',
      name: member.name,
      surname: member.surname,
      date_of_birth: member.date_of_birth || '',
      category_id: member.category_id,
      sex: member.sex,
      functions: member.functions || [],
      id: member.id,
      created_at: member.created_at,
      updated_at: member.updated_at,
      is_external: member.is_external || false,
      is_active: member.is_active !== undefined ? member.is_active : true,
    });
    editModal.onOpen();
  };

  const openDelete = (member: Member) => {
    setSelectedMember(member);
    deleteModal.onOpen();
  };

  const openDetail = (member: Member) => {
    setSelectedMember(member);
    detailModal.onOpen();
  };

  const openBulkEdit = () => {
    if (selectedMembers.size === 0) return;
    bulkEditModal.onOpen();
  };

  // Close handlers with cleanup
  const closeAdd = () => {
    addModal.onClose();
  };

  const closeEdit = () => {
    setSelectedMember(null);
    editModal.onClose();
  };

  const closeDelete = () => {
    setSelectedMember(null);
    deleteModal.onClose();
  };

  const closeDetail = () => {
    setSelectedMember(null);
    detailModal.onClose();
  };

  const closeBulkEdit = () => {
    setSelectedMembers(new Set());
    setBulkEditFormData({
      sex: Genders.EMPTY,
      category: '',
      functions: [],
    });
    bulkEditModal.onClose();
  };

  return {
    // Modal states
    addModal: {...addModal, onClose: closeAdd},
    editModal: {...editModal, onClose: closeEdit},
    deleteModal: {...deleteModal, onClose: closeDelete},
    detailModal: {...detailModal, onClose: closeDetail},
    bulkEditModal: {...bulkEditModal, onClose: closeBulkEdit},

    // Open handlers
    openAdd,
    openEdit,
    openDelete,
    openDetail,
    openBulkEdit,

    // Selected data
    selectedMember,
    selectedMembers,
    setSelectedMembers,

    // Form data
    formData,
    setFormData,
    bulkEditFormData,
    setBulkEditFormData,

    // Success callback
    onSuccess,
  };
};
```

**Estimated Time**: 1 hour

---

### **Phase 5: UI Component Extraction**

#### **5.1: Cell Components**

**File**: `src/app/admin/members/components/cells/MembershipFeeCell.tsx`

```typescript
import React from 'react';
import {Chip} from '@heroui/react';
import {getPaymentStatusColor, getPaymentStatusLabel} from '@/enums/membershipFeeStatus';
import {PaymentStatus} from '@/types';

interface MembershipFeeCellProps {
  paymentStatus: PaymentStatus;
  netPaid: number;
  expectedFeeAmount: number;
  currency: string;
}

export const MembershipFeeCell: React.FC<MembershipFeeCellProps> = ({
  paymentStatus,
  netPaid,
  expectedFeeAmount,
  currency,
}) => {
  if (paymentStatus === 'not_required') {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <Chip color={getPaymentStatusColor(paymentStatus)} size="sm" variant="flat">
        {getPaymentStatusLabel(paymentStatus)}
      </Chip>
      <span className="text-xs text-gray-500">
        {netPaid} / {expectedFeeAmount} {currency}
      </span>
    </div>
  );
};
```

**File**: `src/app/admin/members/components/cells/index.ts`

```typescript
export {MembershipFeeCell} from './MembershipFeeCell';
export {StatusCell} from './StatusCell';
export {ActionsCell} from './ActionsCell';
// ... other cell exports
```

**Estimated Time**: 1 hour for all cell components

---

#### **5.2: Sub-Components**

**File**: `src/app/admin/members/components/MembersTableHeader.tsx`

```typescript
import React from 'react';
import {Button} from '@heroui/react';
import {PencilIcon, PlusIcon} from '@heroicons/react/24/outline';

interface MembersTableHeaderProps {
  selectedCount: number;
  onBulkEdit: () => void;
  onAddMember: () => void;
  onImportComplete: () => void;
  categories: Record<string, string>;
  sexOptions: Record<string, string>;
}

export const MembersTableHeader: React.FC<MembersTableHeaderProps> = ({
  selectedCount,
  onBulkEdit,
  onAddMember,
  onImportComplete,
  categories,
  sexOptions,
}) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Seznam členů</h2>
      <div className="flex gap-2">
        <Button
          color="secondary"
          variant="flat"
          onPress={onBulkEdit}
          isDisabled={selectedCount === 0}
          startContent={<PencilIcon className="w-4 h-4" />}
        >
          Hromadná úprava ({selectedCount})
        </Button>
        <MembersCsvImport
          onImportComplete={onImportComplete}
          categories={categories}
          sexOptions={sexOptions}
        />
        <Button
          color="primary"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={onAddMember}
          isDisabled={Object.keys(categories).length === 0}
        >
          Přidat člena
        </Button>
      </div>
    </div>
  );
};
```

**File**: `src/app/admin/members/components/MembersTableFilters.tsx`
**File**: `src/app/admin/members/components/MembersTable.tsx`

**Estimated Time**: 2 hours for all sub-components

---

### **Phase 6: Main Component Refactoring**

**File**: `src/app/admin/members/components/MembersListTab.tsx` (Refactored - ~200 lines)

```typescript
import React from 'react';
import {useMembersWithPaymentStatus} from '@/hooks/entities/member/data/useMembersWithPaymentStatus';
import {useMembersTable} from '@/hooks/entities/member/business/useMembersTable';
import {useMemberModals} from '@/hooks/entities/member/business/useMemberModals';
import {MembersTableHeader} from './MembersTableHeader';
import {MembersTableFilters} from './MembersTableFilters';
import {MembersTable} from './MembersTable';
import {MemberModals} from './MemberModals';
import {Category} from '@/types';

interface MembersListTabProps {
  categoriesData: Category[] | null;
  sexOptions: Record<string, string>;
}

export default function MembersListTab({categoriesData, sexOptions}: MembersListTabProps) {
  // Data fetching
  const {data: members, loading, error, refresh} = useMembersWithPaymentStatus();

  // Table state management
  const tableState = useMembersTable(members);

  // Modal management
  const modals = useMemberModals({onSuccess: refresh});

  // Convert categories for compatibility
  const categories = useMemo(() => {
    if (!categoriesData) return {};
    return categoriesData.reduce(
      (acc, category) => {
        acc[category.id] = category.name;
        return acc;
      },
      {} as Record<string, string>
    );
  }, [categoriesData]);

  return (
    <div className="flex flex-col gap-6">
      <MembersTableHeader
        selectedCount={modals.selectedMembers.size}
        onBulkEdit={modals.openBulkEdit}
        onAddMember={modals.openAdd}
        onImportComplete={refresh}
        categories={categories}
        sexOptions={sexOptions}
      />

      <MembersTableFilters
        searchTerm={tableState.searchTerm}
        onSearchChange={tableState.setSearchTerm}
        filters={tableState.filters}
        onFiltersChange={tableState.setFilters}
        onClearFilters={tableState.clearFilters}
        categories={categoriesData}
      />

      <MembersTable
        members={tableState.paginatedMembers}
        loading={loading}
        selectedMembers={modals.selectedMembers}
        onSelectionChange={modals.setSelectedMembers}
        sortDescriptor={tableState.sortDescriptor}
        onSortChange={tableState.setSortDescriptor}
        page={tableState.page}
        totalPages={tableState.totalPages}
        onPageChange={tableState.setPage}
        onEdit={modals.openEdit}
        onDelete={modals.openDelete}
        onView={modals.openDetail}
        categories={categories}
      />

      <MemberModals
        modals={modals}
        categories={categoriesData || []}
        sexOptions={sexOptions}
        onRefresh={refresh}
      />
    </div>
  );
}
```

**Estimated Time**: 1.5 hours

---

### **Phase 7: Cleanup & Migration**

1. **Remove old code**:
   - Remove `usePaymentStatus` hook (if not used elsewhere)
   - Remove temporary `key={`table-${statusData.length}`}` hack
   - Remove debug console.logs
   - Update imports

2. **Update AppDataContext** (optional):
   - Consider moving members to use the new view
   - Or keep separate for backwards compatibility

3. **Testing**:
   - Test all CRUD operations
   - Test filtering, sorting, pagination
   - Test bulk operations
   - Performance testing
   - Error handling

**Estimated Time**: 2 hours

---

## Implementation Timeline

| Phase | Description | Time | Dependencies |
|-------|-------------|------|--------------|
| **Phase 1** | Database & API | 1.5h | Database access |
| **Phase 2** | Type Definitions | 0.25h | Phase 1 |
| **Phase 3** | Data Hook | 0.5h | Phase 1, 2 |
| **Phase 4** | Business Hooks | 2h | Phase 3 |
| **Phase 5** | UI Components | 3h | Phase 4 |
| **Phase 6** | Main Component | 1.5h | Phase 5 |
| **Phase 7** | Cleanup & Testing | 2h | Phase 6 |
| **Total** | | **~11 hours** | |

---

## Benefits After Refactoring

### **Code Quality**
- ✅ Main component: **865 → ~200 lines** (76% reduction)
- ✅ Follows Single Responsibility Principle
- ✅ Clear separation of concerns
- ✅ Consistent with project patterns

### **Performance**
- ✅ No table remounting (removes key hack)
- ✅ O(1) payment status lookup (pre-joined)
- ✅ Proper React memoization
- ✅ Single database query instead of 2 API calls

### **Maintainability**
- ✅ Easy to test (isolated hooks)
- ✅ Reusable hooks & components
- ✅ Type-safe everywhere
- ✅ Clear data flow

### **Developer Experience**
- ✅ Easier to understand (smaller files)
- ✅ Easier to modify (isolated changes)
- ✅ Easier to debug (clear boundaries)
- ✅ Better IDE support (smaller files load faster)

---

## Migration Strategy

### **Option A: Big Bang (Recommended)**
Replace entire component in one PR:
- ✅ Clean break from old code
- ✅ All benefits immediately
- ✅ Easier to review (clear before/after)
- ⚠️ Higher risk if issues arise

### **Option B: Incremental**
Refactor piece by piece:
1. Extract hooks first
2. Extract UI components
3. Connect everything
4. Remove old code

- ✅ Lower risk per change
- ✅ Can test incrementally
- ⚠️ More PRs to manage
- ⚠️ Temporary mixed patterns

---

## Testing Checklist

- [ ] Database view returns correct data
- [ ] API endpoint requires authentication
- [ ] Data hook loads and caches correctly
- [ ] Filtering works (search, sex, category, function)
- [ ] Sorting works (all columns)
- [ ] Pagination works (page changes)
- [ ] Add member works
- [ ] Edit member works
- [ ] Delete member works
- [ ] Bulk edit works
- [ ] CSV import works
- [ ] Payment status displays correctly
- [ ] Performance is acceptable (< 500ms render)
- [ ] No memory leaks
- [ ] Error handling works

---

## Rollback Plan

If issues occur after deployment:

1. **Quick Fix**: Revert to previous commit
2. **Database**: View is non-destructive (can drop without data loss)
3. **API**: Old endpoints still exist (can redirect)
4. **Monitoring**: Check error rates in production

---

## Future Enhancements

After refactoring, these become easier:

1. **Add real-time updates**: WebSocket subscription to view
2. **Add column customization**: User-selected visible columns
3. **Add export functionality**: CSV/PDF export from view
4. **Add advanced search**: Full-text search on view
5. **Add member history**: Audit log from view changes
6. **Performance optimization**: Materialized view for faster queries

---

## Questions & Decisions

### **Q1: Should we update AppDataContext to use the new view?**
**Decision**: No, keep AppDataContext as-is for backwards compatibility. The new view is specific to the members list table.

### **Q2: What about other components that use `usePaymentStatus`?**
**Decision**: Check usage with `grep -r "usePaymentStatus" src/`. If used elsewhere, keep the hook. Otherwise, deprecate it.

### **Q3: Should we cache the unified data in Context?**
**Decision**: No, keep it component-local for now. If other components need it, add to Context later.

### **Q4: What about the column visibility issue (horizontal scroll)?**
**Decision**: Address in Phase 5 with responsive design. Consider making columns toggleable in future.

---

## Approval & Sign-off

- [ ] Technical Lead Review
- [ ] Architecture Approval
- [ ] Database Migration Approved
- [ ] Testing Strategy Approved
- [ ] Deployment Plan Approved

---

## References

- Original component: `src/app/admin/members/components/MembersListTab.tsx`
- Project patterns documentation: Codebase exploration (Oct 17, 2025)
- Database view plan: `docs/MEMBERSHIP_FEE_PAYMENT_SYSTEM_PLAN.md`

---

**Document Status**: Draft
**Last Updated**: 2025-10-17
**Next Review**: After Phase 1 completion