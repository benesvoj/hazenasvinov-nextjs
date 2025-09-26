# Component System Documentation

This document provides an overview of the comprehensive component system built for the Hazen a Svinov Next.js application.

## 🏗️ Architecture Overview

The component system is built using **Hero UI** components as the foundation, with custom components that provide consistent patterns and functionality across the application.

## 📦 Core Components

### Layout & Navigation
- **Header** - Main site header with navigation and theme switching
- **Logo** - Club logo component with responsive sizing
- **Link** - Custom link component with consistent styling
- **ThemeSwitch** - Dark/light mode toggle

### Data Display
- **BlogPostCard** - Blog post display with landing and blog variants
- **MatchSchedule** - Match scheduling and display
- **MatchRow** - Individual match row component
- **DataTable** - Reusable data table with search, sort, and pagination

### User Interface
- **Toast** - Notification system
- **DeleteConfirmationModal** - Confirmation dialogs
- **DropdownMenu** - Dropdown navigation menus
- **ModalWithForm** - Form modal wrapper

### Error Handling
- **ChunkErrorBoundary** - React error boundary for chunks
- **DatabaseErrorBoundary** - Database connection error handling

## 🎨 New Component System

### Loading States
```tsx
import { LoadingSpinner, FullPageSpinner, InlineSpinner } from '@/components';

// Basic loading spinner
<LoadingSpinner size="md" label="Načítání..." />

// Full page loading
<FullPageSpinner label="Načítání stránky..." />

// Inline loading
<InlineSpinner size="sm" />
```

### Empty States
```tsx
import { EmptyState, EmptyPostsState } from '@/components';

// Generic empty state
<EmptyState
  title="Žádná data"
  description="Zatím nejsou k dispozici žádná data."
  action={{
    label: "Přidat data",
    onClick: handleAdd
  }}
/>

// Specific empty states
<EmptyPostsState onCreatePost={handleCreatePost} />
<EmptyMatchesState onCreateMatch={handleCreateMatch} />
<EmptyMembersState onAddMember={handleAddMember} />
```

### Status Badges
```tsx
import { StatusBadge, PostStatusBadge } from '@/components';

// Generic status badge
<StatusBadge status="published" />

// Specific status badges
<PostStatusBadge status="draft" />
<MatchStatusBadge status="completed" />
<UserStatusBadge status="active" />
```

### Form Components
```tsx
import { FormField, FormGrid, FormSection } from '@/components/forms';

// Text input field
<FormField
  type="text"
  label="Název"
  name="title"
  value={title}
  onChange={setTitle}
  required
  placeholder="Zadejte název..."
/>

// Select field
<FormField
  type="select"
  label="Kategorie"
  name="category"
  value={category}
  onChange={setCategory}
  options={[
    { value: "sport", label: "Sport" },
    { value: "news", label: "Novinky" }
  ]}
/>

// Textarea field
<FormField
  type="textarea"
  label="Popis"
  name="description"
  value={description}
  onChange={setDescription}
  rows={4}
/>

// Form layout
<FormGrid columns={2}>
  <FormSection title="Základní informace">
    <FormField type="text" label="Název" name="name" />
    <FormField type="email" label="Email" name="email" />
  </FormSection>
  <FormSection title="Nastavení">
    <FormField type="checkbox" label="Aktivní" name="active" />
    <FormField type="switch" label="Oznámení" name="notifications" />
  </FormSection>
</FormGrid>
```

