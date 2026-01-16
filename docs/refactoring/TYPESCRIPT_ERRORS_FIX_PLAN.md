# TypeScript Errors Fix Plan

## Summary
Total: **28 TypeScript errors** across 7 files

## Priority Groups

### 🔴 CRITICAL (Blocking Features)
1. **AttendanceRecordingTable.tsx** - 8 errors (table cannot display data)
2. **attendance/page.tsx** - 4 errors (page cannot function)
3. **useAttendance.ts** - 1 error (missing function)

### 🟡 HIGH (Feature Incomplete)
4. **TrainingSessionModal.tsx** - 7 errors (cannot create/edit sessions)
5. **TrainingSessionGenerator.tsx** - 1 error (cannot generate sessions)
6. **TrainingSessionStatusDialog.tsx** - 1 error (import issue)

### 🟢 MEDIUM (Code Quality)
7. **LineupMembers.tsx** - 5 errors (delete functionality broken)
8. **entities/[entity]/[id]/route.ts** - 2 errors (API safety)

---

## Detailed Fix Plan

### 1. AttendanceRecordingTable.tsx (8 errors)
**Problem**: Code expects `MemberAttendanceSchema` to have a `member` property, but it doesn't.

**Root Cause**: The schema only has `member_id`, not the full `member` object.

**Solution Options**:
- **Option A (Recommended)**: Create a new type `MemberAttendanceWithMember` that extends the schema
  ```typescript
  export interface MemberAttendanceWithMember extends MemberAttendanceSchema {
    member: {
      id: string;
      name: string;
      surname: string;
      category_id: string;
    };
  }
  ```
- **Option B**: Update the query to join with members table and return the correct shape

**Files to modify**:
- `src/types/entities/trainingSession/schema/memberAttendanceSchema.ts` (add new type)
- `src/app/coaches/attendance/components/AttendanceRecordingTable.tsx` (update component)
- `src/queries/memberAttendance/queries.ts` (ensure query returns member data)

**Lines affected**: 80, 81, 82, 87, 94, 110

---

### 2. TrainingSessionModal.tsx (7 errors)
**Problem**: Form data object missing required fields: `status`, `coach_id`, `status_reason`

**Root Cause**: `TrainingSessionFormData extends TrainingSessionInsert` which requires these fields, but the form initializes without them.

**Solution**:
- Initialize form with default values for required fields:
  ```typescript
  const initialFormData = {
    title: '',
    description: '',
    session_date: '',
    session_time: '',
    category_id: '',
    season_id: '',
    location: '',
    status: TrainingSessionStatusEnum.PLANNED, // Add default
    coach_id: '', // Add from current user
    status_reason: null // Add default
  };
  ```

**Files to modify**:
- `src/app/coaches/attendance/components/TrainingSessionModal.tsx`

**Lines affected**: 35, 48, 59, 74, 92, 126, 152, 165

---

### 3. TrainingSessionStatusDialog.tsx (1 error)
**Problem**: Trying to import `TrainingSessionStatus` but it doesn't exist.

**Root Cause**: The enum is called `TrainingSessionStatusEnum`, not `TrainingSessionStatus`.

**Solution**:
```typescript
// Change from:
import { TrainingSessionStatus } from '@/types';

// To:
import { TrainingSessionStatusEnum } from '@/enums';
```

**Files to modify**:
- `src/app/coaches/attendance/components/TrainingSessionStatusDialog.tsx`

**Lines affected**: 8

---

### 4. attendance/page.tsx (4 errors)
**Problem**: Multiple issues:
1. Passing 2 arguments to a function expecting 0
2. Accessing `.id` on potentially `void` type
3. Passing `members` prop that doesn't exist in component props

**Root Cause**: API changes in hooks/components not reflected in page usage.

**Solution**:
1. Check `createTrainingSession` signature and fix call at line 80
2. Check return type of training session creation function (lines 278, 284)
3. Remove `members` prop from `AttendanceRecordingTable` or add it to the component's prop types (line 496)

**Files to modify**:
- `src/app/coaches/attendance/page.tsx`
- `src/app/coaches/attendance/components/AttendanceRecordingTable.tsx` (prop types)

**Lines affected**: 80, 278, 284, 496

---

### 5. useAttendance.ts (1 error)
**Problem**: `fetchAttendanceRecords` function doesn't exist but is being called.

**Root Cause**: Function was likely renamed or removed during refactoring.

**Solution**:
- Find the correct function name (likely `refetch` or `fetchMemberAttendance`)
- Update the call to use the correct function
- Or implement `fetchAttendanceRecords` if it's needed

**Files to modify**:
- `src/hooks/entities/attendance/useAttendance.ts`

**Lines affected**: 281

---

### 6. LineupMembers.tsx (5 errors)
**Problem**: Three undefined variables and two type errors:
1. `setDeleteOption` is not defined
2. `setMemberToDelete` is not defined
3. `onDeleteModalOpen` is not defined
4. Parameters have `any` type
5. Column align type mismatch

**Root Cause**: Missing state declarations and incomplete TypeScript types.

**Solution**:
```typescript
// Add missing state at component top:
const [deleteOption, setDeleteOption] = useState<string>('');
const [memberToDelete, setMemberToDelete] = useState<any>(null);
const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();

// Fix column types:
const columns: ColumnType<CategoryLineupMemberWithMember>[] = [
  { key: 'member', label: 'Člen', align: 'left' as ColumnAlignType },
  // ...
];

// Add types to callbacks:
const handleMemberAction = (member: CategoryLineupMemberWithMember) => {
  // ...
};
```

**Files to modify**:
- `src/app/coaches/lineups/components/LineupMembers.tsx`

**Lines affected**: 100, 101, 102, 117, 120, 195

---

### 7. TrainingSessionGenerator.tsx (1 error)
**Problem**: `createTrainingSession` method doesn't exist on the hook return type.

**Root Cause**: Hook doesn't expose this method or it was renamed.

**Solution**:
- Check `useTrainingSession` hook and add the method if missing
- Or use the correct method name (might be `create` or `addTrainingSession`)

**Files to modify**:
- `src/app/coaches/attendance/components/TrainingSessionGenerator.tsx`
- `src/hooks/entities/training-session/state/useTrainingSession.ts` (if method needs to be added)

**Lines affected**: 60

---

### 8. entities/[entity]/[id]/route.ts (2 errors)
**Problem**: `config.queryLayer.getById` might be undefined.

**Root Cause**: Not all entity configs have `getById` in their queryLayer.

**Solution**:
```typescript
// Add safety check:
if (!config.queryLayer?.getById) {
  return NextResponse.json(
    { error: 'getById not supported for this entity' },
    { status: 400 }
  );
}

const data = await config.queryLayer.getById(id);
```

**Files to modify**:
- `src/app/api/entities/[entity]/[id]/route.ts`

**Lines affected**: 27

---

## Implementation Order

1. **Phase 1**: Fix schema/type issues (1, 3)
2. **Phase 2**: Fix hook/function issues (5, 7)
3. **Phase 3**: Fix component issues (2, 4, 6)
4. **Phase 4**: Fix API safety (8)

## Verification Steps

After each fix:
1. Run `npx tsc --noEmit` to check remaining errors
2. Run `npm run test:run` to ensure no test breakage
3. Run `npm run lint` to check code quality

## Estimated Time
- Phase 1: 15 minutes
- Phase 2: 20 minutes
- Phase 3: 30 minutes
- Phase 4: 10 minutes
**Total: ~75 minutes**
