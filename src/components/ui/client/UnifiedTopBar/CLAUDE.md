# UnifiedTopBar Component

## Purpose

Shared top navigation bar used by both **admin** (`AdminTopBar`) and **coach** (`CoachesTopBar`) portals. Renders page title, user profile dropdown, release notes, theme switch, notifications (admin only), portal switching, and a logout flow with progress overlay.

## Current State

| Metric | Value |
|---|---|
| Lines | ~565 |
| Status | Functional, 3 unused import warnings |
| Consumers | `CoachesTopBar.tsx`, `AdminTopBar.tsx` |
| Complexity | **High** — single monolithic component handling layout, user display, logout flow, portal switching, release notes, notifications, and 4 modals |

## Props

```typescript
interface UnifiedTopBarProps {
  variant: UserRoles.ADMIN | UserRoles.COACH;
  sidebarContext?: {
    isCollapsed?: boolean;
    isMobileOpen?: boolean;
    setIsMobileOpen?: (open: boolean) => void;
    isMobile?: boolean;
    toggleSidebar?: () => void;
  };
  pageTitle?: string;
  pageDescription?: string;
  userProfile?: {
    role?: string;
    clubs?: { name?: string };
  };
}
```

## Current Architecture

```
UnifiedTopBar.tsx (565 lines — everything in one file)
├── Hooks: useRouter, useAuth, usePortalAccess
├── State: 6x useState (modals, logout progress, logout error)
├── Computed: releaseNotes via useMemo(getReleaseNotes)
├── Handlers: handleLogout, handleReleaseNotes, handleSwitchToCoach/Admin, handleProfileOpen
├── Display helpers: getUserInitials, getDisplayName, getRoleDisplay
├── Layout helpers: shouldShowPortalSwitch, getSidebarButton, getHeaderClasses, getContentClasses
├── JSX:
│   ├── Header bar (sidebar toggle + page title + actions)
│   ├── Theme switch
│   ├── Release notes button + badge
│   ├── Notifications button + badge (admin only)
│   ├── User dropdown (avatar + name + role)
│   │   ├── Profile header (admin only)
│   │   ├── Profile action
│   │   ├── Portal switch
│   │   ├── Settings (admin only)
│   │   └── Logout
│   ├── UserProfileModal
│   ├── ReleaseNotesModal
│   ├── CoachPortalCategoryDialog (admin only)
│   └── Logout progress overlay (createPortal)
```

## Diagnostics

| Severity | Line | Issue |
|---|---|---|
| Warning | 3 | Unused import `useEffect` |
| Warning | 3 | Unused import `useRef` |
| Warning | 36 | Unused import `ReleaseNote` type |

## Problems

### 1. Monolithic — 565 lines, 10+ responsibilities

The component handles layout, user display, logout flow (with error handling + retry + progress overlay), portal switching, release notes, notifications, modals, and variant-based styling. This makes it hard to test, debug, or modify any single feature.

### 2. Logout flow is over-engineered

The logout handler (lines 97-164) includes:
- 4-step progress bar with artificial delays (`setTimeout`)
- Error categorization (network vs auth)
- Retry mechanism with delayed toast
- Full-screen portal overlay with spinner

A logout is a single `signOut()` + redirect. The progress overlay and artificial steps add complexity without real value.

### 3. Variant branching throughout

`if (variant === UserRoles.ADMIN)` / `else` appears in:
- `getHeaderClasses` — only difference is `z-40` vs `z-30`
- `getContentClasses` — only difference is `h-full` vs `py-3`
- Notification button visibility
- Dropdown items (profile header, settings, divider)
- Avatar styling
- User display text (`user.email` vs `getDisplayName()`)
- Logout button text

Many of these could be config-driven instead of branching.

### 4. Hardcoded Czech strings

~15 hardcoded strings: `'Úspěšně odhlášen. Přesměrovávám...'`, `'Hlavní trenér'`, `'Trenér'`, `'Administrátor'`, `'Dashboard'`, `'Trenérský Portal'`, `'Otevřít menu'`, `'Release Notes'`, `'Notifikace'`, `'Profil'`, `'Nastavení'`, `'Odhlásit'`, `'Odhlásit se'`, `'Přepnout na trenérský portál'`, `'Přepnout na admin portál'`, etc. Should use translations.

### 5. Notifications are a placeholder

`notifications` is hardcoded to `3` (line 82 in original). After cleanup the notification button + badge were removed from the coach variant but the admin variant still renders a non-functional notification bell. This should either be implemented or removed.

### 6. `getReleaseNotes()` returns a 500-line static array

`releaseNotes.ts` is a ~500-line hardcoded array. The `useMemo` in the top bar is fine, but this data should probably live in the database or a markdown file, not an imported TS constant.

### 7. Display helpers are pure functions defined inside the component

`getUserInitials`, `getDisplayName`, `getRoleDisplay` are re-created on every render. They only depend on `user` and `variant`/`userProfile`, so they should be extracted as pure utils.

---

## Proposed Refactoring

### Target File Structure