### Card Components
```tsx
import { 
  SimpleCard, 
  StatsCard, 
  FeatureCard,
  ActionCard 
} from '@/components';

// Simple card with actions
<SimpleCard
  title="Název karty"
  subtitle="Podtitulek"
  description="Popis karty"
  actions={[
    {
      label: "Upravit",
      onClick: handleEdit,
      variant: "outline"
    },
    {
      label: "Smazat",
      onClick: handleDelete,
      variant: "outline",
      color: "danger"
    }
  ]}
>
  Obsah karty
</SimpleCard>

// Stats card
<StatsCard
  title="Celkem článků"
  value={postCount}
  change={{
    value: 12,
    isPositive: true,
    period: "za měsíc"
  }}
  trend="up"
/>

// Feature card
<FeatureCard
  title="Funkce"
  description="Popis funkce"
  icon={<TrophyIcon />}
  link={{
    href: "/features",
    label: "Více informací"
  }}
/>
```

### Navigation Components
```tsx
import { 
  HorizontalNavigation, 
  VerticalNavigation,
  Breadcrumb,
  Pagination 
} from '@/components';

// Horizontal navigation
<HorizontalNavigation
  items={[
    {
      title: "Úvod",
      href: "/"
    },
    {
      title: "Kategorie",
      children: [
        { title: "Sport", href: "/sport" },
        { title: "Novinky", href: "/news" }
      ]
    }
  ]}
/>

// Breadcrumb
<Breadcrumb
  items={[
    { title: "Úvod", href: "/" },
    { title: "Kategorie", href: "/category" },
    { title: "Sport", current: true }
  ]}
/>

// Pagination
<Pagination
  currentPage={1}
  totalPages={10}
  onPageChange={handlePageChange}
/>
```

## 🔧 Usage Patterns

### Consistent Styling
All components use consistent color schemes and spacing:
- **Primary colors**: Blue variants for main actions
- **Success colors**: Green for positive states
- **Warning colors**: Yellow/Orange for caution
- **Danger colors**: Red for destructive actions
- **Spacing**: Consistent 4px grid system

### Responsive Design
Components are built with mobile-first approach:
- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Mobile-optimized interactions
- Touch-friendly button sizes

### Accessibility
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management

### Dark Mode Support
All components support both light and dark themes:
- Automatic theme switching
- Consistent color schemes
- Smooth transitions

## 📱 Component Variants

### Size Variants
- **sm**: Small components for compact layouts
- **md**: Default size for most use cases
- **lg**: Large components for emphasis

### Color Variants
- **default**: Neutral styling
- **primary**: Main brand color
- **secondary**: Supporting color
- **success**: Positive actions
- **warning**: Caution states
- **danger**: Destructive actions

### Style Variants
- **solid**: Filled appearance
- **outline**: Bordered appearance
- **light**: Subtle background
- **flat**: Minimal styling
- **faded**: Muted appearance
- **shadow**: Elevated appearance

## 🚀 Best Practices

### Component Composition
- Use composition over inheritance
- Keep components focused and single-purpose
- Leverage prop spreading for flexibility

### Performance
- Use React.memo for expensive components
- Implement proper key props for lists
- Lazy load heavy components when possible

### State Management
- Keep component state local when possible
- Use context for shared state
- Implement proper error boundaries

### Testing
- Write unit tests for component logic
- Test accessibility features
- Verify responsive behavior

## 🔄 Migration Guide

### From Old Components
1. Replace custom button implementations with Button component
2. Update form inputs to use form components
3. Replace custom modals with ModalWithForm
4. Update navigation to use Navigation components

### Hero UI Integration
- All components are built on top of Hero UI
- Maintain consistent prop interfaces
- Leverage Hero UI's built-in accessibility features

## 📚 Examples

See the individual component files for detailed examples and usage patterns. Each component includes:
- TypeScript interfaces
- Usage examples
- Props documentation
- Variant demonstrations

## 🤝 Contributing

When adding new components:
1. Follow the established patterns
2. Include TypeScript interfaces
3. Add comprehensive examples
4. Update this documentation
5. Ensure accessibility compliance
6. Test across different screen sizes
7. Verify dark mode support

## 📞 Support

For questions about the component system:
1. Check this documentation
2. Review component examples
3. Check TypeScript interfaces
4. Consult the Hero UI documentation
