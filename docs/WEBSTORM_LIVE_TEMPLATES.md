# WebStorm Live Templates (Same as VS Code Snippets)

## Yes! WebStorm Has the Same Feature

**In WebStorm, they're called "Live Templates"** instead of "snippets".

They work **exactly the same way** - type a shortcut, press Tab, get full code.

---

## How to Set Up in WebStorm

### One-Time Setup (3 minutes):

1. **Open Settings:**
   - Mac: `Cmd + ,` or `WebStorm → Settings`
   - Windows: `Ctrl + Alt + S`

2. **Navigate to:**
   ```
   Editor → Live Templates
   ```

3. **Click the `+` button** (top right)

4. **Select:** "Live Template" (not Template Group)

5. **Fill in the form:**
   - **Abbreviation:** `nxpage`
   - **Description:** "Next.js Server Component with React Query hydration"
   - **Template text:** (see below)
   - **Applicable in:** TypeScript JSX

6. **Click "Define"** → Select "TypeScript JSX"

7. **Click "OK"** to save

---

## WebStorm Template Code

### Next.js Server Page Template

**Abbreviation:** `nxpage`

**Template text:**
```typescript
import {HydrationBoundary} from '@tanstack/react-query';

import {prefetchQuery} from '@/utils/prefetch';
import {fetch$ENTITY$} from '@/queries/$ENTITY_LOWER$/queries';

import {$ENTITY$PageClient} from './$ENTITY$PageClient';

export default async function $ENTITY$AdminPage() {
  const dehydratedState = await prefetchQuery(['$ENTITY_LOWER$'], fetch$ENTITY$);

  return (
    <HydrationBoundary state={dehydratedState}>
      <$ENTITY$PageClient />
    </HydrationBoundary>
  );
}
$END$
```

**Variables to define:**
1. Click "Edit variables" button
2. Add these variables:

| Name | Expression | Default | Skip if defined |
|------|------------|---------|-----------------|
| ENTITY | - | "Entity" | ☐ |
| ENTITY_LOWER | `lowercaseAndDash(ENTITY)` | "entity" | ☐ |
| END | - | - | ☑ |

**Function to use:**
- For `ENTITY_LOWER`: Select `lowercaseAndDash()` from dropdown

---

## Using the Template in WebStorm

### Step-by-Step:

1. **Create a new file:**
   ```
   src/app/admin/committees/page.tsx.backup
   ```

2. **Type the abbreviation:**
   ```
   nxpage
   ```

3. **Press Tab** (or Enter)

4. **It expands to:**
   ```typescript
   import {HydrationBoundary} from '@tanstack/react-query';
   import {prefetchQuery} from '@/utils/prefetch';
   import {fetchEntity} from '@/queries/entity/queries';
   import {EntityPageClient} from './EntityPageClient';

   export default async function EntityAdminPage() {
     const dehydratedState = await prefetchQuery(['entity'], fetchEntity);
     return (
       <HydrationBoundary state={dehydratedState}>
         <EntityPageClient />
       </HydrationBoundary>
     );
   }
   █  // cursor here
   ```

5. **Cursor is at first variable.** Type `Committees`

6. **Press Tab** to move to next variable

7. **All instances update automatically:**
   ```typescript
   import {fetchCommittees} from '@/queries/committees/queries';
   import {CommitteesPageClient} from './CommitteesPageClient';

   export default async function CommitteesAdminPage() {
     const dehydratedState = await prefetchQuery(['committees'], fetchCommittees);
     // ...
   }
   ```

8. **Press Enter** → Done!

---

## Additional WebStorm Templates

### Client Component Template

**Abbreviation:** `nxclient`

**Template text:**
```typescript
'use client';

import {useQuery} from '@tanstack/react-query';

import {fetch$ENTITY$} from '@/queries/$ENTITY_LOWER$/queries';
import {$ENTITY$} from '@/types';

export function $ENTITY$PageClient() {
  const {data: $ENTITY_LOWER$ = [], isLoading, refetch} = useQuery({
    queryKey: ['$ENTITY_LOWER$'],
    queryFn: fetch$ENTITY$,
  });

  return (
    <div>
      {/* Your component here */}
      $END$
    </div>
  );
}
```

