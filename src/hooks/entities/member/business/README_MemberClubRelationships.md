# Member-Club Relationships Hook

## Overview

The `useMemberClubRelationships` hook provides a dedicated, reusable solution for managing member-club relationships. This hook follows the single responsibility principle and can be used independently of member creation.

## Usage Examples

### 1. Create a Member-Club Relationship

```typescript
import { useMemberClubRelationships } from '@/hooks';

function MyComponent() {
  const { createRelationship, isLoading } = useMemberClubRelationships();

  const handleCreateRelationship = async () => {
    try {
      await createRelationship({
        memberId: 'member-123',
        clubId: 'club-456',
        relationshipType: RelationshipType.PERMANENT,
        status: RelationshipStatus.ACTIVE,
        validFrom: '2024-01-01',
        notes: 'Full-time member'
      });
    } catch (error) {
      console.error('Failed to create relationship:', error);
    }
  };

  return (
    <button onClick={handleCreateRelationship} disabled={isLoading}>
      Create Relationship
    </button>
  );
}
```

### 2. Update a Relationship

```typescript
const { updateRelationship } = useMemberClubRelationships();

await updateRelationship({
  relationshipId: 'rel-123',
  status: RelationshipStatus.INACTIVE,
  validTo: '2024-12-31',
  notes: 'Member left the club'
});
```

### 3. Get Member's Relationships

```typescript
const { getMemberRelationships } = useMemberClubRelationships();

const relationships = await getMemberRelationships('member-123');
// Returns array of relationships with club details
```

### 4. Get Club's Relationships

```typescript
const { getClubRelationships } = useMemberClubRelationships();

const relationships = await getClubRelationships('club-456');
// Returns array of relationships with member details
```

## Benefits

1. **Single Responsibility**: Only handles member-club relationships
2. **Reusable**: Can be used in any component that needs relationship management
3. **Composable**: Works well with other hooks like `useMemberCreation`
4. **Type Safe**: Full TypeScript support with proper interfaces
5. **Error Handling**: Consistent error handling and user feedback

## Integration with Member Creation

The `useMemberCreation` hook now uses `useMemberClubRelationships` internally:

```typescript
// In useMemberCreation.ts
const { createRelationship } = useMemberClubRelationships();

// When creating a member with clubId
if (clubId) {
  await createRelationship({
    memberId: data.id,
    clubId: clubId,
  });
}
```

This approach provides both convenience (automatic relationship creation) and flexibility (independent relationship management).
