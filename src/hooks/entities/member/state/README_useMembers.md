# useMembers Hook

## Overview

The `useMembers` hook provides comprehensive CRUD operations for managing members. It follows the entity-based naming convention and provides all necessary operations for member management.

## Features

- **Create** members with optional club relationships
- **Read** members (fetch all, get by ID)
- **Update** existing members
- **Delete** members
- **Validation** with error handling
- **Local state management** for optimistic updates

## Usage Examples

### 1. Basic Member Management

```typescript
import { useMembers } from '@/hooks';

function MembersPage() {
  const {
    members,
    isLoading,
    errors,
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
    getMember
  } = useMembers();

  // Fetch members on component mount
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return (
    <div>
      {members.map(member => (
        <div key={member.id}>
          {member.name} {member.surname}
        </div>
      ))}
    </div>
  );
}
```

### 2. Create Member with Club Relationship

```typescript
const { createMember } = useMembers();

const handleCreateMember = async () => {
  try {
    const newMember = await createMember(
      {
        name: 'John',
        surname: 'Doe',
        registration_number: '12345',
        date_of_birth: '1990-01-01',
        sex: Genders.MALE,
        functions: [MemberFunction.PLAYER]
      },
      'category-id', // Optional category
      'club-id'      // Optional club - creates relationship if provided
    );
    
    console.log('Member created:', newMember);
  } catch (error) {
    console.error('Failed to create member:', error);
  }
};
```

### 3. Update Member

```typescript
const { updateMember } = useMembers();

const handleUpdateMember = async (memberId: string) => {
  try {
    const updatedMember = await updateMember({
      id: memberId,
      name: 'Updated Name',
      surname: 'Updated Surname',
      is_active: false
    });
    
    console.log('Member updated:', updatedMember);
  } catch (error) {
    console.error('Failed to update member:', error);
  }
};
```

### 4. Delete Member

```typescript
const { deleteMember } = useMembers();

const handleDeleteMember = async (memberId: string) => {
  try {
    await deleteMember(memberId);
    console.log('Member deleted successfully');
  } catch (error) {
    console.error('Failed to delete member:', error);
  }
};
```

### 5. Get Specific Member

```typescript
const { getMember } = useMembers();

const handleGetMember = async (memberId: string) => {
  try {
    const member = await getMember(memberId);
    console.log('Member details:', member);
  } catch (error) {
    console.error('Failed to get member:', error);
  }
};
```

### 6. Form Validation

```typescript
const { validateForm, errors, clearFieldError } = useMembers();

const handleFormChange = (field: string, value: string) => {
  setFormData(prev => ({...prev, [field]: value}));
  clearFieldError(field); // Clear error when user starts typing
};

const isFormValid = validateForm(formData);
```

## API Reference

### State
- `members: Member[]` - Array of all members
- `isLoading: boolean` - Loading state for any operation
- `errors: ValidationErrors` - Form validation errors

### CRUD Operations
- `fetchMembers()` - Fetch all members
- `createMember(formData, categoryId?, clubId?)` - Create new member
- `updateMember(memberData)` - Update existing member
- `deleteMember(memberId)` - Delete member
- `getMember(memberId)` - Get specific member

### Validation
- `validateForm(formData)` - Validate member form data
- `clearFieldError(field)` - Clear error for specific field
- `clearAllErrors()` - Clear all validation errors
- `reset()` - Reset hook state

## Benefits

1. **Entity-based naming** - Follows React conventions
2. **Complete CRUD** - All operations in one hook
3. **Type safety** - Full TypeScript support
4. **Error handling** - Consistent error management
5. **Local state** - Optimistic updates for better UX
6. **Validation** - Built-in form validation
7. **Club integration** - Automatic relationship creation

## Migration from useMemberCreation

The old `useMemberCreation` hook has been replaced by `useMembers`. The API is backward compatible for the `createMember` function, but now you have access to full CRUD operations.

```typescript
// Old way
const { createMember } = useMemberCreation();

// New way (same API, more features)
const { createMember, updateMember, deleteMember, fetchMembers } = useMembers();
```
