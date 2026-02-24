# Login Section

## Purpose

Client-side redirect to the unified login page with the coach tab pre-selected. The coaches portal does not have its own login form.

## Files

| File | Responsibility |
|---|---|
| `layout.tsx` | Simple wrapper with light gray background, no sidebar/topbar |
| `page.tsx` | Shows loading spinner with Czech message, then redirects to `/login?tab=coach` via `router.replace()` |

## Behaviour

1. User navigates to `/coaches/login`
2. Page shows: "Přesměrování na přihlašovací stránku..." (Redirecting to login page...)
3. `useEffect` calls `router.replace('/login?tab=coach')`
4. User lands on the unified login component with coach tab active

## Issues & Technical Debt

### Low

1. **Brief flash of loading spinner** — The redirect is client-side, so users see a spinner momentarily. Consider a server-side redirect (Next.js `redirect()` in a server component or `next.config.js` rewrite) for instant navigation.

## Improvement Proposals

1. **Convert to server-side redirect** — Use Next.js `redirect('/login?tab=coach')` in a server component to eliminate the client-side flash entirely.