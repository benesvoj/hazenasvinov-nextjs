# Category Data Hooks

This folder contains hooks responsible for **data fetching** from the database or API for category-related information.

## Purpose
These hooks handle the direct communication with data sources (Supabase, APIs) to retrieve category data and related information.

## Hooks

### Core Data Fetching
- **`useFetchCategories`** - Fetch all categories from the API
- **`useFetchCategoryPosts`** - Fetch blog posts related to specific categories

## Usage Pattern
```typescript
import { useFetchCategories, useFetchCategoryPosts } from '@/hooks';

// Fetch all categories
const { data: categories, loading, error } = useFetchCategories();

// Fetch category posts
const { data: posts, loading: postsLoading } = useFetchCategoryPosts(categoryId);
```

## Key Features
- ✅ Direct API queries
- ✅ Error handling
- ✅ Loading states
- ✅ TypeScript support
- ✅ Automatic data refresh
