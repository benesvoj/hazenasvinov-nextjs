# Architecture Documentation

> Complete guide to the codebase architecture and patterns

## Quick Links

- **[Layered Architecture](./LAYERED_ARCHITECTURE.md)** - How the codebase is organized into layers
- **[Factory Patterns](./FACTORY_PATTERNS.md)** - Reusable hook factories
- **[Type Organization](./TYPE_ORGANIZATION.md)** - How types are structured
- **[Development Guidelines](../DEVELOPMENT_GUIDELINES.md)** - Quick reference for common tasks

## Architecture Overview

This codebase follows a **layered architecture** with clear separation of concerns:

```
┌────────────────────────────────────────┐
│ Presentation Layer (UI)                │  React components
├────────────────────────────────────────┤
│ Business Logic Layer                   │  Filtering, calculations
├────────────────────────────────────────┤
│ State Management Layer                 │  Forms, CRUD coordination
├────────────────────────────────────────┤
│ Data Access Layer                      │  API fetching
├────────────────────────────────────────┤
│ Query Layer                            │  Database operations
├────────────────────────────────────────┤
│ Database (Supabase)                    │  PostgreSQL
└────────────────────────────────────────┘
```

## Key Principles

### 1. Separation of Concerns
Each layer has a single, well-defined responsibility. Never bypass layers.

### 2. Factory Patterns
Use factory functions to generate consistent hooks:
- `createDataFetchHook` - Data fetching
- `createFormHook` - Form management
- `createCRUDHook` - CRUD operations

### 3. Type Safety
Strict TypeScript types at every layer:
- Schema types for database
- Data types for application
- Form types for user input

### 4. Performance First
- React.memo for expensive components
- useCallback for stable references
- useMemo for expensive calculations
- Pagination for large lists

## Common Workflows

### Workflow 1: Display Entity List
```typescript
// 1. Fetch data (Data Access Layer)
const {data: videos, loading} = useFetchVideos();

// 2. Apply business logic (Business Layer)
const {paginatedVideos} = useVideoFiltering({
  videos,
  itemsPerPage: 20,
  currentPage: 1
});

// 3. Render (Presentation Layer)
return <VideoGrid videos={paginatedVideos} loading={loading} />;
```

### Workflow 2: Create Entity
```typescript
// 1. Form state (State Layer)
const {formData, setFormData, validateForm} = useVideoForm();

// 2. CRUD operations (State Layer)
const {createVideo} = useVideos();

// 3. Submit handler
const handleSubmit = async () => {
  const {valid} = validateForm();
  if (!valid) return;

  await createVideo(transformToInsert(formData));
};
```

### Workflow 3: Filter and Search
```typescript
// 1. Fetch all data
const {data: allVideos} = useFetchVideos();

// 2. Apply filters
const {filters, setFilters, paginatedVideos} = useVideoFiltering({
  videos: allVideos,
  itemsPerPage: 20,
  currentPage: 1
});

// 3. Render filtered results
return (
  <>
    <SearchFilters filters={filters} onChange={setFilters} />
    <VideoGrid videos={paginatedVideos} />
  </>
);
```

## File Organization

```
src/
├── app/
│   ├── api/entities/            # Generic entity API routes
│   ├── admin/{entity}/          # Admin pages
│   └── coaches/                 # Coach-specific pages
├── components/
│   ├── features/{entity}/       # Entity-specific components
│   └── ui/                      # Reusable UI components
├── hooks/
│   ├── factories/               # Hook factory functions
│   └── entities/{entity}/       # Entity-specific hooks
│       ├── data/                # Data fetching
│       ├── state/               # State management
│       └── business/            # Business logic
├── queries/{entity}/            # Query layer (database access)
│   ├── constants.ts
│   ├── queries.ts               # Read operations
│   ├── mutations.ts             # Write operations
│   └── index.ts
└── types/entities/{entity}/     # Type definitions
    ├── schema/                  # Auto-generated
    ├── data/                    # Manual types
    └── index.ts
```

## Rules for AI Assistants

