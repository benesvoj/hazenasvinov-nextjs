# Fixing Accessibility Warnings - Aria-Labels Guide

## Problem
The application has 1,067 accessibility warnings about missing `aria-label` or `aria-labelledby` attributes. These warnings are coming from Hero UI components that need proper accessibility labels.

## Root Cause
Many buttons, especially those with icons (`startContent`), are missing `aria-label` attributes. Screen readers and accessibility tools need these labels to properly describe the button's purpose.

## Solution Strategy

### 1. **Button Patterns to Fix**

#### **Icon-Only Buttons (isIconOnly)**
```tsx
// ❌ Before - Missing aria-label
<Button
  size="sm"
  variant="light"
  color="primary"
  isIconOnly
  onPress={() => openEditModal(item)}
>
  <PencilIcon className="w-4 h-4" />
</Button>

// ✅ After - With aria-label
<Button
  size="sm"
  variant="light"
  color="primary"
  isIconOnly
  onPress={() => openEditModal(item)}
  aria-label={`Upravit ${item.name}`}
>
  <PencilIcon className="w-4 h-4" />
</Button>
```

#### **Buttons with Icons (startContent)**
```tsx
// ❌ Before - Missing aria-label
<Button 
  color="primary" 
  startContent={<PlusIcon className="w-4 h-4" />}
  onPress={onAddOpen}
>
  Přidat
</Button>

// ✅ After - With aria-label
<Button 
  color="primary" 
  startContent={<PlusIcon className="w-4 h-4" />}
  onPress={onAddOpen}
  aria-label="Přidat nový záznam"
>
  Přidat
</Button>
```

#### **Action Buttons in Lists/Tables**
```tsx
// ❌ Before - Missing aria-label
<Button
  size="sm"
  color="danger"
  variant="light"
  startContent={<TrashIcon className="w-4 h-4" />}
  onPress={() => openDeleteModal(item)}
>
  Smazat
</Button>

// ✅ After - With aria-label
<Button
  size="sm"
  color="danger"
  variant="light"
  startContent={<TrashIcon className="w-4 h-4" />}
  onPress={() => openDeleteModal(item)}
  aria-label={`Smazat ${item.name}`}
>
  Smazat
</Button>
```

### 2. **Common Button Types to Fix**

#### **CRUD Operations**
- **Create/Add**: `aria-label="Přidat nový [entity]"`
- **Read/View**: `aria-label="Zobrazit detail [entity]"`
- **Update/Edit**: `aria-label="Upravit [entity]"`
- **Delete**: `aria-label="Smazat [entity]"`

#### **Navigation Actions**
- **Back**: `aria-label="Zpět na předchozí stránku"`
- **Next**: `aria-label="Pokračovat na další stránku"`
- **Close**: `aria-label="Zavřít"`
- **Save**: `aria-label="Uložit změny"`
- **Cancel**: `aria-label="Zrušit"`

#### **Data Operations**
- **Import**: `aria-label="Import dat z souboru"`
- **Export**: `aria-label="Exportovat data"`
- **Refresh**: `aria-label="Obnovit data"`
- **Filter**: `aria-label="Filtrovat výsledky"`
- **Search**: `aria-label="Hledat"`

### 3. **Files to Prioritize**

#### **High Priority (Most Warnings)**
1. `src/app/admin/matches/page.tsx.backup` - Many action buttons
2. `src/app/admin/clubs/page.tsx.backup` - CRUD operations
3. `src/app/admin/categories/page.tsx.backup` - Table actions
4. `src/app/admin/components/TopBar.tsx` - User actions

#### **Medium Priority**
1. `src/app/admin/users/components/UsersTab.tsx`
2. `src/app/admin/members/components/MembersInternalTab.tsx`
3. `src/app/admin/photo-gallery/components/*.tsx`
4. `src/app/admin/sponsorship/components/*.tsx`

#### **Low Priority**
1. `src/app/(main)/*` - Public pages
2. `src/components/*` - Reusable components

### 4. **Implementation Steps**