```
UnifiedTopBar/
├── UnifiedTopBar.tsx              ← Slim orchestrator (~100-120 lines)
├── components/
│   ├── TopBarUserDropdown.tsx     ← User avatar + dropdown menu
│   ├── TopBarActions.tsx          ← Theme switch + release notes + notifications
│   ├── TopBarPageInfo.tsx         ← Page title + description + sidebar toggle
│   └── LogoutOverlay.tsx          ← Portal-rendered logout progress overlay
├── hooks/
│   └── useLogout.ts              ← Logout state machine (progress, error, retry)
├── utils/
│   ├── userDisplayHelpers.ts     ← getUserInitials, getDisplayName, getRoleDisplay
│   └── topBarStyles.ts           ← getHeaderClasses, getContentClasses (variant config)
└── CLAUDE.md
```

### Step 1: Extract user display helpers

**File:** `utils/userDisplayHelpers.ts`

Extract as pure functions:
```typescript
export function getUserInitials(user): string
export function getDisplayName(user): string
export function getRoleDisplay(variant, userProfile): string
```

These are stateless, easily testable, and used in multiple places within the component.

### Step 2: Extract style config

**File:** `utils/topBarStyles.ts`

Replace `getHeaderClasses` / `getContentClasses` branching with a config object:
```typescript
const VARIANT_CONFIG = {
  [UserRoles.ADMIN]: { zIndex: 'z-40', contentClass: 'h-full ...' },
  [UserRoles.COACH]: { zIndex: 'z-30', contentClass: 'py-3 ...' },
};
```

### Step 3: Extract `useLogout` hook

**File:** `hooks/useLogout.ts`

Encapsulates all logout state and logic:
```typescript
export function useLogout() {
  return {
    isLoggingOut: boolean;
    logoutProgress: number;
    logoutError: string | null;
    handleLogout: () => Promise<void>;
    cancelLogout: () => void;
  };
}
```

Keeps the component clean from the multi-step logout flow. The hook owns `isLoggingOut`, `logoutProgress`, `logoutError` state.

### Step 4: Extract `LogoutOverlay` component

**File:** `components/LogoutOverlay.tsx`

The portal-rendered overlay (lines 479-561) becomes a standalone component:
```typescript
interface LogoutOverlayProps {
  isLoggingOut: boolean;
  logoutProgress: number;
  logoutError: string | null;
  onRetry: () => void;
  onCancel: () => void;
}
```

### Step 5: Extract `TopBarUserDropdown`

**File:** `components/TopBarUserDropdown.tsx`

The `<Dropdown>` with all its items (lines 336-457) — the most complex JSX block. Receives callbacks as props.

### Step 6: Extract `TopBarActions`

**File:** `components/TopBarActions.tsx`

Theme switch + release notes button + notification bell. Small component, but keeps the main file focused.

### Step 7: Extract `TopBarPageInfo`

**File:** `components/TopBarPageInfo.tsx`

Sidebar toggle button + page title + description. Already logically separate.

### Step 8: Move hardcoded strings to translations

Add to `src/lib/translations/` (either `common.ts` or a new `topBar.ts`):
```typescript
topBar: {
  logout: { success, error, networkError, authError, retryMessage, loggingOut, ... },
  roles: { coach, headCoach, admin },
  actions: { profile, settings, switchToCoach, switchToAdmin, logout, logoutShort },
  defaults: { adminTitle, coachTitle },
}
```

### Result

After refactoring, `UnifiedTopBar.tsx` becomes a ~100-line orchestrator:
```typescript
export const UnifiedTopBar = ({ variant, sidebarContext, pageTitle, pageDescription, userProfile }) => {
  const { user } = useAuth();
  const logout = useLogout();
  const styles = getTopBarStyles(variant, sidebarContext);

  return (
    <div className={styles.header}>
      <div className={styles.content}>
        <TopBarPageInfo ... />
        <TopBarActions ... />
        <TopBarUserDropdown ... />
      </div>
      <UserProfileModal ... />
      <ReleaseNotesModal ... />
      <CoachPortalCategoryDialog ... />
      <LogoutOverlay {...logout} />
    </div>
  );
};
```

### Priority

| # | Step | Effort | Impact |
|---|---|---|---|
| 1 | Extract `userDisplayHelpers.ts` | Low | Testability, removes 30 lines |
| 2 | Extract `topBarStyles.ts` | Low | Removes branching, ~20 lines |
| 3 | Extract `useLogout` hook | Medium | Biggest complexity reduction (~70 lines) |
| 4 | Extract `LogoutOverlay` component | Low | ~80 lines of JSX moved out |
| 5 | Extract `TopBarUserDropdown` | Medium | ~120 lines of JSX moved out |
| 6 | Extract `TopBarActions` | Low | ~40 lines |
| 7 | Extract `TopBarPageInfo` | Low | ~20 lines |
| 8 | Move strings to translations | Medium | Consistency with project convention |

### Immediate Cleanup (before refactoring)

- Remove unused imports: `useEffect`, `useRef`, `ReleaseNote`
- Decide on notifications: implement or remove the placeholder