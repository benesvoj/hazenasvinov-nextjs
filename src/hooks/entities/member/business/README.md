# Member Business Logic Hooks

This folder contains hooks responsible for **business logic** and **domain-specific operations** related to members.

## Purpose
These hooks implement complex business rules, relationships, and domain-specific logic that goes beyond simple data fetching.

## Hooks

### Business Logic
- **`useMemberClubRelationships`** - Manage member-club relationships and associations
- **`useMemberMetadata`** - Handle member metadata and additional information

## Usage Pattern
```typescript
import { useMemberClubRelationships, useMemberMetadata } from '@/hooks';

// Manage member-club relationships
const {
  relationships,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  isLoading
} = useMemberClubRelationships();

// Handle member metadata
const {
  metadata,
  addMetadata,
  updateMetadata,
  deleteMetadata
} = useMemberMetadata(memberId);
```

## Key Features
- ✅ Complex relationship management
- ✅ Business rule implementation
- ✅ Domain-specific logic
- ✅ Cross-entity operations
- ✅ Data validation
- ✅ Relationship status management
