# Cards

## Architecture

```
cards/
  ContentCard.tsx        ← high-level: title, actions, loading, empty state, footer
  Card.tsx               ← low-level: thin HeroUI wrapper for custom cards
  components/
    CardBody.tsx         ← extracted primitive (padding)
    CardHeader.tsx       ← extracted primitive (className passthrough)
    CardFooter.tsx       ← extracted primitive (justify)
    index.ts             ← barrel
```

## ContentCard (primary)

The standard card component for the entire app. Handles title, subtitle, actions, loading state, empty state, and footer out of the box.

```tsx
import {ContentCard, EmptyState} from '@/components';

<ContentCard
  title="Úkoly"
  actions={<Button onPress={onAdd}>Přidat</Button>}
  isLoading={loading}
  emptyState={isEmpty(items) &&
    <EmptyState type="todos" title={t.empty} description={t.emptyDesc} />
  }
  footer={<Pagination ... />}
>
  <VStack spacing={4}>
    {items.map(item => <Item key={item.id} {...item} />)}
  </VStack>
</ContentCard>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string \| ReactNode` | — | Card heading. Wrap in `<HStack>` for icon + text. |
| `titleSize` | `HeadingLevel` | `2` | Heading size (1–6) |
| `titleClassName` | `string` | — | Extra classes on heading |
| `subtitle` | `string \| ReactNode` | — | Subtext below title |
| `actions` | `ReactNode` | — | Top-right area (buttons, menus). Hidden when `emptyState` is shown. |
| `children` | `ReactNode` | — | Card body content |
| `footer` | `ReactNode` | — | Bottom section (pagination, links) |
| `isLoading` | `boolean` | `false` | Shows `LoadingSpinner` instead of children |
| `emptyState` | `ReactNode` | — | Shown instead of children when truthy. Use `<EmptyState>` component. |
| `padding` | `'none' \| 'sm'` | `'sm'` | Body padding |
| `isPressable` | `boolean` | `false` | Makes card clickable |
| `onPress` | `() => void` | — | Click handler (implies `isPressable`) |
| `isSelected` | `boolean` | `false` | Selected visual state (primary border + bg) |
| `fullWidth` | `boolean` | `false` | Adds `w-full` |
| `className` | `string` | — | Extra classes on root `HeroCard` |

### Usage patterns

| Pattern | Example | Key Props |
|---|---|---|
| Data card with loading | BirthdayCard, ToDoList, TrainingSessionList | `title`, `isLoading`, `emptyState` |
| List item with actions | TodoListItem, CommentsZoneItem | `title`, `actions`, `subtitle`, `footer` |
| Clickable + selectable | TeamSelector | `onPress`, `isPressable`, `isSelected` |
| Static container | VenueCard, BillingInfoCard | `title`, `footer` |
| Form section | BasicInfoSection, ContactSection | `title`, `padding='none'`, `titleClassName` |
| Table wrapper | members/page, matches/page | `padding='none'` |

### Behavior notes

- **Loading**: Single `<HeroCard>` shell with `Show`/`Hide` inside — no layout shift when toggling loading state.
- **Empty state**: When `emptyState` is truthy, it replaces `children` and hides the `actions` area in the header. Callers compose the empty state: `emptyState={isEmpty(data) && <EmptyState ... />}`.
- **Hover**: Applied only when `isPressable` or `onPress` is set, and card is not `isSelected`.
- **Selection**: `isSelected` applies primary border + background. Hover is suppressed.

## Card (low-level escape hatch)

Thin HeroUI wrapper. Use only when ContentCard's structure doesn't fit (e.g. TodoStatsCard with fully custom layout).

```tsx
import {Card} from '@/components';

<Card isPressable onPress={onClick} className="p-4 bg-green-50">
  {/* fully custom content — no header/body/footer structure */}
</Card>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | Card content |
| `className` | `string` | — | Extra classes |
| `isPressable` | `boolean` | `false` | Makes card clickable (adds hover) |
| `onPress` | `() => void` | — | Click handler |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'lg'` | Border radius |
| `shadow` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'sm'` | Shadow level |

## Primitives (components/)

Internal building blocks used by ContentCard. Can also be used with `Card` for semi-custom layouts.

| Component | Key Props | Notes |
|---|---|---|
| `CardHeader` | `className` | Wraps HeroUI CardHeader with twMerge |
| `CardBody` | `padding: 'none' \| 'sm' \| 'md' \| 'lg'` | Default `'sm'` |
| `CardFooter` | `justify: 'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly'` | Default `'between'` |

## Rules

- **Default to ContentCard.** Only use `Card` when you need fully custom content that doesn't fit the header/body/footer structure.
- **Never compose CardHeader/CardBody/CardFooter inside ContentCard** — it already does that internally.
- **`actions` is ReactNode.** Pass composed JSX (`<Button>`, `<HStack>` with buttons), not config objects.
- **`emptyState` is ReactNode.** Compose `<EmptyState>` at the call site with proper translations.
- **Grid layout belongs in the parent.** Use `<GridItem span={2}>` around cards, not `col-span-*` inside card components.

## Known issues

| Issue | Details |
|---|---|
| Dead imports in callers | `ToDoList.tsx` imports unused `EmptyStateTypes`, `emptyStateTypeOptions`. `CommentsZone.tsx` imports unused `EmptyStateTypes`. |

## Types

- `ContentCardProps` — `src/types/components/contentCard.ts`
- `CardProps` — inline in `Card.tsx`