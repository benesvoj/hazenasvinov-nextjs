# UnifiedTable Action Columns Migration Guide

## Overview

The `UnifiedTable` component now supports built-in action columns to eliminate code duplication across admin tables. This guide shows how to migrate existing tables to use the new action column API.

## Benefits

- **Eliminates Code Duplication**: No more repetitive action column implementations
- **Consistent UI**: Standardized button styling and behavior across all tables
- **Type Safety**: Full TypeScript support with proper interfaces
- **Flexible Configuration**: Customizable icons, colors, and behaviors
- **Maintainable**: Centralized action column logic

## New API

### Action Types

```typescript
export type ActionType = 'edit' | 'delete' | 'view';
```

### Action Configuration

```typescript
export interface ActionConfig<T = any> {
  type: ActionType;
  onPress: (item: T) => void;
  icon?: React.ReactNode;
  color?: 'primary' | 'danger' | 'warning' | 'success' | 'default';
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  disabled?: (item: T) => boolean;
}
```

### Column Configuration

```typescript
export type ColumnType<T = any> = {
  key: keyof T | string;
  label: React.ReactNode;
  // ... other properties
  isActionColumn?: boolean;
  actions?: ActionConfig<T>[];
};
```

## Migration Examples

### Before (Old Pattern)

```typescript
// Old way - repetitive code
const columns = [
  {key: 'name', label: 'Name'},
  {key: 'email', label: 'Email'},
  {key: 'actions', label: 'Actions', align: 'center'},
];

const ActionsCell = ({user}: {user: User}) => {
  return (
    <div className="flex justify-center gap-2">
      <Button
        size="sm"
        variant="light"
        color="primary"
        isIconOnly
        onPress={() => openEditModal(user)}
      >
        <PencilIcon className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="light"
        color="danger"
        isIconOnly
        onPress={() => openDeleteModal(user)}
      >
        <TrashIcon className="w-4 h-4" />
      </Button>
    </div>
  );
};

const renderCell = (user: User, columnKey: string) => {
  switch (columnKey) {
    case 'name':
      return <span>{user.name}</span>;
    case 'email':
      return <span>{user.email}</span>;
    case 'actions':
      return <ActionsCell user={user} />;
  }
};
```

### After (New Pattern)

```typescript
// New way - clean and declarative
const columns = [
  {key: 'name', label: 'Name'},
  {key: 'email', label: 'Email'},
  {
    key: 'actions',
    label: 'Actions',
    align: ColumnAlignType.CENTER,
    isActionColumn: true,
    actions: [
      {
        type: 'edit' as const,
        onPress: openEditModal,
        title: 'Edit user',
      },
      {
        type: 'delete' as const,
        onPress: openDeleteModal,
        title: 'Delete user',
      },
    ],
  },
];

const renderCell = (user: User, columnKey: string) => {
  switch (columnKey) {
    case 'name':
      return <span>{user.name}</span>;
    case 'email':
      return <span>{user.email}</span>;
    // actions are handled automatically!
  }
};
```

## Advanced Examples

### Custom Icons and Colors

```typescript
{
  key: 'actions',
  label: 'Actions',
  isActionColumn: true,
  actions: [
    {
      type: 'view' as const,
      onPress: viewUser,
      icon: <EyeIcon className="w-4 h-4" />,
      color: 'success',
      title: 'View details',
    },
    {
      type: 'edit' as const,
      onPress: editUser,
      color: 'warning',
      variant: 'bordered',
      title: 'Edit user',
    },
    {
      type: 'delete' as const,
      onPress: deleteUser,
      disabled: (user) => user.isAdmin,
      title: 'Delete user',
    },
  ],
}
```

### Conditional Actions

```typescript
{
  key: 'actions',
  label: 'Actions',
  isActionColumn: true,
  actions: [
    {
      type: 'edit' as const,
      onPress: editItem,
      disabled: (item) => !item.canEdit,
    },
    {
      type: 'delete' as const,
      onPress: deleteItem,
      disabled: (item) => !item.canDelete,
    },
  ],
}
```

## Migration Steps

1. **Remove Action Cell Components**: Delete any `ActionsCell` or similar components
2. **Update Column Definitions**: Add `isActionColumn: true` and `actions` array
3. **Remove Action Cases**: Remove action cases from `renderCell` functions
4. **Remove Unused Imports**: Remove icon imports that are no longer needed
5. **Test Functionality**: Ensure all actions work as expected

## Files to Update

Based on the codebase analysis, these files should be migrated:

- `src/app/admin/committees/page.tsx`
- `src/app/admin/members/components/MembersInternalTab.tsx`
- `src/app/admin/clubs/page.tsx`
- `src/app/admin/posts/page.tsx`
- `src/app/admin/seasons/page.tsx`
- `src/app/admin/categories/page.tsx`
- `src/app/admin/member-functions/page.tsx`
- `src/app/admin/users/components/UsersTab.tsx`

## Benefits After Migration

- **Reduced Code**: ~20-30 lines less per table
- **Consistent UX**: All action buttons look and behave the same
- **Easier Maintenance**: Changes to action styling only need to be made in one place
- **Better Type Safety**: Compile-time checks for action configurations
- **Future-Proof**: Easy to add new action types or modify existing ones

## Default Behavior

The action column system provides sensible defaults:

- **Edit**: Pencil icon, primary color, light variant
- **Delete**: Trash icon, danger color, light variant  
- **View**: Eye icon, primary color, light variant
- **Container**: `flex justify-center gap-2`
- **Button Size**: `sm`
- **Button Style**: `isIconOnly`

These can all be overridden per action as needed.
