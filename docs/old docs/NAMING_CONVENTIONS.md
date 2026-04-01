# Naming Conventions

This document outlines the naming conventions used throughout the project to ensure consistency, readability, and maintainability.

## 📁 **Folder Naming**

### **Rule: Use kebab-case (dash-separated)**
All folders should use lowercase letters with hyphens as separators.

```bash
✅ Good:
- ui/
- shared/
- features/
- meeting-minutes/
- video-player/
- admin-dashboard/
- lineup-manager/
- match-schedule/

❌ Bad:
- meetingMinutes/     # camelCase
- video_player/       # snake_case
- AdminDashboard/     # PascalCase
- VideoPlayer/        # PascalCase
```

### **Why kebab-case?**
- **URL-friendly**: Can be used in URLs without encoding
- **Cross-platform**: Works consistently across all operating systems
- **Readable**: Easy to read in file explorers and terminals
- **Standard**: Most popular convention in web development
- **No conflicts**: Avoids case sensitivity issues on different systems

## 📄 **File Naming**

### **1. React Components: PascalCase**
Component files should use PascalCase (first letter of each word capitalized).

```bash
✅ Good:
- RecordingCard.tsx
- MeetingMinutesContainer.tsx
- AdminSidebar.tsx
- LineupManager.tsx
- UnifiedModal.tsx
- DeleteConfirmationModal.tsx

❌ Bad:
- videoCard.tsx       # camelCase
- video_card.tsx      # snake_case
- video-card.tsx      # kebab-case
- Video_Card.tsx      # Mixed case
```

### **2. React Hooks: camelCase with 'use' prefix**
Hook files should use camelCase with the 'use' prefix.

```bash
✅ Good:
- useLineupDataManager.ts
- useAuth.ts
- useTeamClubId.ts
- useLineupModals.ts
- useLineupPerformance.ts

❌ Bad:
- UseLineupDataManager.ts  # PascalCase
- use_lineup_data_manager.ts  # snake_case
- use-lineup-data-manager.ts  # kebab-case
```

### **3. Utility Functions: camelCase**
Utility files should use camelCase.

```bash
✅ Good:
- apiClient.ts
- dateUtils.ts
- validationHelpers.ts
- errorHandlers.ts

❌ Bad:
- ApiClient.ts        # PascalCase
- api_client.ts       # snake_case
- api-client.ts       # kebab-case
```

### **4. Type Definitions: camelCase**
Type definition files should use camelCase.

```bash
✅ Good:
- userTypes.ts
- matchTypes.ts
- lineupTypes.ts
- apiTypes.ts

❌ Bad:
- UserTypes.ts        # PascalCase
- user_types.ts       # snake_case
- user-types.ts       # kebab-case
```

### **5. Constants: camelCase**
Constant files should use camelCase.

```bash
✅ Good:
- apiEndpoints.ts
- validationRules.ts
- errorMessages.ts
- defaultValues.ts

❌ Bad:
- ApiEndpoints.ts     # PascalCase
- api_endpoints.ts    # snake_case
- api-endpoints.ts    # kebab-case
```

### **6. Index Files: lowercase**
Index files should always be lowercase.

```bash
✅ Good:
- index.ts
- index.js

❌ Bad:
- Index.ts            # PascalCase
- INDEX.ts            # UPPERCASE
```

## 🏗️ **Project Structure Examples**

### **Components Folder**
```
src/components/
├── ui/                          # kebab-case folders
│   ├── buttons/
│   │   ├── ButtonWithTooltip.tsx  # PascalCase component files
│   │   └── index.ts
│   ├── cards/
│   │   ├── Card.tsx
│   │   ├── UnifiedCard.tsx
│   │   └── index.ts
│   ├── modals/
│   │   ├── UnifiedModal.tsx
│   │   ├── DeleteConfirmationModal.tsx
│   │   └── index.ts
│   └── index.ts
├── shared/                      # kebab-case
│   ├── lineup-manager/          # kebab-case
│   │   ├── components/
│   │   │   ├── TeamSelector.tsx
│   │   │   ├── PlayersTable.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
├── features/                    # kebab-case
│   ├── admin/
│   │   ├── AdminContainer.tsx
│   │   ├── AdminSidebar.tsx
│   │   └── index.ts
│   ├── videos/
│   │   ├── RecordingCard.tsx
│   │   ├── RecordingFilters.tsx
│   │   └── index.ts
│   ├── meeting-minutes/         # kebab-case
│   │   ├── MeetingMinutesCard.tsx
│   │   ├── MeetingMinutesContainer.tsx
│   │   └── index.ts
│   └── index.ts
└── index.ts
```

