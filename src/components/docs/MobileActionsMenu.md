# MobileActionsMenu Component

A reusable mobile-first actions menu component that displays a hamburger menu icon on mobile devices and opens a modal with a list of available actions.

## Features

- **Mobile-First Design**: Automatically hidden on desktop (lg breakpoint and above)
- **Flexible Actions**: Support for various action types with icons, colors, and descriptions
- **Responsive Modal**: Mobile-optimized modal with proper touch targets
- **Customizable**: Configurable trigger button, colors, variants, and sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Usage

### Basic Usage

```tsx
import MobileActionsMenu, { ActionItem } from '@/components/MobileActionsMenu';

const actions: ActionItem[] = [
  {
    key: 'add',
    label: 'Přidat',
    description: 'Přidat nový záznam',
    color: 'primary',
    icon: <PlusIcon className="w-4 h-4" />,
    onClick: () => console.log('Add clicked')
  },
  {
    key: 'edit',
    label: 'Upravit',
    description: 'Upravit existující záznam',
    color: 'warning',
    icon: <PencilIcon className="w-4 h-4" />,
    onClick: () => console.log('Edit clicked')
  }
];

<MobileActionsMenu
  actions={actions}
  title="Dostupné akce"
  description="Vyberte akci, kterou chcete provést"
  triggerLabel="Akce"
/>
```

### Advanced Usage

```tsx
<MobileActionsMenu
  actions={actions}
  title="Správa uživatelů"
  description="Vyberte akci pro správu uživatelů"
  triggerLabel="Správa"
  triggerColor="secondary"
  triggerVariant="bordered"
  triggerSize="md"
  fullWidth={true}
  showCloseButton={false}
  closeOnAction={true}
  className="custom-class"
/>
```

## Props

### MobileActionsMenuProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `actions` | `ActionItem[]` | **required** | Array of action items to display |
| `title` | `string` | `"Dostupné akce"` | Modal title |
| `description` | `string` | `"Vyberte akci, kterou chcete provést"` | Modal description |
| `triggerLabel` | `string` | `"Akce"` | Button label text |
| `triggerIcon` | `React.ReactNode` | `<Bars3Icon />` | Button icon |
| `triggerColor` | `ButtonColor` | `"primary"` | Button color |
| `triggerVariant` | `ButtonVariant` | `"light"` | Button variant |
| `triggerSize` | `ButtonSize` | `"sm"` | Button size |
| `className` | `string` | `""` | Additional CSS classes |
| `showCloseButton` | `boolean` | `true` | Show close button in header |
| `closeOnAction` | `boolean` | `true` | Close modal after action click |
| `fullWidth` | `boolean` | `false` | Make trigger button full width |
| `showOnDesktop` | `boolean` | `false` | Show component on desktop too |

### ActionItem

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | ✅ | Unique identifier for the action |
| `label` | `string` | ✅ | Action display text |
| `icon` | `React.ReactNode` | ❌ | Icon to display before label |
| `color` | `ButtonColor` | ❌ | Action button color |
| `variant` | `ButtonVariant` | ❌ | Action button variant |
| `size` | `ButtonSize` | ❌ | Action button size |
| `isDisabled` | `boolean` | ❌ | Whether action is disabled |
| `onClick` | `() => void` | ✅ | Function to call when clicked |
| `description` | `string` | ❌ | Additional description text |

## Examples

### Page-Level Actions

```tsx
// For main page actions
<MobileActionsMenu
  actions={[
    {
      key: 'add',
      label: 'Přidat nový',
      description: 'Vytvořit nový záznam',
      color: 'primary',
      icon: <PlusIcon className="w-4 h-4" />,
      onClick: handleAdd
    },
    {
      key: 'import',
      label: 'Import',
      description: 'Importovat data z Excelu',
      color: 'secondary',
      icon: <DocumentArrowUpIcon className="w-4 h-4" />,
      onClick: handleImport
    }
  ]}
  title="Hlavní akce"
  triggerLabel="Akce stránky"
  triggerColor="primary"
  fullWidth={true}
/>
```

### Item-Level Actions

```tsx
// For individual item actions
<MobileActionsMenu
  actions={[
    {
      key: 'view',
      label: 'Zobrazit',
      description: 'Zobrazit detaily',
      color: 'primary',
      icon: <EyeIcon className="w-4 h-4" />,
      onClick: () => handleView(item)
    },
    {
      key: 'edit',
      label: 'Upravit',
      description: 'Upravit záznam',
      color: 'warning',
      icon: <PencilIcon className="w-4 h-4" />,
      onClick: () => handleEdit(item)
    },
    {
      key: 'delete',
      label: 'Smazat',
      description: 'Trvale smazat záznam',
      color: 'danger',
      icon: <TrashIcon className="w-4 h-4" />,
      onClick: () => handleDelete(item)
    }
  ]}
  title={`Akce pro ${item.name}`}
  triggerLabel="Akce"
  triggerColor="secondary"
  triggerSize="sm"
/>
```

### Category-Level Actions

```tsx
// For category-specific actions
<MobileActionsMenu
  actions={[
    {
      key: 'add-to-category',
      label: 'Přidat do kategorie',
      description: 'Přidat nový záznam do této kategorie',
      color: 'primary',
      icon: <PlusIcon className="w-4 h-4" />,
      onClick: () => handleAddToCategory(category.id)
    },
    {
      key: 'manage-category',
      label: 'Spravovat kategorii',
      description: 'Upravit nastavení kategorie',
      color: 'secondary',
      icon: <CogIcon className="w-4 h-4" />,
      onClick: () => handleManageCategory(category.id)
    }
  ]}
  title={`Akce pro ${category.name}`}
  description="Vyberte akci, kterou chcete provést s touto kategorií"
  triggerLabel="Akce kategorie"
  triggerColor="secondary"
  fullWidth={true}
/>
```

## Styling

The component uses Tailwind CSS classes and can be customized with:

- `className` prop for additional CSS classes
- `fullWidth` prop for full-width trigger button
- `triggerColor`, `triggerVariant`, `triggerSize` for button styling
- Modal styling through `classNames` prop (if needed)

## Responsive Behavior

- **Mobile (< 1024px)**: Component is visible and functional
- **Desktop (≥ 1024px)**: Component is hidden by default
- **Override**: Use `showOnDesktop={true}` to show on all screen sizes

## Best Practices

1. **Use descriptive labels**: Make action labels clear and actionable
2. **Provide descriptions**: Add helpful descriptions for complex actions
3. **Group related actions**: Organize actions logically
4. **Use appropriate colors**: Follow color conventions (danger for delete, warning for edit, etc.)
5. **Keep actions focused**: Don't overload with too many actions
6. **Test on mobile**: Ensure touch targets are appropriate

## Accessibility

- Proper ARIA labels for screen readers
- Keyboard navigation support
- Focus management in modal
- Semantic HTML structure
- Color contrast compliance
