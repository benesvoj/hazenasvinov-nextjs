# Types Folder Organization

This folder contains all TypeScript type definitions organized by domain and purpose for better maintainability and discoverability.

## 📁 **Folder Structure**

```
types/
├── entities/                    # Domain-specific types grouped by entity
│   ├── match/                  # Match-related types
│   │   ├── data/              # Data fetching and API response types
│   │   ├── business/          # Business logic and domain types
│   │   └── state/             # State management and UI state types
│   ├── member/                # Member-related types
│   ├── category/              # Category-related types
│   ├── team/                  # Team-related types
│   └── attendance/            # Attendance-related types
├── shared/                    # Cross-cutting concern types
├── features/                  # Feature-specific types
├── components/                # Component-specific types
└── index.ts                   # Auto-generated barrel file
```

## 🎯 **Folder Purposes**

### **`entities/` - Domain-Specific Types**

Contains types organized by business domain/entity. Each entity folder follows the same sub-folder pattern:

#### **`data/` - Data Layer Types**
**Purpose**: Types related to data fetching, API responses, and data transformation.

**What belongs here**:
- API response types
- Database entity types
- Data fetching hook return types
- API request/response interfaces
- Data transformation types
- External API integration types

**Examples**:
```typescript
// match/data/matches.ts
export interface MatchApiResponse {
  id: string;
  home_team_id: string;
  away_team_id: string;
  // ... API response fields
}

// member/data/member.ts
export interface MemberDatabaseEntity {
  id: string;
  first_name: string;
  last_name: string;
  // ... database fields
}
```

#### **`business/` - Business Logic Types**
**Purpose**: Types that represent business rules, domain logic, and core business concepts.

**What belongs here**:
- Domain model types
- Business rule types
- Service layer types
- Business validation types
- Domain-specific enums
- Business process types

**Examples**:
```typescript
// match/business/lineup.ts
export interface LineupFormData {
  players: LineupPlayerFormData[];
  coaches: LineupCoachFormData[];
}

export interface LineupValidationRules {
  maxPlayers: number;
  maxCoaches: number;
  requiredPositions: string[];
}

// member/business/clubMemberRelationship.ts
export interface ClubMemberRelationship {
  memberId: string;
  clubId: string;
  role: MemberRole;
  startDate: Date;
  endDate?: Date;
}
```

#### **`state/` - State Management Types**
**Purpose**: Types related to component state, UI state, and state management.

**What belongs here**:
- Component state types
- Redux/Context state types
- Form state types
- UI state types
- Local storage types
- State management action types

**Examples**:
```typescript
// match/state/standing.ts
export interface MatchStandingState {
  isLoading: boolean;
  error: string | null;
  standings: Standing[];
  lastUpdated: Date;
}

// member/state/profile.ts
export interface MemberProfileState {
  member: Member | null;
  isLoading: boolean;
  isEditing: boolean;
  formData: MemberFormData;
}
```

### **`shared/` - Cross-Cutting Concern Types**

**Purpose**: Types used across multiple domains or features.

**What belongs here**:
- Common utility types
- API base types
- Authentication types
- Common interfaces
- Utility type definitions
- Global configuration types

**Examples**:
```typescript
// shared/api.ts
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// shared/auth.ts
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

// shared/common.ts
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
```

### **`features/` - Feature-Specific Types**

**Purpose**: Types for specific features that don't belong to a single entity.

**What belongs here**:
- Blog feature types
- Gallery feature types
- Video feature types
- Meeting minutes types
- Release notes types
- Other feature-specific types

**Examples**:
```typescript
// features/blog/blogPost.ts
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  publishedAt: Date;
}

// features/gallery/photoGallery.ts
export interface PhotoGallery {
  id: string;
  title: string;
  photos: Photo[];
  createdAt: Date;
}
```

### **`components/` - Component-Specific Types**

**Purpose**: Types that are specific to individual components and not reusable.

**What belongs here**:
- Component prop types
- Component state types
- Component-specific interfaces
- Component event types

**Examples**:
```typescript
// components/comment.ts
export interface CommentProps {
  comment: Comment;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export interface CommentState {
  isEditing: boolean;
  editText: string;
}
```

## 🔄 **Auto-Generation**

The `index.ts` file is automatically generated using the `generate-type-exports.mjs` script. This ensures:

- **Consistent exports** across all type files
- **No manual maintenance** of the barrel file
- **Automatic updates** when files are added/removed
- **Conflict resolution** for duplicate type names
- **Exclusion of declaration files** (`.d.ts`) to prevent TypeScript compilation issues

## 📋 **Naming Conventions**

### **File Naming**
- Use **camelCase** for file names
- Be **descriptive** and **specific**
- Include the **entity name** when appropriate
- Use **singular** form for entity names

**Examples**:
- `matches.ts` ✅
- `lineupPlayer.ts` ✅
- `clubMemberRelationship.ts` ✅
- `match-data.ts` ❌ (use camelCase)
- `matches.ts` ❌ (use singular)

### **Type Naming**
- Use **PascalCase** for type names
- Be **descriptive** and **clear**
- Include **context** when necessary
- Use **interfaces** for object shapes
- Use **types** for unions, primitives, and computed types

**Examples**:
```typescript
// Good
export interface MatchFormData { }
export type MatchStatus = 'scheduled' | 'in_progress' | 'completed';
export interface LineupPlayerFormData { }

// Avoid
export interface matchData { }  // Use PascalCase
export type status = string;    // Be more specific
```

## 🚀 **Usage Examples**

### **Importing Types**
```typescript
// Import from specific entity
import { MatchFormData } from '@/types/entities/match/business/lineup';
import { MemberApiResponse } from '@/types/entities/member/data/member';

// Import from shared
import { ApiResponse } from '@/types/shared/api';
import { AuthUser } from '@/types/shared/auth';

// Import from features
import { BlogPost } from '@/types/features/blog/blogPost';

// Import from components
import { CommentProps } from '@/types/components/comment';
```

### **Creating New Types**
1. **Identify the domain** (entity, shared, feature, component)
2. **Choose the appropriate subfolder** (data, business, state)
3. **Create the file** with descriptive name
4. **Export the types** from the file
5. **Run the generation script** to update index.ts

## 🔧 **Maintenance**

### **Adding New Types**
1. Create the type file in the appropriate folder
2. Export the types from the file
3. Run `npm run generate:types` to update the barrel file
4. Update imports in consuming files if needed

### **Moving Types**
1. Move the file to the new location
2. Update any direct imports
3. Run `npm run generate:types` to update the barrel file

### **Removing Types**
1. Remove the type file
2. Update any imports that reference the removed types
3. Run `npm run generate:types` to update the barrel file

## 📚 **Best Practices**

1. **Keep types close to their usage** - Place types in the most specific folder possible
2. **Use descriptive names** - Make type names self-documenting
3. **Group related types** - Keep related types in the same file
4. **Avoid deep nesting** - Don't create too many subfolders
5. **Document complex types** - Add JSDoc comments for complex types
6. **Use generics** - For reusable type patterns
7. **Export from index** - Always export types from the file they're defined in
8. **Keep barrel file clean** - Let the auto-generation script handle the index.ts

This organization provides a clear, scalable structure for managing TypeScript types in a large codebase while maintaining consistency and discoverability.
