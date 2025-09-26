# Member State Hooks

This folder contains hooks responsible for **state management** and **CRUD operations** for member data.

## Purpose
These hooks manage the state of member data, including create, read, update, and delete operations with proper state management.

## Hooks

### State Management
- **`useMembers`** - Complete CRUD operations for member management with state management

## Usage Pattern
```typescript
import { useMembers } from '@/hooks';

// Complete member management
const {
  members,
  isLoading,
  errors,
  createMember,
  updateMember,
  deleteMember,
  validateMember,
  clearErrors
} = useMembers();

// Create a new member
const handleCreate = async (memberData) => {
  const result = await createMember(memberData);
  if (result.success) {
    // Handle success
  }
};
```

## Key Features
- ✅ Complete CRUD operations
- ✅ Form validation
- ✅ Error state management
- ✅ Loading states
- ✅ Toast notifications
- ✅ Data persistence