**Variables:** Same as above (ENTITY, ENTITY_LOWER)

---

### Query Function Template

**Abbreviation:** `nxquery`

**Template text:**
```typescript
import {createClient} from '@/utils/supabase/client';
import {$ENTITY$} from '@/types';

/**
 * Client-side fetch function for React Query
 * Use with useQuery in client components
 */
export async function fetch$ENTITY$(): Promise<$ENTITY$[]> {
  const supabase = createClient();

  const {data, error} = await supabase
    .from('$TABLE$')
    .select('*')
    .order('created_at', {ascending: false});

  if (error) {
    console.error('Error fetching $ENTITY_LOWER$:', error);
    throw error;
  }

  return data || [];
}
$END$
```

**Variables:**

| Name | Expression | Default |
|------|------------|---------|
| ENTITY | - | "Entity" |
| ENTITY_LOWER | `lowercaseAndDash(ENTITY)` | "entity" |
| TABLE | `lowercaseAndDash(ENTITY)` | "table" |

---

## WebStorm-Specific Features

### Better Than VS Code:

1. **Smarter Variable Functions:**
   ```
   lowercaseAndDash(ENTITY)     → "Entity" becomes "entity"
   capitalize(name)              → "entity" becomes "Entity"
   camelCase(name)               → "my-entity" becomes "myEntity"
   snakeCase(name)               → "MyEntity" becomes "my_entity"
   ```

2. **Context Awareness:**
   - WebStorm knows it's a .tsx file
   - Auto-imports work after template expansion
   - Better TypeScript integration

3. **Template Groups:**
   - Organize templates by category
   - Share across projects
   - Export/import easily

---

## Setting Up Multiple Templates at Once

### WebStorm Template Group:

1. **Create Template Group:**
   - In Live Templates settings
   - Click `+` → "Template Group"
   - Name it: "Next.js Server Components"

2. **Add Templates to Group:**
   - `nxpage` - Server page
   - `nxclient` - Client component
   - `nxquery` - Query function
   - `nxmutation` - Mutation hook

3. **Export to Share:**
   - Right-click group
   - "Export Settings"
   - Save as `.xml` file
   - Share with team!

---

## Quick Setup (Copy-Paste Method)

If you don't want to manually create each template:

### 1. Create XML File:

Save this as `NextJS_Server_Components.xml`:

```xml
<templateSet group="Next.js Server Components">
  <template name="nxpage" value="import {HydrationBoundary} from '@tanstack/react-query';&#10;&#10;import {prefetchQuery} from '@/utils/prefetch';&#10;import {fetch$ENTITY$} from '@/queries/$ENTITY_LOWER$/queries';&#10;&#10;import {$ENTITY$PageClient} from './$ENTITY$PageClient';&#10;&#10;export default async function $ENTITY$AdminPage() {&#10;  const dehydratedState = await prefetchQuery(['$ENTITY_LOWER$'], fetch$ENTITY$);&#10;&#10;  return (&#10;    &lt;HydrationBoundary state={dehydratedState}&gt;&#10;      &lt;$ENTITY$PageClient /&gt;&#10;    &lt;/HydrationBoundary&gt;&#10;  );&#10;}&#10;$END$" description="Next.js Server Component with React Query hydration" toReformat="true" toShortenFQNames="true">
    <variable name="ENTITY" expression="" defaultValue="&quot;Entity&quot;" alwaysStopAt="true" />
    <variable name="ENTITY_LOWER" expression="lowercaseAndDash(ENTITY)" defaultValue="&quot;entity&quot;" alwaysStopAt="false" />
    <context>
      <option name="TypeScript JSX" value="true" />
    </context>
  </template>
</templateSet>
```

### 2. Import in WebStorm:

1. Go to `Settings → Editor → Live Templates`
2. Click gear icon ⚙️ → "Import Live Templates"
3. Select the `.xml` file
4. Click "OK"
5. Done! All templates available.

---

## WebStorm vs VS Code Snippets

