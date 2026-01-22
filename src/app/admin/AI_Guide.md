# AI Guide for Project Refactoring

## 1. Context
- **Project:** Sports admin dashboard (React + TypeScript, Supabase, SQL)
- **Goal:** Standardize UI and data logic using unified components and hooks.

## 2. Architectural Patterns & Requirements

### 2.1 Modals
- **Component:** `UnifiedModal`
- **Hook:** `useModals`
- **Pattern:** All modal dialogs must use `UnifiedModal` for consistency. Modal state and logic should be managed via `useModals`.

### 2.2 Tables
- **Component:** `UnifiedTable`
- **Pattern:** All data tables must use `UnifiedTable` for rendering, sorting, and pagination.

### 2.3 UI Components
- **Library:** `HeroUi`
- **Pattern:** All UI elements (buttons, inputs, alerts, etc.) must use `HeroUi` components for a consistent look and feel.

### 2.4 Data Fetching & CRUD
- **Hooks:** Factory hooks (e.g., `useMatchQueries`, `useMatchMutations`)
- **Pattern:** All data fetching and mutations must use factory hooks for type safety and reusability.

### 2.5 Forms
- **Pattern:** Use factory hooks for form state and validation. Avoid manual state management.

## 3. Refactoring Tasks

1. Replace all modal implementations with `UnifiedModal` and manage state via `useModals`.
2. Refactor all tables to use `UnifiedTable`.
3. Replace all UI elements with `HeroUi` components.
4. Move all data fetching and mutations to factory hooks.
5. Refactor forms to use factory hooks for state and validation.

## 4. Output Format

- For each file/component:
    - List which patterns/components/hooks to apply.
    - Provide before/after code snippets if needed.
    - Reference related files for shared logic.

## 5. Constraints

- Do not change business logic unless required for refactoring.
- Maintain or improve type safety.
- Ensure all UI/UX remains consistent with `HeroUi`.

---

**Example prompt for Claude:**

> Refactor `src/app/admin/matches/page.tsx` to use `UnifiedModal`, `UnifiedTable`, `useModals`, `HeroUi` components, and factory hooks for all data operations and forms. For each section, specify which unified component or hook to use, and provide before/after code snippets. Do not change business logic.
