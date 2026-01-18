# VS Code Snippets - What Are They?

## Simple Explanation

**VS Code snippets are keyboard shortcuts** that write code for you automatically.

Think of them as **templates** that you trigger by typing a short keyword.

---

## Real-World Example

### Without Snippet:
You type this manually every time:
```typescript
import {HydrationBoundary} from '@tanstack/react-query';
import {prefetchQuery} from '@/utils/prefetch';
import {fetchSeasons} from '@/queries/seasons/queries';
import {SeasonsPageClient} from './SeasonsPageClient';

export default async function SeasonsAdminPage() {
  const dehydratedState = await prefetchQuery(['seasons'], fetchSeasons);
  return (
    <HydrationBoundary state={dehydratedState}>
      <SeasonsPageClient />
    </HydrationBoundary>
  );
}
```

**Time:** 2-3 minutes of typing
**Errors:** Typos, missing imports, wrong structure

### With Snippet:
1. Type: `nxpage` + press Tab
2. Type: `Seasons` (it fills in the blanks)
3. Done!

**Time:** 10 seconds
**Errors:** None (template is correct)

---

## How It Works

### Step-by-Step:

1. **You type the trigger word:**
   ```
   nxpage█
   ```

2. **Press Tab** → VS Code expands it to full code:
   ```typescript
   import {HydrationBoundary} from '@tanstack/react-query';
   import {prefetchQuery} from '@/utils/prefetch';
   import {fetchEntity} from '@/queries/entity/queries';  // ← cursor here
   import {EntityPageClient} from './EntityPageClient';

   export default async function EntityPage() {
     const dehydratedState = await prefetchQuery(['entity'], fetchEntity);
     return (
       <HydrationBoundary state={dehydratedState}>
         <EntityPageClient />
       </HydrationBoundary>
     );
   }
   ```

3. **Type the entity name** (e.g., "Seasons"):
   - It automatically replaces `Entity` with `Seasons`
   - It automatically replaces `entity` with `seasons`
   - All instances update simultaneously!

4. **Press Tab** to move to next placeholder, repeat

---

## Creating the Snippet

### One-Time Setup (2 minutes):

1. **Open VS Code Command Palette:**
   - Mac: `Cmd + Shift + P`
   - Windows: `Ctrl + Shift + P`

2. **Type:** `snippets`

3. **Select:** "Configure User Snippets" or "Preferences: Configure Snippets"

4. **Select:** "typescriptreact.json" (for .tsx files)

5. **Paste this code:**

```json
{
  "Next.js Server Page with React Query": {
    "prefix": "nxpage",
    "description": "Create a Next.js Server Component page with React Query hydration",
    "body": [
      "import {HydrationBoundary} from '@tanstack/react-query';",
      "",
      "import {prefetchQuery} from '@/utils/prefetch';",
      "import {fetch${1:Entity}} from '@/queries/${2:entity}/queries';",
      "",
      "import {${1:Entity}PageClient} from './${1:Entity}PageClient';",
      "",
      "export default async function ${1:Entity}AdminPage() {",
      "  const dehydratedState = await prefetchQuery(['${2:entity}'], fetch${1:Entity});",
      "",
      "  return (",
      "    <HydrationBoundary state={dehydratedState}>",
      "      <${1:Entity}PageClient />",
      "    </HydrationBoundary>",
      "  );",
      "}"
    ]
  }
}
```

6. **Save the file**

7. **Done!** Now whenever you type `nxpage` + Tab, it creates the full page.

---

## Using the Snippet

### Example: Create Committees Page

1. Create file: `src/app/admin/committees/page.tsx.backup`

2. Type: `nxpage` + Tab

3. It shows:
   ```typescript
   import {fetch█Entity} from ...
   ```

4. Type: `Committees`

5. Press Tab, it shows:
   ```typescript
   import {fetchCommittees} from '@/queries/█entity/queries';
   ```

6. Type: `committees`

7. Press Tab → Done! Full page created.

---

## What Are the `${1:Entity}` Things?

These are **placeholders**:

- `${1:Entity}` = First placeholder (type once, updates everywhere)
- `${2:entity}` = Second placeholder (lowercase version)
- `${3:table}` = Third placeholder (if needed)

**Magic:** When you type `Seasons` in placeholder 1, ALL instances of `${1:Entity}` update to `Seasons` automatically!

---

## Benefits

### Without Snippets:
- Copy-paste old code
- Find/replace entity names
- Update imports manually
- Fix typos
- 2-3 minutes per file

### With Snippets:
- Type `nxpage` + Tab
- Fill in entity name
- Everything perfect
- 10 seconds per file

**Result:** 12-18x faster! ⚡

---

## More Snippets You Can Create

### Client Component Snippet:
```json
{
  "Entity Page Client": {
    "prefix": "nxclient",
    "body": [
      "'use client';",
      "",
      "import {useQuery} from '@tanstack/react-query';",
      "import {fetch${1:Entity}} from '@/queries/${2:entity}/queries';",
      "",
      "export function ${1:Entity}PageClient() {",
      "  const {data: ${2:entity} = []} = useQuery({",
      "    queryKey: ['${2:entity}'],",
      "    queryFn: fetch${1:Entity},",
      "  });",
      "",
      "  return (",
      "    <div>",
      "      {/* Your component here */}",
      "    </div>",
      "  );",
      "}"
    ]
  }
}
```

### Mutation Hook Snippet:
```json
{
  "Entity Mutations": {
    "prefix": "nxmutations",
    "body": [
      "import {useMutation, useQueryClient} from '@tanstack/react-query';",
      "import {showToast} from '@/components';",
      "",
      "export function use${1:Entity}Mutations() {",
      "  const queryClient = useQueryClient();",
      "",
      "  const create = useMutation({",
      "    mutationFn: async (data) => {",
      "      // API call here",
      "    },",
      "    onSuccess: () => {",
      "      queryClient.invalidateQueries({queryKey: ['${2:entity}']});",
      "      showToast.success('Created!');",
      "    },",
      "  });",
      "",
      "  return {create};",
      "}"
    ]
  }
}
```

---

## Is This Worth It?

### For You Specifically:

You need to create **30+ similar pages**.

**Without snippet:**
- 30 pages × 3 minutes = 90 minutes
- Risk of typos/errors

**With snippet:**
- Snippet setup: 5 minutes (one time)
- 30 pages × 10 seconds = 5 minutes
- No errors (template is correct)

**Time saved: 80 minutes!** ⏱️

---

## Alternative: Just Copy-Paste

If you don't want to set up snippets, you can:

1. **Save the template** in `docs/TEMPLATE_SERVER_PAGE.tsx`

2. **Copy-paste** when needed

3. **Find/replace** the entity names

**This works too!** Snippets are just slightly faster.

---

## Bottom Line

**VS Code snippets are:**
- Keyboard shortcuts for code templates
- Type short word → get full code
- Save time on repetitive code
- Completely optional (can copy-paste instead)

**For your 30-page migration:**
- Snippets = nice to have
- Not required
- But saves ~1 hour of typing

**Want me to create the snippet files for you?** Or prefer copy-paste templates?
