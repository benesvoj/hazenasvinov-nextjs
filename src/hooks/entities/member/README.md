# Member Hooks

This folder contains all hooks related to **member management** and **member data operations**.

## Structure

The member hooks are organized into three main categories:

### 📁 `data/` - Data Fetching
Hooks responsible for fetching member data from the database or API.
- Direct database queries
- API communication
- Data retrieval operations

### 📁 `state/` - State Management  
Hooks responsible for managing member data state and CRUD operations.
- Complete CRUD operations
- Form validation
- State persistence

### 📁 `business/` - Business Logic
Hooks implementing complex business rules and domain logic.
- Member-club relationships
- Metadata management
- Cross-entity operations

## Quick Start

```typescript
import { 
  useFetchMembers,              // Data fetching
  useMembers,                   // State management
  useMemberClubRelationships    // Business logic
} from '@/hooks';

// Fetch members
const { members, loading } = useFetchMembers();

// Manage members (CRUD)
const { createMember, updateMember, deleteMember } = useMembers();

// Handle relationships
const { createRelationship } = useMemberClubRelationships();
```

## Hook Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Data** | Fetch data from sources | `useFetchMembers`, `useFetchMemberFunctions` |
| **State** | Manage data state | `useMembers` (CRUD operations) |
| **Business** | Implement business logic | `useMemberClubRelationships`, `useMemberMetadata` |

## Best Practices

1. **Use data hooks** for initial data fetching
2. **Use state hooks** for CRUD operations and form management
3. **Use business hooks** for complex relationships and metadata
4. **Combine hooks** for complex member management scenarios
5. **Check individual READMEs** for specific usage patterns

## Related Hooks

- **Club Hooks**: `@/hooks/entities/club/` - Club-related operations
- **User Hooks**: `@/hooks/entities/user/` - User management
- **Player Hooks**: `@/hooks/entities/player/` - Player-specific operations
