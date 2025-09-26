# Member Data Hooks

This folder contains hooks responsible for **data fetching** from the database or API for member-related information.

## Purpose
These hooks handle the direct communication with data sources (Supabase, APIs) to retrieve member data and related information.

## Hooks

### Core Data Fetching
- **`useFetchMembers`** - Fetch all members from the database
- **`useFetchMemberFunctions`** - Fetch available member functions/roles

## Usage Pattern
```typescript
import { useFetchMembers, useFetchMemberFunctions } from '@/hooks';

// Fetch all members
const { members, loading, error, refetch } = useFetchMembers();

// Fetch member functions
const { functions, loading: functionsLoading } = useFetchMemberFunctions();
```

## Key Features
- ✅ Direct database queries
- ✅ Error handling
- ✅ Loading states
- ✅ TypeScript support
- ✅ Automatic data refresh
