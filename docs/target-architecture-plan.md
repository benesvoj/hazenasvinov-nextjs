# 🧱 Target Architecture Plan (Next.js Multi-Portal Project)

## 🎯 Goals
- Stabilize and simplify structure
- Support multi-portal architecture (public, auth, admin, portal)
- Enable gradual migration (no big-bang refactor)
- Prepare for pnpm workspace

---

# 📁 Target Structure

```
src/
  app/
    (public)/
    (auth)/
    (admin)/
    (portal)/

  features/
    auth/
    users/
    billing/
    invoices/
    betting/
    projects/
    settings/

  shared/
    ui/
    lib/
    hooks/
    config/
    types/
```

---

# 🧩 Feature Structure

Each feature is self-contained:

```
features/invoices/
  components/
  api/
  hooks/
  types/
  utils/
  index.ts
```

### Rules
- Feature owns everything related to its domain
- No direct cross-feature imports
- Export only via `index.ts`

---

# 🔗 Shared Layer

```
shared/
  ui/        # design system components
  lib/       # helpers (date, format, etc.)
  hooks/     # generic hooks
  config/    # env, constants
  types/     # global types
```

### Rules
- MUST NOT depend on features
- Can be used anywhere

---

# 🧠 App Layer (Next.js routing)

```
app/
  (admin)/dashboard/page.tsx
  (portal)/page.tsx
```

### Rules
- Only composes features
- No business logic

---

# 📦 Import Rules

## Allowed

```
features/* -> shared/*
app/* -> features/*
```

## Forbidden

```
shared -> features ❌
feature A -> feature B (direct) ❌
```

---

# 🧱 Naming Conventions

| Type        | Convention           | Example              |
|------------|---------------------|----------------------|
| folders     | kebab-case          | `user-profile`       |
| components  | PascalCase          | `UserCard.tsx`       |
| hooks       | camelCase + use     | `useInvoices.ts`     |
| API         | verb-based          | `getInvoices.ts`     |

---

# 🔁 Migration Strategy

## Step 1
- Add `features/` and `shared/`

## Step 2
- Move one feature (e.g. invoices)

## Step 3
- Gradually migrate others

## Step 4
- Delete old folders (`services`, `queries`, etc.)

---

# 📦 pnpm Workspace (future)

```
apps/
  web/
  admin/

packages/
  shared/
  ui/
```

---

# 🧭 Key Principles

- Feature-first architecture
- No shared business logic
- Gradual refactor
- Clear boundaries

---

# ✅ Definition of Done

- No `services/`, `queries/`, `hooks/` at root
- All logic lives inside features
- Shared layer is clean and minimal
