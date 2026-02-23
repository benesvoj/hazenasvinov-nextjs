# Club Config — Refactor Proposal

Reference implementation: `src/app/coaches/profile/components/CoachCardEditor.tsx`
Applies to: `ClubConfigCard`, `useFetchClubConfig`, `useClubConfig`, API route `[id]/route.ts`

---

## Issues Found

### 1. API route uses `PUT` instead of `PATCH`

**File:** `src/app/api/club-config/[id]/route.ts`

The route handler exports `PUT`. The `createCRUDHook` factory (used by all other entities) sends `PATCH` for updates. This inconsistency means `ClubConfigCard` cannot adopt the factory pattern without breaking — and if it ever tries to, the same "Unexpected end of JSON input" error that occurred on coach cards will appear.

**Fix:** Rename `PUT` → `PATCH` in the route handler (same fix applied to coach cards).

---

### 2. `useClubConfig` — broken `loading` initial state

**File:** `src/hooks/entities/club-config/state/useClubConfig.ts`

```ts
const [loading, setLoading] = useState(true);  // ← always starts as true
```

`loading` is initialised to `true` even though no fetch is in progress. This means any consumer will briefly show a loading state before `updateClubConfig` is ever called.

**Fix:** Initialise to `false`.

---

### 3. `useClubConfig` — does not use the factory pattern

**File:** `src/hooks/entities/club-config/state/useClubConfig.ts`

All other entity hooks (coach cards, blog, categories, etc.) use `createCRUDHook`. `useClubConfig` is a hand-rolled hook with raw `fetch`, no type safety on the return, hardcoded English toast messages, and no `create`/`delete` coverage.

**Fix:** Rewrite using `createCRUDHook` factory, matching the coach card pattern:

```ts
// Target shape (mirroring useCoachCard.ts)
export function useClubConfig() {
  const {loading, error, update} = createCRUDHook<ClubConfig, ClubConfigInsert>({
    baseEndpoint: API_ROUTES.clubConfig.root,
    byIdEndpoint: (id) => API_ROUTES.clubConfig.byId(id),
    entityName: ENTITY.singular,
    messages: {
      updateSuccess: translations.clubConfig.responseMessages.updateSuccess,
      updateError:   translations.clubConfig.responseMessages.updateError,
      // create/delete not needed — singleton record
      createSuccess: '',
      createError:   '',
      deleteSuccess: '',
      deleteError:   '',
    },
  })();

  return { loading, error, updateClubConfig: update };
}
```

---

### 4. `useFetchClubConfig` — hardcoded English error strings

**File:** `src/hooks/entities/club-config/data/useFetchClubConfig.ts`

```ts
setError('Failed to fetch club configuration');
showToast.danger('Failed to fetch club configuration');
```

Error messages are hardcoded in English. Every other entity hook uses `translations.*` keys.

**Fix:** Add `fetchError` key to `clubConfigTranslations` and use it here:

```ts
const message = translations.clubConfig.toasts.fetchError;
setError(message);
showToast.danger(message);
```

---

### 5. `useFetchClubConfig` — does not check `response.ok`

**File:** `src/hooks/entities/club-config/data/useFetchClubConfig.ts`

```ts
const res = await fetch(API_ROUTES.clubConfig.root);
const response = await res.json();
setData(response.data || null);  // ← no check for error status
```

A non-200 response (e.g. 500) will silently set `data` to `null` with no error state or toast. Compare to `useFetchCoachCard` which checks `response.ok` first.

**Fix:** Mirror the `useFetchCoachCard` pattern:

```ts
if (!res.ok) {
  const json = await res.json().catch(() => ({}));
  const message = json?.error ?? translations.clubConfig.toasts.fetchError;
  setError(message);
  showToast.danger(message);
  return;
}
const json = await res.json();
setData(json.data ?? null);
```

---

### 6. `ClubConfigCard` — file uploads use `alert()` for errors

**File:** `src/app/admin/club-config/components/ClubConfigCard.tsx`

```ts
alert(`Chyba při nahrávání loga: ${result.error}`);
```

Uses browser `alert()` instead of `showToast.danger()`. Breaks UX consistency across the entire app.

**Fix:** Replace all `alert(...)` calls with `showToast.danger(...)`.

---

### 7. `ClubConfigCard` — form reset is duplicated