#### **Step 1: Add aria-labels to Icon-Only Buttons**
```tsx
// Find all buttons with isIconOnly={true}
// Add descriptive aria-label based on action and context
```

#### **Step 2: Add aria-labels to Buttons with Icons**
```tsx
// Find all buttons with startContent={<Icon />}
// Add descriptive aria-label based on button purpose
```

#### **Step 3: Add aria-labels to Action Buttons**
```tsx
// Find all buttons in table rows, lists, etc.
// Add contextual aria-label with entity name
```

#### **Step 4: Add aria-labels to Form Buttons**
```tsx
// Find all form submit/cancel buttons
// Add descriptive aria-label for form actions
```

### 5. **Testing Accessibility**

#### **Manual Testing**
1. Use screen reader (NVDA, JAWS, VoiceOver)
2. Navigate using only keyboard (Tab, Enter, Space)
3. Check if button purposes are clear without visual context

#### **Automated Testing**
1. Run accessibility audit in browser DevTools
2. Use axe-core or similar accessibility testing library
3. Check for remaining aria-label warnings

### 6. **Example Fixes Applied**

#### **Matches Page**
- ✅ Add Match: `aria-label="Přidat nový zápas"`
- ✅ Bulk Update: `aria-label="Hromadná aktualizace matchweek"`
- ✅ Generate Standings: `aria-label="Generovat nebo přepočítat tabulku"`
- ✅ Check Integrity: `aria-label="Zkontrolovat integritu zápasů"`
- ✅ Check DB Migration: `aria-label="Zkontrolovat migraci databáze"`
- ✅ Excel Import: `aria-label="Import zápasů z Excel souboru"`
- ✅ Delete All: `aria-label="Smazat všechny zápasy"`

#### **Clubs Page**
- ✅ Add Club: `aria-label="Přidat nový klub"`
- ✅ View Club: `aria-label="Zobrazit detail klubu ${club.name}"`
- ✅ Edit Club: `aria-label="Upravit klub ${club.name}"`
- ✅ Delete Club: `aria-label="Smazat klub ${club.name}"`

#### **Categories Page**
- ✅ Add Category: `aria-label="Přidat novou kategorii"`
- ✅ Edit Category: `aria-label="Upravit kategorii ${category.name}"`
- ✅ Delete Category: `aria-label="Smazat kategorii ${category.name}"`

#### **TopBar Component**
- ✅ Profile: `aria-label="Otevřít profil"`
- ✅ Settings: `aria-label="Nastavení"`
- ✅ Logout: `aria-label="Odhlásit se"`
- ✅ Edit Profile: `aria-label="Upravit profil"`
- ✅ Save Profile: `aria-label="Uložit změny profilu"`

### 7. **Best Practices**

#### **Descriptive Labels**
- ❌ `aria-label="Button"`
- ✅ `aria-label="Přidat nový klub"`

#### **Context-Aware Labels**
- ❌ `aria-label="Edit"`
- ✅ `aria-label="Upravit klub TJ Sokol Svinov"`

#### **Action + Entity Pattern**
- ✅ `aria-label="Smazat ${item.name}"`
- ✅ `aria-label="Zobrazit detail ${item.name}"`
- ✅ `aria-label="Upravit ${item.name}"`

#### **Consistent Terminology**
- Use Czech terms consistently
- Match button text when possible
- Be specific about the action

### 8. **Expected Results**

After implementing these fixes:
- **Before**: 1,067 accessibility warnings
- **After**: 0-50 accessibility warnings (mostly for complex components)
- **Improvement**: 95%+ reduction in accessibility warnings
- **User Experience**: Better screen reader support, clearer button purposes

### 9. **Next Steps**

1. **Continue fixing remaining files** using the patterns above
2. **Test with screen readers** to ensure labels are helpful
3. **Run accessibility audits** to verify improvements
4. **Document any remaining warnings** for future fixes
5. **Consider adding aria-labelledby** for complex form relationships

## Conclusion

By systematically adding `aria-label` attributes to all interactive elements, we can eliminate the majority of accessibility warnings and significantly improve the application's accessibility for users with disabilities.