### ALWAYS:
1. ✅ Check existing patterns before creating new code
2. ✅ Use factory patterns when available
3. ✅ Follow the layered architecture
4. ✅ Use proper types for each context
5. ✅ Add memoization for performance
6. ✅ Document significant decisions

### NEVER:
1. ❌ Bypass the query layer (no direct Supabase in components/hooks)
2. ❌ Edit auto-generated schema files
3. ❌ Put business logic in components
4. ❌ Create duplicate code when factories exist
5. ❌ Skip validation in forms
6. ❌ Ignore performance (always consider pagination/memoization)

## Quick Decision Tree

### "Where should this code go?"

**Fetching data?** → Data Access Layer (`hooks/entities/{entity}/data/`)
- Use `createDataFetchHook`

**Form management?** → State Layer (`hooks/entities/{entity}/state/`)
- Use `createFormHook`

**CRUD operations?** → State Layer (`hooks/entities/{entity}/state/`)
- Use `createCRUDHook`

**Filtering/sorting?** → Business Layer (`hooks/entities/{entity}/business/`)
- Custom hook with useMemo

**UI rendering?** → Presentation Layer (`components/` or `app/`)
- React component

**Database query?** → Query Layer (`queries/{entity}/`)
- Query function returning QueryResult

## Examples by Task

### Task: "Add a new entity"
→ See [Development Guidelines - Adding a New Entity](../DEVELOPMENT_GUIDELINES.md#adding-a-new-entity)

### Task: "Add filtering to existing page"
→ See [Development Guidelines - Adding Filtering/Pagination](../DEVELOPMENT_GUIDELINES.md#adding-filteringpagination)

### Task: "Fix performance issue"
→ See [Development Guidelines - Performance Optimization](../DEVELOPMENT_GUIDELINES.md#performance-optimization)

### Task: "Create a form"
→ See [Factory Patterns - createFormHook](./FACTORY_PATTERNS.md#2-createformhook---form-state-management)

## Learning Path

1. **Start**: Read [Layered Architecture](./LAYERED_ARCHITECTURE.md)
2. **Understand Patterns**: Read [Factory Patterns](./FACTORY_PATTERNS.md)
3. **Learn Types**: Read [Type Organization](./TYPE_ORGANIZATION.md)
4. **Practice**: Follow [Development Guidelines](../DEVELOPMENT_GUIDELINES.md)
5. **Reference**: Use specific layer README files when working

## Reference Documentation

### By Directory
- [Hooks](../../src/hooks/entities/HOOKS_README.md) - Hook organization
- [Queries](../../src/queries/QUERIES_README.md) - Query layer patterns
- [Types](../../src/types/entities/TYPES_README.md) - Type structure

### By Topic
- [Layered Architecture](./LAYERED_ARCHITECTURE.md) - Architecture layers
- [Factory Patterns](./FACTORY_PATTERNS.md) - Reusable factories
- [Type Organization](./TYPE_ORGANIZATION.md) - Type categories
- [Development Guidelines](../DEVELOPMENT_GUIDELINES.md) - How-to guides

## Getting Started

### For New Developers
1. Read this README
2. Read [Layered Architecture](./LAYERED_ARCHITECTURE.md)
3. Explore existing entities (videos, blogs, todos) as examples
4. Follow [Development Guidelines](../DEVELOPMENT_GUIDELINES.md) for tasks

### For AI Assistants
1. **Before writing code**: Check if similar code exists
2. **Before creating hooks**: Check if factory exists
3. **Before querying database**: Use query layer
4. **Before creating types**: Check if type exists
5. **When unsure**: Ask user or refer to documentation

## Maintenance

### Updating Documentation
When making architectural changes:
1. Update relevant documentation
2. Add examples
3. Update decision records
4. Notify team

### Adding New Patterns
When introducing new patterns:
1. Document in appropriate section
2. Create examples
3. Update guidelines
4. Consider creating factory if repeated

## Questions?

Refer to specific documentation files linked above, or check:
- Existing code examples (videos, blogs, todos are well-documented)
- [Development Guidelines](../DEVELOPMENT_GUIDELINES.md) for specific tasks
- Code comments and JSDoc in factory functions
