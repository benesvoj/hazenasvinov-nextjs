# UnifiedTopBar Component

## Purpose

Shared top navigation bar used by both **admin** (`AdminTopBar`) and **coach** (`CoachesTopBar`) portals. Renders page title, user profile dropdown, release notes, theme switch, portal switching, and a logout flow with progress overlay.

## Current State

| Metric | Value |
|---|---|
| Main file | ~159 lines |
| Total files | 10 (orchestrator + 4 components + 1 hook + 2 utils + 2 barrels) |
| Status | Clean — `tsc` and `eslint` pass with zero errors/warnings |
| Consumers | `CoachesTopBar.tsx`, `AdminTopBar.tsx` |

## Architecture

```
UnifiedTopBar/
├── UnifiedTopBar.tsx              ← Slim orchestrator (~159 lines)
├── components/
│   ├── index.ts                   ← Barrel export
│   ├── TopBarPageInfo.tsx         ← Sidebar toggle + page title/description (~69 lines)
│   ├── TopBarActions.tsx          ← Theme switch + release notes button (~47 lines)
│   ├── TopBarUserDropdown.tsx     ← Avatar + dropdown menu (~174 lines)
│   └── LogoutOverlay.tsx          ← Portal-rendered logout progress overlay (~107 lines)
├── hooks/
│   └── useLogout.ts               ← Logout state machine (~111 lines)
├── utils/
│   ├── index.ts                   ← Barrel export
│   ├── userDisplayHelpers.ts      ← getUserInitials, getDisplayName, getRoleDisplay (~54 lines)
│   └── topBarStyles.ts            ← VARIANT_CONFIG + getHeaderClasses, getContentClasses (~28 lines)
└── CLAUDE.md
```

## Exported Types

`UnifiedTopBar.tsx` exports shared types used by subcomponents:

```typescript
export type variantType = UserRoles.ADMIN | UserRoles.COACH;
export type userProfileType = { role?: string; clubs?: { name?: string }[] };
export type sidebarContextType = {
  isCollapsed?: boolean;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  isMobile?: boolean;
  toggleSidebar?: () => void;
};
```

## Props

```typescript
interface UnifiedTopBarProps {
  variant: variantType;
  sidebarContext?: sidebarContextType;
  pageTitle?: string;
  pageDescription?: string;
  userProfile?: userProfileType;
}
```

## Component Responsibilities

| File | Responsibility |
|---|---|
| `UnifiedTopBar.tsx` | Orchestrator — hooks, state, handlers, composes subcomponents + modals |
| `TopBarPageInfo.tsx` | Sidebar toggle button (mobile only) + page title + description |
| `TopBarActions.tsx` | `ThemeSwitch` + release notes button with badge |
| `TopBarUserDropdown.tsx` | User avatar + dropdown menu (profile, portal switch, settings, logout) |
| `LogoutOverlay.tsx` | Full-screen portal overlay with progress bar, error state, retry/cancel |
| `useLogout.ts` | Logout state machine: progress steps, error handling, retry, cancel |
| `userDisplayHelpers.ts` | Pure functions: `getUserInitials`, `getDisplayName`, `getRoleDisplay` |
| `topBarStyles.ts` | Config-driven variant styling: `VARIANT_CONFIG`, `getHeaderClasses`, `getContentClasses` |

## Data Flow

```
UnifiedTopBar (orchestrator)
├── useAuth() → user
├── usePortalAccess() → hasCoachAccess, hasAdminAccess
├── useLogout() → isLoggingOut, logoutProgress, logoutError, handleLogout, cancelLogout
├── useMemo → releaseNotes (from getReleaseNotes())
├── useState × 3 → showReleaseNotes, showProfileDialog, showCoachPortalDialog
│
├─→ TopBarPageInfo ← variant, sidebarContext, pageTitle, pageDescription
├─→ TopBarActions ← releaseNotes, variant, handleReleaseNotes
├─→ TopBarUserDropdown ← variant, user, userProfile, shouldShowPortalSwitch, handlers, isLoggingOut
├─→ UserProfileModal ← showProfileDialog, setShowProfileDialog, user
├─→ ReleaseNotesModal ← showReleaseNotes, setShowReleaseNotes
├─→ CoachPortalCategoryDialog ← isOpen, onClose, onConfirm (admin only)
└─→ LogoutOverlay ← isLoggingOut, logoutProgress, logoutError, onRetry, onCancel
```

## Remaining Issues

### 1. `getReleaseNotes()` returns a ~500-line static array

`releaseNotes.ts` is a hardcoded TS constant. Should eventually live in the database or markdown files.

### 2. Notification bell removed

The admin notification bell (previously hardcoded to `3`) was removed during refactoring. If notifications are needed in the future, add a new `TopBarNotifications` component.