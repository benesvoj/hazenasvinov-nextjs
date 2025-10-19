# MembersListTab Component Refactoring Plan

## Executive Summary

**Current State:** The `MembersListTab.tsx` component is a 840+ line monolithic component that mixes business logic, data fetching, UI rendering, and state management.

**Target State:** A lean, maintainable component (~150-200 lines) that follows project standards by leveraging existing hooks, API patterns, and proper separation of concerns.

**Estimated Effort:** 4-6 hours

---

## Table of Contents

1. [Current Problems Analysis](#current-problems-analysis)
2. [Project Standards Reference](#project-standards-reference)
3. [Refactoring Strategy](#refactoring-strategy)
4. [Implementation Phases](#implementation-phases)
5. [Files to Create/Modify](#files-to-createmodify)
6. [Testing Strategy](#testing-strategy)
7. [Migration Checklist](#migration-checklist)

---

## Current Problems Analysis

### 1. **Monolithic Component Structure**
- **Lines:** 840+ lines of code
- **Issues:**
  - All business logic inline (filtering, sorting, pagination, CRUD operations)
  - Modal state management mixed with data fetching
  - Direct Supabase calls instead of using API layer
  - Duplicated logic that already exists in project hooks

### 2. **Direct Database Operations**
```typescript
// PROBLEM: Lines 264-265, 350-360, 380-391, 410-411
const supabase = createClient();
const {error} = await supabase.from('members').insert([...]);
const {error} = await supabase.from('members').update({...}).eq('id', id);
const {error} = await supabase.from('members').delete().eq('id', id);
```
**Why it's wrong:**
- Bypasses API layer security
- No auth validation
- No proper error handling
- Duplicates logic already in `useMembers` hook

### 3. **Reimplemented Table Logic**
```typescript
// PROBLEM: Lines 137-172
useEffect(() => {
  let filtered = members;
  // Manual filtering by search term
  if (debouncedSearchTerm) {
    filtered = filtered.filter(/* ... */);
  }
  // Manual sex filtering
  if (filters.sex && filters.sex !== Genders.EMPTY) {
    filtered = filtered.filter(/* ... */);
  }
  // Manual category filtering
  if (filters.category_id) {
    filtered = filtered.filter(/* ... */);
  }
  // Manual function filtering
  if (filters.function) {
    filtered = filtered.filter(/* ... */);
  }
  setFilteredMembers(filtered);
}, [members, debouncedSearchTerm, filters]);
```
**Why it's wrong:**
- **The project already has `useMembersTable` hook** (lines 196-230) that does exactly this!
- Duplicated sorting logic (lines 196-230) that exists in the hook
- Duplicated pagination logic (lines 232-236)

### 4. **Inline Modal State Management**
```typescript
// PROBLEM: Lines 71-98
const {isOpen: isAddMemberOpen, onOpen: onAddMemberOpen, onClose: onAddMemberClose} = useDisclosure();
const {isOpen: isEditMemberOpen, onOpen: onEditMemberOpen, onClose: onEditMemberClose} = useDisclosure();
const {isOpen: isDeleteMemberOpen, onOpen: onDeleteMemberOpen, onClose: onDeleteMemberClose} = useDisclosure();
const {isOpen: isBulkEditOpen, onOpen: onBulkEditOpen, onClose: onBulkEditClose} = useDisclosure();
const {isOpen: isDetailMemberOpen, onOpen: onDetailMemberOpen, onClose: onDetailMemberClose} = useDisclosure();
const [selectedMember, setSelectedMember] = useState<Member | null>(null);
const [formData, setFormData] = useState<Member>({...});
```
**Why it's wrong:**
- **The project already has `useMemberModals` hook** that handles all of this!
- Clutters component with modal state
- No separation of concerns

### 5. **Missing Type Safety**
```typescript
// PROBLEM: Line 189
const handleSortChange = (descriptor: any) => {
  // Using 'any' instead of proper types
};
```
**Why it's wrong:**
- Project has `MemberSortDescriptor` type defined
- Using `any` defeats TypeScript's purpose

### 6. **Inline CRUD Operations**
```typescript
// PROBLEM: Lines 346-372, 374-403, 405-423
const handleAddMember = async () => { /* 26 lines */ };
const handleUpdateMember = async () => { /* 28 lines */ };
const handleDeleteMember = async () => { /* 17 lines */ };
```
**Why it's wrong:**
- Should use `useMembers().createMember()`, `updateMember()`, `deleteMember()`
- Duplicates validation and error handling
- No consistency with rest of app

---

## Project Standards Reference

### Hook Architecture (3-Layer Pattern)

```
src/hooks/entities/[entity]/
├── data/           # Pure data fetching (no business logic)
│   └── useFetch[Entity].ts
├── state/          # Full CRUD with local state management
│   └── use[Entity].ts
└── business/       # Complex UI/domain logic (filtering, modals)
    ├── use[Entity]Table.ts
    └── use[Entity]Modals.ts
```

### Existing Hooks for Members

#### 1. **`useMembers` Hook** (State Layer)
**Location:** `src/hooks/entities/member/state/useMembers.ts`

**Provides:**
```typescript
interface UseMembersReturn {
  // State
  members: Member[];
  isLoading: boolean;
  errors: ValidationErrors;

  // CRUD Operations
  fetchMembers: () => Promise<void>;
  createMember: (formData: MemberFormData, categoryId?: string, clubId?: string) => Promise<void>;
  updateMember: (memberId: string, updateData: UpdateMemberData) => Promise<void>;
  deleteMember: (memberId: string) => Promise<void>;
  getMember: (memberId: string) => Promise<Member | null>;

  // Validation
  validateForm: (formData: MemberFormData) => boolean;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;

  // Utility
  reset: () => void;
}
```

**Usage Example:**
```typescript
const {members, isLoading, createMember, updateMember, deleteMember} = useMembers();

await createMember({
  name: 'John',
  surname: 'Doe',
  // ... other fields
});
```

#### 2. **`useMembersTable` Hook** (Business Layer)
**Location:** `src/hooks/entities/member/business/useMembersTable.ts`

**Provides:**
```typescript
interface UseMembersTableReturn {
  // State
  searchTerm: string;
  filters: MemberFilters;
  page: number;
  sortDescriptor: MemberSortDescriptor;

  // Setters
  setSearchTerm: (term: string) => void;
  setFilters: (filters: MemberFilters) => void;
  setPage: (page: number) => void;
  setSortDescriptor: (descriptor: MemberSortDescriptor) => void;
  clearFilters: () => void;

  // Computed Data
  filteredMembers: MemberWithPaymentStatus[];
  sortedMembers: MemberWithPaymentStatus[];
  paginatedMembers: MemberWithPaymentStatus[];
  totalPages: number;
  totalCount: number;
}
```

**Usage Example:**
```typescript
const {
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  clearFilters,
  paginatedMembers,
  totalPages,
  page,
  setPage,
  sortDescriptor,
  setSortDescriptor,
} = useMembersTable(members);
```

#### 3. **`useMemberModals` Hook** (Business Layer)
**Location:** `src/hooks/entities/member/business/useMemberModals.ts`

**Provides:**
```typescript
interface UseMemberModalsReturn {
  // Modal Disclosure States
  addModal: ReturnType<typeof useDisclosure>;
  editModal: ReturnType<typeof useDisclosure>;
  deleteModal: ReturnType<typeof useDisclosure>;
  detailModal: ReturnType<typeof useDisclosure>;
  bulkEditModal: ReturnType<typeof useDisclosure>;

  // Open/Close Handlers
  openAdd: () => void;
  openEdit: (member: Member) => void;
  openDelete: (member: Member) => void;
  openDetail: (member: Member) => void;
  openBulkEdit: () => void;

  // Selection State
  selectedMember: Member | null;
  selectedMembers: Set<string>;
  setSelectedMembers: (members: Set<string>) => void;

  // Form State
  formData: Member;
  setFormData: (data: Member) => void;
  bulkEditFormData: BulkEditFormData;
  setBulkEditFormData: (data: BulkEditFormData) => void;

  // Callback
  onSuccess: () => void;
}
```

**Usage Example:**
```typescript
const {
  addModal,
  openAdd,
  openEdit,
  selectedMember,
  formData,
  setFormData,
} = useMemberModals({
  onSuccess: () => refreshMembers(),
});
```

### API Route Pattern

**Structure:**
```
src/app/api/[entity]/
└── route.ts  # GET, POST, PATCH, DELETE handlers
```

**Example:** `src/app/api/member-payments/route.ts`
```typescript
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  // Auth check
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: 'Unauthorized'}, {status: 401});

  // Query params
  const memberId = request.nextUrl.searchParams.get('member_id');

  // Fetch
  const {data, error} = await supabase.from('payments').select('*');

  // Response
  return NextResponse.json({data, error: error?.message});
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: 'Unauthorized'}, {status: 401});

  const body = await request.json();
  const {data, error} = await supabase.from('payments').insert(body).select().single();

  return NextResponse.json({data, error: error?.message});
}
```

### Type System Pattern

```
src/types/entities/[entity]/
├── schema/        # Database schema types (auto-generated)
│   └── [entity]Schema.ts
├── data/          # Data transfer types
│   ├── [entity].ts
│   └── [entity]WithRelations.ts
└── business/      # UI/business logic types
    ├── [entity]Filters.ts
    └── [entity]FormData.ts
```

---

## Refactoring Strategy

### Goals
1. ✅ **Reduce component size** from 840 lines to ~150-200 lines
2. ✅ **Use existing hooks** instead of reimplementing logic
3. ✅ **Replace direct Supabase calls** with proper API/hooks
4. ✅ **Improve type safety** by using proper types
5. ✅ **Maintain functionality** - no breaking changes
6. ✅ **Follow project standards** established in other components

### Approach: Incremental Refactoring

We'll refactor in **phases** to minimize risk:

**Phase 1:** Extract and use existing hooks (low risk)
**Phase 2:** Replace CRUD operations with `useMembers` hook (medium risk)
**Phase 3:** Clean up and optimize (low risk)

---

## Implementation Phases

### Phase 1: Use Existing Hooks (Estimated: 1.5 hours)

#### 1.1 Replace Table Logic with `useMembersTable`

**Current Code (Lines 58-236):**
```typescript
const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);
const [filters, setFilters] = useState({...});
const [page, setPage] = useState(1);
const [sortDescriptor, setSortDescriptor] = useState({...});

useEffect(() => {
  // 35 lines of filtering logic
}, [members, debouncedSearchTerm, filters]);

const sortedMembers = useMemo(() => {
  // 35 lines of sorting logic
}, [filteredMembers, sortDescriptor]);

const items = useMemo(() => {
  // Pagination logic
}, [page, sortedMembers, rowsPerPage]);
```

**Refactored Code:**
```typescript
const {
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  clearFilters,
  page,
  setPage,
  sortDescriptor,
  setSortDescriptor,
  paginatedMembers,
  totalPages,
  totalCount,
} = useMembersTable(members);
```

**Lines Removed:** ~140 lines
**Lines Added:** ~15 lines
**Net Savings:** ~125 lines

#### 1.2 Replace Modal State with `useMemberModals`

**Current Code (Lines 71-116):**
```typescript
const {isOpen: isAddMemberOpen, onOpen: onAddMemberOpen, onClose: onAddMemberClose} = useDisclosure();
const {isOpen: isEditMemberOpen, onOpen: onEditMemberOpen, onClose: onEditMemberClose} = useDisclosure();
const {isOpen: isDeleteMemberOpen, onOpen: onDeleteMemberOpen, onClose: onDeleteMemberClose} = useDisclosure();
const {isOpen: isBulkEditOpen, onOpen: onBulkEditOpen, onClose: onBulkEditClose} = useDisclosure();
const {isOpen: isDetailMemberOpen, onOpen: onDetailMemberOpen, onClose: onDetailMemberClose} = useDisclosure();

const [selectedMember, setSelectedMember] = useState<Member | null>(null);
const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
const [formData, setFormData] = useState<Member>({...});
const [bulkEditFormData, setBulkEditFormData] = useState({...});

const openAddModal = () => {
  setFormData({...});
  onAddMemberOpen();
};

const openEditModal = (member: Member) => {
  setSelectedMember(member);
  setFormData({...});
  onEditMemberOpen();
};

// ... 20+ more lines for other modals
```

**Refactored Code:**
```typescript
const {
  addModal,
  editModal,
  deleteModal,
  detailModal,
  bulkEditModal,
  openAdd,
  openEdit,
  openDelete,
  openDetail,
  openBulkEdit,
  selectedMember,
  selectedMembers,
  setSelectedMembers,
  formData,
  setFormData,
  bulkEditFormData,
  setBulkEditFormData,
} = useMemberModals({
  onSuccess: refreshMembers,
});
```

**Lines Removed:** ~70 lines
**Lines Added:** ~20 lines
**Net Savings:** ~50 lines

#### 1.3 Update Modal Props

**Current Code:**
```typescript
<MemberFormModal
  isOpen={isAddMemberOpen}
  onClose={onAddMemberClose}
  onSubmit={handleAddMember}
  // ...
/>
```

**Refactored Code:**
```typescript
<MemberFormModal
  isOpen={addModal.isOpen}
  onClose={addModal.onClose}
  onSubmit={handleAddMember}
  // ...
/>
```

---

### Phase 2: Replace CRUD Operations (Estimated: 2 hours)

#### 2.1 Replace Create Operation

**Current Code (Lines 346-372):**
```typescript
const handleAddMember = async () => {
  try {
    const supabase = createClient();

    const {error} = await supabase.from('members').insert([
      {
        name: formData.name,
        surname: formData.surname,
        date_of_birth: formData.date_of_birth || null,
        category_id: formData.category_id,
        sex: formData.sex,
        functions: formData.functions,
        registration_number: formData.registration_number || undefined,
      },
    ]);

    if (error) {
      throw error;
    }

    showToast.success('Člen byl úspěšně přidán');
    onAddMemberClose();
    refreshMembers();
  } catch (error: any) {
    showToast.danger(`Chyba při přidávání člena: ${error.message || 'Neznámá chyba'}`);
  }
};
```

**Refactored Code:**
```typescript
const handleAddMember = async () => {
  await createMember(
    {
      name: formData.name,
      surname: formData.surname,
      registration_number: formData.registration_number,
      date_of_birth: formData.date_of_birth,
      sex: formData.sex,
      functions: formData.functions,
    },
    formData.category_id
  );

  addModal.onClose();
  refreshMembers();
};
```

**Benefits:**
- Validation handled by hook
- Error handling with toasts handled by hook
- Consistent with rest of application
- Auth validation in API layer

#### 2.2 Replace Update Operation

**Current Code (Lines 374-403):**
```typescript
const handleUpdateMember = async () => {
  if (!selectedMember) return;

  try {
    const supabase = createClient();

    const {error} = await supabase
      .from('members')
      .update({
        name: formData.name,
        surname: formData.surname,
        date_of_birth: formData.date_of_birth || null,
        category_id: formData.category_id,
        sex: formData.sex,
        functions: formData.functions,
        registration_number: formData.registration_number || null,
      })
      .eq('id', selectedMember.id);

    if (error) {
      throw error;
    }

    showToast.success('Člen byl úspěšně upraven');
    onEditMemberClose();
    refreshMembers();
  } catch (error: any) {
    showToast.danger(`Chyba při úpravě člena: ${error.message || 'Neznámá chyba'}`);
  }
};
```

**Refactored Code:**
```typescript
const handleUpdateMember = async () => {
  if (!selectedMember) return;

  await updateMember(selectedMember.id, {
    name: formData.name,
    surname: formData.surname,
    registration_number: formData.registration_number,
    date_of_birth: formData.date_of_birth,
    sex: formData.sex,
    functions: formData.functions,
    category_id: formData.category_id,
  });

  editModal.onClose();
  refreshMembers();
};
```

#### 2.3 Replace Delete Operation

**Current Code (Lines 405-423):**
```typescript
const handleDeleteMember = async () => {
  if (!selectedMember) return;

  try {
    const supabase = createClient();

    const {error} = await supabase.from('members').delete().eq('id', selectedMember.id);

    if (error) {
      throw error;
    }

    showToast.success('Člen byl úspěšně smazán');
    onDeleteMemberClose();
    refreshMembers();
  } catch (error: any) {
    showToast.danger(`Chyba při mazání člena: ${error.message || 'Neznámá chyba'}`);
  }
};
```

**Refactored Code:**
```typescript
const handleDeleteMember = async () => {
  if (!selectedMember) return;

  await deleteMember(selectedMember.id);
  deleteModal.onClose();
  refreshMembers();
};
```

**Lines Removed:** ~70 lines
**Lines Added:** ~15 lines
**Net Savings:** ~55 lines

#### 2.4 Create Bulk Edit Hook (New File)

The bulk edit operation (lines 239-285) is complex and specific to this component. We should extract it into its own hook.

**Create:** `src/app/admin/members/hooks/useBulkEditMembers.ts`

```typescript
import {useState} from 'react';
import {createClient} from '@/utils/supabase/client';
import {showToast} from '@/components';
import {Genders} from '@/enums';

interface BulkEditFormData {
  sex: Genders;
  category: string;
  functions: string[];
}

interface UseBulkEditMembersProps {
  onSuccess: () => void;
}

export function useBulkEditMembers({onSuccess}: UseBulkEditMembersProps) {
  const [isLoading, setIsLoading] = useState(false);

  const bulkEditMembers = async (
    memberIds: string[],
    formData: BulkEditFormData
  ): Promise<boolean> => {
    if (memberIds.length === 0) {
      showToast.warning('Vyberte alespoň jednoho člena');
      return false;
    }

    if (
      !formData.sex &&
      !formData.category &&
      formData.functions.length === 0
    ) {
      showToast.danger('Vyberte alespoň jedno pole pro úpravu');
      return false;
    }

    setIsLoading(true);

    try {
      const updateData: any = {};
      if (formData.sex) updateData.sex = formData.sex;
      if (formData.category) updateData.category_id = formData.category;
      if (formData.functions.length > 0) updateData.functions = formData.functions;

      const supabase = createClient();
      const {error} = await supabase
        .from('members')
        .update(updateData)
        .in('id', memberIds);

      if (error) {
        throw error;
      }

      showToast.success(`Úspěšně upraveno ${memberIds.length} členů`);
      onSuccess();
      return true;
    } catch (error: any) {
      showToast.danger(`Chyba při hromadné úpravě: ${error.message || 'Neznámá chyba'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    bulkEditMembers,
    isLoading,
  };
}
```

**Usage in Component:**
```typescript
const {bulkEditMembers, isLoading: isBulkEditLoading} = useBulkEditMembers({
  onSuccess: refreshMembers,
});

const handleBulkEdit = async () => {
  const success = await bulkEditMembers(
    Array.from(selectedMembers),
    bulkEditFormData
  );

  if (success) {
    setSelectedMembers(new Set());
    setBulkEditFormData({sex: Genders.EMPTY, category: '', functions: []});
    bulkEditModal.onClose();
  }
};
```

---

### Phase 3: Clean Up and Optimize (Estimated: 1 hour)

#### 3.1 Fix Type Safety

**Current Code (Line 189):**
```typescript
const handleSortChange = (descriptor: any) => {
  setSortDescriptor({
    column: String(descriptor.column),
    direction: descriptor.direction,
  });
};
```

**Refactored Code:**
```typescript
const handleSortChange = (descriptor: MemberSortDescriptor) => {
  setSortDescriptor(descriptor);
};
```

#### 3.2 Extract Cell Rendering Logic

The `renderCell` function (lines 443-522) is 80 lines and could be extracted to a separate file for better maintainability.

**Create:** `src/app/admin/members/components/cells/MemberTableCells.tsx`

```typescript
import {Chip} from '@heroui/react';
import {Genders, getMemberFunctionOptions} from '@/enums';
import {getPaymentStatusColor, getPaymentStatusLabel} from '@/enums/membershipFeeStatus';
import {Member, MemberPaymentStatus} from '@/types';
import {StatusCell} from './StatusCell';

interface RenderCellProps {
  member: Member;
  columnKey: string;
  categories: Record<string, string>;
  getMemberPaymentStatus: (memberId: string) => MemberPaymentStatus | undefined;
  onView: (member: Member) => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

export function renderMemberCell({
  member,
  columnKey,
  categories,
  getMemberPaymentStatus,
  onView,
  onEdit,
  onDelete,
}: RenderCellProps) {
  switch (columnKey) {
    case 'status':
      return <StatusCell isActive={member.is_active} />;

    case 'registration_number':
      return <span className="font-medium">{member.registration_number || 'N/A'}</span>;

    case 'name':
      return <span className="font-medium">{member.name}</span>;

    case 'surname':
      return <span className="font-medium">{member.surname}</span>;

    case 'date_of_birth': {
      const birthDate = new Date(member.date_of_birth || '');
      const age = new Date().getFullYear() - birthDate.getFullYear();
      return (
        <span>
          {birthDate.toLocaleDateString('cs-CZ')} ({age})
        </span>
      );
    }

    case 'category':
      return categories[member.category_id || ''] || 'N/A';

    case 'sex':
      return member.sex === Genders.MALE ? 'Muž' : 'Žena';

    case 'membershipFee': {
      const status = getMemberPaymentStatus(member.id);
      if (!status) return <span className="text-gray-400">-</span>;

      return (
        <div className="flex flex-col gap-1">
          <Chip color={getPaymentStatusColor(status.payment_status)} size="sm" variant="flat">
            {getPaymentStatusLabel(status.payment_status)}
          </Chip>
          {status.payment_status !== 'not_required' && (
            <span className="text-xs text-gray-500">
              {status.net_paid} / {status.expected_fee_amount} {status.currency || 'CZK'}
            </span>
          )}
        </div>
      );
    }

    case 'functions':
      if (!member.is_active) {
        return <span className="text-gray-500">Žádné funkce</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {member.functions.map((func) => (
            <Chip key={func} color="primary" variant="solid" size="sm">
              {getMemberFunctionOptions().find((option) => option.value === func)?.label || func}
            </Chip>
          ))}
        </div>
      );

    case 'actions':
      return (
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            startContent={<EyeIcon className="w-4 h-4" />}
            onPress={() => onView(member)}
          />
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => onEdit(member)}
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="danger"
            onPress={() => onDelete(member)}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      );

    default:
      return null;
  }
}
```

**Usage in Component:**
```typescript
const renderCell = (member: Member, columnKey: string) => {
  return renderMemberCell({
    member,
    columnKey,
    categories,
    getMemberPaymentStatus,
    onView: openDetail,
    onEdit: openEdit,
    onDelete: openDelete,
  });
};
```

#### 3.3 Extract Filter Section to Component

The filter section (lines 611-722) is large and could be a separate component.

**Create:** `src/app/admin/members/components/MembersListFilters.tsx`

```typescript
'use client';

import {Button, Card, CardBody, Input, Select, SelectItem} from '@heroui/react';
import {MagnifyingGlassIcon, TrashIcon} from '@heroicons/react/24/outline';
import {Genders, getMemberFunctionOptions} from '@/enums';
import {translations} from '@/lib/translations';
import {Category} from '@/types';
import {MemberFilters} from '@/types/entities/member/data/memberWithPaymentStatus';

interface MembersListFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: MemberFilters;
  onFiltersChange: (filters: MemberFilters) => void;
  onClearFilters: () => void;
  categories: Category[];
}

export function MembersListFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearFilters,
  categories,
}: MembersListFiltersProps) {
  const t = translations.members;
  const hasActiveFilters = filters.sex || filters.category_id || filters.function;

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            {/* Search Input */}
            <div className="w-full lg:w-80">
              <Input
                placeholder={t.membersTable.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
                className="w-full"
                size="sm"
                aria-label="Search members"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Sex Filter */}
              <div className="w-full sm:w-40">
                <Select
                  aria-label="Filter by gender"
                  placeholder="Všechna pohlaví"
                  selectedKeys={filters.sex && filters.sex !== Genders.EMPTY ? [filters.sex] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as Genders;
                    onFiltersChange({
                      ...filters,
                      sex: selectedKey || Genders.EMPTY,
                    });
                  }}
                  className="w-full"
                  size="sm"
                >
                  <SelectItem key="male">Muži</SelectItem>
                  <SelectItem key="female">Ženy</SelectItem>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="w-full sm:w-48">
                <Select
                  aria-label="Filter by category"
                  placeholder="Všechny kategorie"
                  selectedKeys={filters.category_id ? [filters.category_id] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    onFiltersChange({
                      ...filters,
                      category_id: selectedKey || '',
                    });
                  }}
                  className="w-full"
                  size="sm"
                >
                  {categories.map((category) => (
                    <SelectItem key={category.id} aria-label={`Select category ${category.name}`}>
                      {category.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Function Filter */}
              <div className="w-full sm:w-48">
                <Select
                  aria-label="Filter by function"
                  placeholder="Všechny funkce"
                  selectedKeys={filters.function ? [filters.function] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    onFiltersChange({
                      ...filters,
                      function: selectedKey || '',
                    });
                  }}
                  className="w-full"
                  size="sm"
                >
                  {getMemberFunctionOptions().map(({value, label}) => (
                    <SelectItem key={value} aria-label={`Select function ${label}`}>
                      {label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="w-full sm:w-auto">
                  <Button
                    variant="light"
                    size="sm"
                    onPress={onClearFilters}
                    className="w-full sm:w-auto"
                    aria-label="Clear all filters"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Vymazat filtry
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
```

**Usage in Component:**
```typescript
<MembersListFilters
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
  filters={filters}
  onFiltersChange={setFilters}
  onClearFilters={clearFilters}
  categories={categoriesData || []}
/>
```

---

## Files to Create/Modify

### Files to Create

1. **`src/app/admin/members/hooks/useBulkEditMembers.ts`**
   - Purpose: Extract bulk edit logic
   - Lines: ~60 lines
   - Exports: `useBulkEditMembers` hook

2. **`src/app/admin/members/components/MembersListFilters.tsx`**
   - Purpose: Extract filter UI
   - Lines: ~120 lines
   - Exports: `MembersListFilters` component

3. **`src/app/admin/members/components/cells/MemberTableCells.tsx`**
   - Purpose: Extract cell rendering logic
   - Lines: ~100 lines
   - Exports: `renderMemberCell` function

### Files to Modify

1. **`src/app/admin/members/components/MembersListTab.tsx`**
   - **Current:** 840 lines
   - **Target:** 150-200 lines
   - **Changes:**
     - Replace inline table logic with `useMembersTable`
     - Replace inline modal state with `useMemberModals`
     - Replace CRUD operations with `useMembers`
     - Use `useBulkEditMembers` for bulk operations
     - Use extracted filter component
     - Use extracted cell rendering

2. **`src/app/admin/members/components/index.ts`**
   - Add exports for new components

### Dependency Tree (After Refactoring)

```
MembersListTab.tsx (~180 lines)
├── useAppData (context)
├── useMembers (state hook)
├── useMembersTable (business hook)
├── useMemberModals (business hook)
├── useBulkEditMembers (local hook)
├── usePaymentStatus (data hook)
├── MembersListFilters (component)
├── renderMemberCell (util)
├── MemberFormModal (component)
├── MemberDetailModal (component)
├── BulkEditModal (component)
├── DeleteConfirmationModal (component)
└── MembersCsvImport (component)
```

---

## Final Component Structure

### Refactored MembersListTab.tsx (~180 lines)

```typescript
'use client';

import React, {useMemo} from 'react';
import {Button, Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from '@heroui/react';
import {PencilIcon, PlusIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';
import {useAppData} from '@/contexts/AppDataContext';
import {useMembers} from '@/hooks/entities/member/state/useMembers';
import {useMembersTable} from '@/hooks/entities/member/business/useMembersTable';
import {useMemberModals} from '@/hooks/entities/member/business/useMemberModals';
import {useBulkEditMembers} from '@/app/admin/members/hooks/useBulkEditMembers';
import {usePaymentStatus} from '@/hooks';
import {MembersListFilters} from './MembersListFilters';
import {renderMemberCell} from './cells/MemberTableCells';
import {MemberFormModal} from './MemberFormModal';
import {MemberDetailModal} from './MemberDetailModal';
import {BulkEditModal} from './BulkEditModal';
import {DeleteConfirmationModal} from '@/components';
import {MembersCsvImport} from './MembersCsvImport';
import {Category} from '@/types';
import {Genders} from '@/enums';

interface MembersListTabProps {
  categoriesData: Category[] | null;
  sexOptions: Record<string, string>;
}

export default function MembersListTab({categoriesData, sexOptions}: MembersListTabProps) {
  const t = translations.members;

  // Data context
  const {members, membersLoading, refreshMembers} = useAppData();
  const {statusData} = usePaymentStatus();

  // CRUD operations
  const {createMember, updateMember, deleteMember} = useMembers();

  // Table state and logic
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    clearFilters,
    page,
    setPage,
    sortDescriptor,
    setSortDescriptor,
    paginatedMembers,
    totalPages,
  } = useMembersTable(members);

  // Modal state
  const {
    addModal,
    editModal,
    deleteModal,
    detailModal,
    bulkEditModal,
    openAdd,
    openEdit,
    openDelete,
    openDetail,
    openBulkEdit,
    selectedMember,
    selectedMembers,
    setSelectedMembers,
    formData,
    setFormData,
    bulkEditFormData,
    setBulkEditFormData,
  } = useMemberModals({
    onSuccess: refreshMembers,
  });

  // Bulk edit operations
  const {bulkEditMembers, isLoading: isBulkEditLoading} = useBulkEditMembers({
    onSuccess: refreshMembers,
  });

  // Handlers
  const handleAddMember = async () => {
    await createMember(
      {
        name: formData.name,
        surname: formData.surname,
        registration_number: formData.registration_number,
        date_of_birth: formData.date_of_birth,
        sex: formData.sex,
        functions: formData.functions,
      },
      formData.category_id
    );
    addModal.onClose();
    refreshMembers();
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    await updateMember(selectedMember.id, {
      name: formData.name,
      surname: formData.surname,
      registration_number: formData.registration_number,
      date_of_birth: formData.date_of_birth,
      sex: formData.sex,
      functions: formData.functions,
      category_id: formData.category_id,
    });
    editModal.onClose();
    refreshMembers();
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    await deleteMember(selectedMember.id);
    deleteModal.onClose();
    refreshMembers();
  };

  const handleBulkEdit = async () => {
    const success = await bulkEditMembers(Array.from(selectedMembers), bulkEditFormData);
    if (success) {
      setSelectedMembers(new Set());
      setBulkEditFormData({sex: Genders.EMPTY, category: '', functions: []});
      bulkEditModal.onClose();
    }
  };

  // Helper functions
  const categories = useMemo(() => {
    if (!categoriesData) return {};
    return categoriesData.reduce((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {} as Record<string, string>);
  }, [categoriesData]);

  const getMemberPaymentStatus = useMemo(() => {
    return (memberId: string) => statusData.find((s) => s.member_id === memberId);
  }, [statusData]);

  const renderCell = (member: Member, columnKey: string) => {
    return renderMemberCell({
      member,
      columnKey,
      categories,
      getMemberPaymentStatus,
      onView: openDetail,
      onEdit: openEdit,
      onDelete: openDelete,
    });
  };

  // Table columns
  const columns = [
    {key: 'status', label: t.membersTable.status, sortable: false},
    {key: 'registration_number', label: t.membersTable.registrationNumber, sortable: true},
    {key: 'name', label: t.membersTable.name, sortable: true},
    {key: 'surname', label: t.membersTable.surname, sortable: true},
    {key: 'date_of_birth', label: t.membersTable.dateOfBirth, sortable: true},
    {key: 'category', label: t.membersTable.category, sortable: true},
    {key: 'sex', label: t.membersTable.sex, sortable: true},
    {key: 'membershipFee', label: t.membersTable.membershipFee, sortable: false},
    {key: 'functions', label: t.membersTable.functions, sortable: false},
    {key: 'actions', label: t.membersTable.actions, sortable: false},
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Seznam členů</h2>
        <div className="flex gap-2">
          <Button
            color="secondary"
            variant="flat"
            onPress={openBulkEdit}
            isDisabled={selectedMembers.size === 0}
            startContent={<PencilIcon className="w-4 h-4" />}
          >
            Hromadná úprava ({selectedMembers.size})
          </Button>
          <MembersCsvImport
            onImportComplete={refreshMembers}
            categories={categories}
            sexOptions={sexOptions}
          />
          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={openAdd}
            isDisabled={Object.keys(categories).length === 0}
          >
            Přidat člena
          </Button>
        </div>
      </div>

      {/* Filters */}
      <MembersListFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
        categories={categoriesData || []}
      />

      {/* Table */}
      <Table
        key={`table-${statusData.length}`}
        aria-label="Tabulka členů"
        selectionMode="multiple"
        selectedKeys={selectedMembers}
        onSelectionChange={(keys) => {
          if (typeof keys === 'string') {
            setSelectedMembers(new Set([keys]));
          } else {
            setSelectedMembers(new Set(Array.from(keys).map((key) => String(key))));
          }
        }}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        classNames={{wrapper: 'min-h-[400px]'}}
        bottomContent={
          <div className="flex w-full justify-center">
            <Pagination
              aria-label="Pagination controls"
              isCompact
              showControls
              showShadow
              color="secondary"
              page={page}
              total={totalPages}
              onChange={setPage}
            />
          </div>
        }
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.key}
              allowsSorting={column.sortable}
              align={column.key === 'actions' ? 'center' : 'start'}
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={paginatedMembers}
          loadingContent={membersLoading ? translations.loading : 'Načítání dat...'}
          loadingState={membersLoading ? 'loading' : 'idle'}
          emptyContent={
            searchTerm
              ? 'Žádní členové nebyli nalezeni pro zadaný vyhledávací termín.'
              : 'Žádní členové nebyli nalezeni.'
          }
        >
          {(member) => (
            <TableRow key={member.id}>
              {(columnKey) => <TableCell>{renderCell(member, columnKey as string)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Modals */}
      <MemberFormModal
        isOpen={addModal.isOpen}
        onClose={addModal.onClose}
        onSubmit={handleAddMember}
        title="Přidat nového člena"
        formData={formData}
        setFormData={setFormData}
        categories={categoriesData || []}
        sexOptions={sexOptions}
        submitButtonText="Přidat člena"
        isEditMode={false}
      />

      <MemberFormModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        onSubmit={handleUpdateMember}
        title="Upravit člena"
        formData={formData}
        setFormData={setFormData}
        categories={categoriesData || []}
        sexOptions={sexOptions}
        submitButtonText="Uložit změny"
        isEditMode={true}
      />

      <MemberDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.onClose}
        member={selectedMember}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        onConfirm={handleDeleteMember}
        title="Smazat člena"
        message={`Opravdu chcete smazat člena <strong>${selectedMember?.name} ${selectedMember?.surname}</strong>?`}
      />

      <BulkEditModal
        isOpen={bulkEditModal.isOpen}
        onClose={bulkEditModal.onClose}
        onSubmit={handleBulkEdit}
        selectedCount={selectedMembers.size}
        formData={bulkEditFormData}
        setFormData={setBulkEditFormData}
        categories={categoriesData || []}
        isLoading={isBulkEditLoading}
      />
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests

1. **Test `useBulkEditMembers` hook**
   - Test validation logic
   - Test successful bulk update
   - Test error handling
   - Test loading states

2. **Test `MembersListFilters` component**
   - Test search input
   - Test filter selections
   - Test clear filters button
   - Test responsive layout

3. **Test `renderMemberCell` function**
   - Test each cell type
   - Test null/undefined handling
   - Test date formatting
   - Test payment status display

### Integration Tests

1. **Test member creation flow**
   - Open add modal
   - Fill form
   - Submit
   - Verify success toast
   - Verify table refresh

2. **Test member update flow**
   - Click edit on member
   - Modify form
   - Submit
   - Verify changes

3. **Test member deletion flow**
   - Click delete on member
   - Confirm deletion
   - Verify member removed

4. **Test bulk edit flow**
   - Select multiple members
   - Open bulk edit modal
   - Update fields
   - Verify all members updated

5. **Test filtering and search**
   - Enter search term
   - Verify filtered results
   - Apply category filter
   - Verify combined filters
   - Clear filters

### Manual Testing Checklist

- [ ] Create new member
- [ ] Edit existing member
- [ ] Delete member
- [ ] Bulk edit members
- [ ] Search members by name
- [ ] Filter by sex
- [ ] Filter by category
- [ ] Filter by function
- [ ] Clear all filters
- [ ] Sort by each column
- [ ] Pagination works
- [ ] View member details
- [ ] Import CSV
- [ ] Payment status displays correctly
- [ ] Responsive layout on mobile

---

## Migration Checklist

### Phase 1: Use Existing Hooks ✓

- [ ] Replace table logic with `useMembersTable`
  - [ ] Replace `useState` for filters
  - [ ] Replace `useEffect` for filtering
  - [ ] Replace `useMemo` for sorting
  - [ ] Replace `useMemo` for pagination
  - [ ] Update table props to use hook values
  - [ ] Test filtering works
  - [ ] Test sorting works
  - [ ] Test pagination works

- [ ] Replace modal state with `useMemberModals`
  - [ ] Replace `useDisclosure` calls
  - [ ] Replace `useState` for selectedMember
  - [ ] Replace `useState` for selectedMembers
  - [ ] Replace `useState` for formData
  - [ ] Replace `useState` for bulkEditFormData
  - [ ] Update modal open handlers
  - [ ] Update modal props
  - [ ] Test all modals open/close correctly

### Phase 2: Replace CRUD Operations ✓

- [ ] Replace create operation
  - [ ] Use `useMembers().createMember()`
  - [ ] Remove direct Supabase call
  - [ ] Test member creation
  - [ ] Verify success toast
  - [ ] Verify table refresh

- [ ] Replace update operation
  - [ ] Use `useMembers().updateMember()`
  - [ ] Remove direct Supabase call
  - [ ] Test member update
  - [ ] Verify success toast
  - [ ] Verify table refresh

- [ ] Replace delete operation
  - [ ] Use `useMembers().deleteMember()`
  - [ ] Remove direct Supabase call
  - [ ] Test member deletion
  - [ ] Verify success toast
  - [ ] Verify table refresh

- [ ] Create and use `useBulkEditMembers` hook
  - [ ] Create hook file
  - [ ] Extract bulk edit logic
  - [ ] Update component to use hook
  - [ ] Test bulk edit
  - [ ] Verify validation

### Phase 3: Clean Up and Optimize ✓

- [ ] Fix type safety
  - [ ] Replace `any` types with proper types
  - [ ] Use `MemberSortDescriptor` type
  - [ ] Add missing type annotations

- [ ] Extract cell rendering
  - [ ] Create `MemberTableCells.tsx`
  - [ ] Move `renderCell` logic
  - [ ] Update component to use extracted function
  - [ ] Test all cell types render correctly

- [ ] Extract filters component
  - [ ] Create `MembersListFilters.tsx`
  - [ ] Move filter UI
  - [ ] Update component to use new component
  - [ ] Test filters work correctly

- [ ] Update exports
  - [ ] Add new components to `index.ts`
  - [ ] Verify imports work

### Final Verification ✓

- [ ] Run all tests
- [ ] Manual testing of all features
- [ ] Code review
- [ ] Check bundle size impact
- [ ] Update documentation
- [ ] Merge to main

---

## Expected Results

### Before
- **Lines:** 840 lines
- **Complexity:** High (all logic inline)
- **Maintainability:** Low (changes require understanding entire component)
- **Reusability:** None (logic duplicated from existing hooks)
- **Type Safety:** Medium (uses `any` in places)
- **Security:** Medium (direct database calls)

### After
- **Lines:** ~180 lines (78% reduction)
- **Complexity:** Low (logic delegated to hooks)
- **Maintainability:** High (clear separation of concerns)
- **Reusability:** High (uses shared project hooks)
- **Type Safety:** High (proper types throughout)
- **Security:** High (uses API layer with auth)

### Performance Impact
- **Rendering:** Unchanged (same component structure)
- **Filtering:** Improved (optimized in hook)
- **Bundle Size:** Slightly smaller (shared hook code)

---

## References

### Key Files
- **Hooks:**
  - `src/hooks/entities/member/state/useMembers.ts`
  - `src/hooks/entities/member/business/useMembersTable.ts`
  - `src/hooks/entities/member/business/useMemberModals.ts`

- **Types:**
  - `src/types/entities/member/data/member.ts`
  - `src/types/entities/member/data/memberWithPaymentStatus.ts`

- **Components:**
  - `src/app/admin/members/components/MemberPaymentsTab.tsx` (good example)
  - `src/app/admin/members/components/MemberFormModal.tsx` (modal pattern)

### Documentation
- [Entity Management Architecture](../ENTITY_MANAGEMENT_ARCHITECTURE.md)
- [Import Ordering Rules](../IMPORT_ORDERING_RULES.md)
- [Naming Conventions](../NAMING_CONVENTIONS.md)

---

## Conclusion

This refactoring plan transforms `MembersListTab.tsx` from a monolithic 840-line component into a clean, maintainable 180-line component that follows project standards. By leveraging existing hooks and properly separating concerns, we achieve:

1. **78% reduction in component size**
2. **Consistency with project architecture**
3. **Improved type safety and security**
4. **Better maintainability and testability**
5. **No loss of functionality**

The refactoring is low-risk because we're using existing, tested hooks and patterns already established in the project.