| Feature | VS Code | WebStorm |
|---------|---------|----------|
| **Name** | Snippets | Live Templates |
| **Trigger** | Tab | Tab or Enter |
| **Variables** | `$1`, `$2` | `$VAR_NAME$` |
| **Functions** | Limited | Many built-in |
| **Sharing** | JSON file | XML export |
| **Auto-import** | Manual | Automatic ✅ |
| **Context-aware** | Basic | Advanced ✅ |

**WebStorm is actually MORE powerful!** Better variable functions and smarter context awareness.

---

## Practical Example

### Creating Committees Page with WebStorm:

1. **Create file:** `src/app/admin/committees/page.tsx.backup`

2. **Type:** `nxpage` + Tab

3. **WebStorm shows:**
   ```typescript
   import {fetch█Entity} from ...
   ```
   Cursor at `Entity`, waiting for input

4. **Type:** `Committees`

5. **Press Tab** → Moves to next variable (or auto-completes if done)

6. **WebStorm automatically:**
   - Updates `fetchCommittees`
   - Updates `committees` (lowercase)
   - Updates `CommitteesPageClient`
   - Updates `CommitteesAdminPage`
   - **Adds imports** if missing

7. **Done!** Full page in 10 seconds.

---

## Alternative: WebStorm File Templates

WebStorm has another feature that might be even better:

### File Templates (Create Entire Files)

1. **Go to:** `Settings → Editor → File and Code Templates`

2. **Click `+` to add new template**

3. **Name:** "Next.js Server Page"

4. **Extension:** `tsx`

5. **Template:**
```typescript
#set($ENTITY_LOWER = $NAME.substring(0, 1).toLowerCase() + $NAME.substring(1))
import {HydrationBoundary} from '@tanstack/react-query';

import {prefetchQuery} from '@/utils/prefetch';
import {fetch${NAME}} from '@/queries/${ENTITY_LOWER}/queries';

import {${NAME}PageClient} from './${NAME}PageClient';

export default async function ${NAME}AdminPage() {
  const dehydratedState = await prefetchQuery(['${ENTITY_LOWER}'], fetch${NAME});

  return (
    <HydrationBoundary state={dehydratedState}>
      <${NAME}PageClient />
    </HydrationBoundary>
  );
}
```

**Now:**
- Right-click folder
- "New" → "Next.js Server Page"
- Type "Committees"
- **Full file created automatically!**

---

## Recommendation for WebStorm Users

**Use both:**

1. **File Templates** for creating new pages from scratch
2. **Live Templates** for inserting code snippets

**Setup time:** 5 minutes total
**Time saved:** Hours across 30 pages

---

## Demo GIF (How It Looks)

```
Type: nxpage [Tab]
      ↓
import {HydrationBoundary} from '@tanstack/react-query';
import {prefetchQuery} from '@/utils/prefetch';
import {fetch█Entity} from '@/queries/entity/queries';
      ↓
Type: Committees [Tab]
      ↓
import {HydrationBoundary} from '@tanstack/react-query';
import {prefetchQuery} from '@/utils/prefetch';
import {fetchCommittees} from '@/queries/committees/queries';
import {CommitteesPageClient} from './CommitteesPageClient';

export default async function CommitteesAdminPage() {
  const dehydratedState = await prefetchQuery(['committees'], fetchCommittees);
  return (
    <HydrationBoundary state={dehydratedState}>
      <CommitteesPageClient />
    </HydrationBoundary>
  );
}
█
```

**Time: 10 seconds**

---

## Bottom Line

**VS Code:** Uses "Snippets" (JSON file)
**WebStorm:** Uses "Live Templates" (XML or UI)

**Both do the same thing:** Type shortcut → get full code

**WebStorm is actually better:**
- ✅ More powerful variable functions
- ✅ Better auto-imports
- ✅ Smarter context awareness
- ✅ File Templates (whole file creation)

---

## Quick Setup for WebStorm

**Want me to:**
1. ✅ Create the WebStorm XML export file?
2. ✅ Create the File Template for you?
3. ✅ Show you step-by-step with screenshots?

**Or you can:**
- Just copy-paste the template (no setup needed)
- Use WebStorm's refactoring tools (Cmd+T for template insert)
- Copy seasons page as reference for each new page

**Your choice!** Snippets/templates save time, but copy-paste works fine too. 🚀
