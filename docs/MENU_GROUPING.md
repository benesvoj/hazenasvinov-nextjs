# Menu Grouping System

This document describes the menu grouping system implemented in the admin sidebar.

## Overview

The admin sidebar now supports grouping related menu items together with visual headers and separators. This improves navigation organization and makes it easier to find related functionality.

## Current Groups

### User Management
- **Uživatelé** - User account management
- **Uživatelské role** - Role and permission management

### Members Management  
- **Členové** - Club member management
- **Funkce členů** - Member function management

### Other
All other menu items that don't belong to a specific group are placed in the "Other" category without a group header.

## Implementation

### Adding Groups

To add a new group or assign items to existing groups:

1. **Update the MenuItem interface** in `src/routes/routes.ts`:
   ```typescript
   export interface MenuItem {
     // ... existing properties
     group?: string; // Add group property
   }
   ```

2. **Assign group to menu items**:
   ```typescript
   {route: privateRoutes.example, title: 'Example', isPrivate: true, group: 'example-group'}
   ```

3. **Add group label** in `src/app/admin/components/Sidebar.tsx`:
   ```typescript
   const groupLabels: Record<string, string> = {
     'user-management': 'Správa uživatelů',
     'members-management': 'Správa členů',
     'example-group': 'Example Group', // Add new group
     'other': 'Ostatní'
   };
   ```

### Group Behavior

- **Group Headers**: Only shown for non-"other" groups
- **Collapsed Sidebar**: Group headers are hidden when sidebar is collapsed
- **Visual Separation**: Subtle dividers separate groups
- **Responsive**: Works on both desktop and mobile layouts

### Adding New Groups

To create a new group:

1. Choose a group key (e.g., `'content-management'`)
2. Add the group label to `groupLabels`
3. Assign the group to relevant menu items
4. Items without a group will automatically go to "Other"

## Example

```typescript
// Add new group
const groupLabels: Record<string, string> = {
  'user-management': 'Správa uživatelů',
  'members-management': 'Správa členů',
  'content-management': 'Správa obsahu', // New group
  'other': 'Ostatní'
};

// Assign items to group
{route: privateRoutes.posts, title: 'Články', isPrivate: true, group: 'content-management'},
{route: privateRoutes.photoGallery, title: 'Fotogalerie', isPrivate: true, group: 'content-management'},
```

## Collapsible Groups

Groups can be collapsed and expanded by clicking on the group header. This feature provides:

- **Space Efficiency**: Hide groups you don't need to focus on
- **Better Organization**: Keep the sidebar clean and organized
- **Smooth Animations**: 300ms transition effects for collapse/expand
- **Visual Indicators**: Chevron icons show current state (right = collapsed, down = expanded)
- **Persistent State**: Groups remember their collapsed state during the session

### Collapsible Behavior

- **Click to Toggle**: Click any group header to collapse/expand
- **Visual Feedback**: Hover effects on group headers
- **Smooth Transitions**: CSS transitions for height and opacity changes
- **Icon Indicators**: ChevronRight (collapsed) vs ChevronDown (expanded)
- **Responsive**: Works on both desktop and mobile layouts

### Technical Implementation

The collapsible functionality is implemented using:

```typescript
// State management
const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

// Toggle function
const toggleGroup = (groupKey: string) => {
  setCollapsedGroups(prev => {
    const newSet = new Set(prev);
    if (newSet.has(groupKey)) {
      newSet.delete(groupKey);
    } else {
      newSet.add(groupKey);
    }
    return newSet;
  });
};

// CSS classes for animation
className={`transition-all duration-300 ease-in-out overflow-hidden ${
  collapsedGroups.has(groupKey) ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
}`}
```

## Benefits

- **Better Organization**: Related functionality is grouped together
- **Improved UX**: Users can quickly find what they're looking for
- **Space Management**: Collapse groups to focus on specific areas
- **Scalable**: Easy to add new groups as the system grows
- **Clean Design**: Visual hierarchy with headers and separators
- **Responsive**: Works well on all screen sizes
- **Interactive**: Collapsible groups for better space utilization
