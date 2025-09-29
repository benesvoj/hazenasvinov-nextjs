# Category State Hooks

This folder contains hooks responsible for **state management** and **CRUD operations** for category data.

## Purpose
These hooks manage the state of category data, including create, read, update, and delete operations with proper state management.

## Hooks

### State Management
- **`useCategories`** - Complete CRUD operations for category management with state management

## Usage Pattern
```typescript
import { useCategories } from '@/hooks';

// Complete category management
const {
  categories,
  seasons,
  categorySeasons,
  selectedCategory,
  selectedSeason,
  loading,
  error,
  formData,
  fetchCategories,
  handleAddCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  handleAddSeason,
  handleUpdateSeason,
  handleRemoveSeason
} = useCategories();

// Add a new category
const handleCreate = async () => {
  await handleAddCategory();
};
```

## Key Features
- ✅ Complete CRUD operations
- ✅ Form data management
- ✅ Season management
- ✅ Error state management
- ✅ Loading states
- ✅ Modal state management