**File:** `src/app/admin/club-config/components/ClubConfigCard.tsx`

The form initialisation block:
```ts
setFormData({
  club_name: clubConfig.club_name || '',
  club_logo_path: clubConfig.club_logo_path || '',
  ...
})
```
is copy-pasted identically in both `useEffect` (on load) and `handleCancel`.

**Fix:** Extract into a `mapConfigToForm(config: ClubConfig)` helper function called in both places.

---

### 8. `ClubConfigCard` — no view/edit pattern alignment with `CoachCardEditor`

**File:** `src/app/admin/club-config/components/ClubConfigCard.tsx`

`ClubConfigCard` implements its own `isEditing` toggle with separate view/edit JSX branches for every field (duplicating every label and value). `CoachCardEditor` always renders inputs — fields are simply disabled when not in an editing-equivalent state.

For a large form like club config, the dual-branch approach causes the component to be ~400 lines for ~15 fields. The `CoachCardEditor` approach (always-rendered form, disabled when loading) is cleaner.

However, the view-mode display (showing current saved values) is a valid UX choice for an admin settings page. A middle ground is:

**Fix:** Keep the view/edit toggle but extract a `useClubConfigForm` hook (or helper) that owns `formData`, `reset()`, and `isDirty` state, keeping the JSX component thin.

---

### 9. Translations — `clubConfig.ts` is almost empty

**File:** `src/lib/translations/clubConfig.ts`

Current state:
```ts
export const clubConfigTranslations = {
  ariaLabel: 'Konfigurace klubu',
  tabTitles: {
    clubConfig: 'Konfigurace klubu',
    clubPages: 'Stránky klubu',
  },
}
```

All UI strings in `ClubConfigCard` are hardcoded inline (Czech, but not translatable/maintainable). Every other entity has a full translation object.

**Fix:** Expand to match the coach card translations structure:

```ts
export const clubConfigTranslations = {
  ariaLabel: 'Konfigurace klubu',
  tabTitles: { ... },
  editor: {
    title: 'Konfigurace klubu',
    subtitle: 'Správa základních informací a nastavení klubu',
    editButton: 'Upravit konfiguraci',
    saveButton: 'Uložit změny',
    cancelButton: 'Zrušit',
    sections: {
      basic: 'Základní informace',
      hero: 'Hlavní stránka (Hero)',
      contact: 'Kontaktní informace',
      social: 'Web a sociální sítě',
    },
    fields: { clubName, foundedYear, description, heroTitle, ... },
    placeholders: { ... },
    upload: {
      logo: 'Nahrávání loga...',
      hero: 'Nahrávání hero obrázku...',
    },
  },
  toasts: {
    fetchError: 'Nepodařilo se načíst konfiguraci klubu',
  },
  responseMessages: {
    updateSuccess: 'Konfigurace klubu byla uložena',
    updateError: 'Nepodařilo se uložit konfiguraci klubu',
  },
  validation: {
    clubNameRequired: 'Název klubu je povinný',
  },
}
```

---

### 10. `ClubConfigCard` — missing `'use client'` directive

**File:** `src/app/admin/club-config/components/ClubConfigCard.tsx`

The component uses `useState`, `useEffect` and HeroUI components (which use `createContext` internally), but has no `'use client'` directive. This works today only because `page.tsx` already has `'use client'`, making the whole tree client-side. If `page.tsx` ever becomes a Server Component, this will silently break.

**Fix:** Add `'use client'` at the top of `ClubConfigCard.tsx`.

---

## Summary — Priority Order

| # | Issue | Effort | Impact |
|---|-------|--------|--------|
| 1 | `PUT` → `PATCH` in API route | XS | Blocks factory adoption |
| 2 | `loading` initial state fix | XS | Bug |
| 6 | Replace `alert()` with `showToast` | XS | UX consistency |
| 10 | Add `'use client'` | XS | Correctness |
| 4 | Fix English error strings in fetch hook | S | i18n |
| 5 | Check `response.ok` in fetch hook | S | Bug (silent failures) |
| 9 | Expand translations | M | Maintainability |
| 3 | Rewrite `useClubConfig` with factory | M | Consistency |
| 7 | Extract `mapConfigToForm` helper | S | DRY |
| 8 | Extract `useClubConfigForm` logic hook | M | Separation of concerns |