### **Hooks Folder**
```
src/hooks/
├── entities/                    # kebab-case
│   ├── match/
│   │   ├── data/
│   │   │   ├── useMatchData.ts
│   │   │   └── useMatchQueries.ts
│   │   ├── business/
│   │   │   ├── useMatchValidation.ts
│   │   │   └── useMatchProcessing.ts
│   │   └── index.ts
│   └── index.ts
├── shared/                      # kebab-case
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   └── index.ts
└── index.ts
```

### **Types Folder**
```
src/types/
├── entities/                    # kebab-case
│   ├── match/
│   │   ├── data/
│   │   │   ├── matchTypes.ts
│   │   │   └── matchApiTypes.ts
│   │   ├── business/
│   │   │   ├── lineupTypes.ts
│   │   │   └── validationTypes.ts
│   │   └── index.ts
│   └── index.ts
├── shared/                      # kebab-case
│   ├── apiTypes.ts
│   ├── authTypes.ts
│   └── index.ts
└── index.ts
```

## 🎯 **Component Naming Patterns**

### **1. UI Components**
- **Prefix**: None (just descriptive name)
- **Examples**: `Button`, `Card`, `Modal`, `Table`

### **2. Feature Components**
- **Prefix**: Feature name
- **Examples**: `RecordingCard`, `MeetingMinutesContainer`, `AdminSidebar`

### **3. Shared Business Components**
- **Prefix**: Domain name
- **Examples**: `LineupManager`, `MatchSchedule`, `PlayerManager`

### **4. Wrapper Components**
- **Prefix**: `Unified` for generic wrappers
- **Examples**: `UnifiedModal`, `UnifiedTable`, `UnifiedCard`

### **5. Hook Components**
- **Prefix**: `use` + descriptive name
- **Examples**: `useAuth`, `useLineupData`, `useTeamClubId`

## 📋 **Quick Reference Table**

| Type | Convention | Example | When to Use |
|------|------------|---------|-------------|
| **Folders** | kebab-case | `meeting-minutes/` | All folders |
| **Component Files** | PascalCase | `RecordingCard.tsx` | React components |
| **Hook Files** | camelCase | `useAuth.ts` | React hooks |
| **Utility Files** | camelCase | `apiClient.ts` | Utility functions |
| **Type Files** | camelCase | `userTypes.ts` | TypeScript types |
| **Constant Files** | camelCase | `apiEndpoints.ts` | Constants |
| **Index Files** | lowercase | `index.ts` | Barrel files |
| **Config Files** | kebab-case | `next.config.js` | Configuration files |

## 🚀 **Migration Guidelines**

When renaming files or folders to follow these conventions:

1. **Rename the file/folder** using your IDE or terminal
2. **Update all imports** that reference the old name
3. **Update barrel files** (`index.ts`) to export the new names
4. **Test the changes** to ensure everything still works
5. **Commit the changes** with a clear message about the rename

### **Example Migration**
```bash
# Before
src/components/meetingMinutes/MeetingMinutesCard.tsx

# After
src/components/meeting-minutes/MeetingMinutesCard.tsx

# Update imports
- import { MeetingMinutesCard } from '@/components/meetingMinutes/MeetingMinutesCard';
+ import { MeetingMinutesCard } from '@/components/meeting-minutes/MeetingMinutesCard';
```

## ✅ **Benefits of Consistent Naming**

1. **Predictability**: Developers know where to find files
2. **Maintainability**: Easier to refactor and reorganize
3. **Team Collaboration**: Reduces confusion and conflicts
4. **IDE Support**: Better autocomplete and IntelliSense
5. **Cross-platform**: Works consistently across different systems
6. **Professional**: Makes the codebase look more polished

## 🔧 **Tools and Automation**

### **ESLint Rules**
Consider adding ESLint rules to enforce naming conventions:

```json
{
  "rules": {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "variableLike",
        "format": ["camelCase"]
      },
      {
        "selector": "typeLike",
        "format": ["PascalCase"]
      }
    ]
  }
}
```

### **VS Code Settings**
Add to your VS Code settings for consistent file naming:

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true
}
```

This naming convention ensures consistency across the entire codebase and makes it easier for developers to navigate and maintain the project.
