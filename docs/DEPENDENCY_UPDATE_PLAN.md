# Dependency Update Plan - January 2026

## Strategy
Update in phases: Minor updates first (safer), then major updates (riskier)

---

## Phase 1: Minor Updates (LOW RISK)

### UI Components (HeroUI) - Minor Bumps
```bash
npm install \
  @heroui/badge@^2.2.18 \
  @heroui/button@^2.2.29 \
  @heroui/card@^2.2.27 \
  @heroui/checkbox@^2.3.29 \
  @heroui/image@^2.2.18 \
  @heroui/input@^2.4.30 \
  @heroui/listbox@^2.3.28 \
  @heroui/modal@^2.2.26 \
  @heroui/react@^2.8.7 \
  @heroui/skeleton@^2.2.18 \
  @heroui/spacer@^2.2.22 \
  @heroui/spinner@^2.2.26 \
  @heroui/system@^2.4.25 \
  @heroui/table@^2.2.29 \
  @heroui/tabs@^2.2.26 \
  @heroui/theme@^2.4.25 \
  @heroui/tooltip@^2.2.26 \
  @heroui/toast@^2.0.19
```

### Supabase - Minor Bumps
```bash
npm install \
  @supabase/ssr@^0.8.0 \
  @supabase/supabase-js@^2.90.1 \
  supabase@^2.72.7
```

### Tooling - Minor Bumps
```bash
npm install -D \
  @tailwindcss/postcss@^4.1.18 \
  @tailwindcss/typography@^0.5.19 \
  tailwindcss@^4.1.18 \
  prettier@^3.8.0 \
  lint-staged@^16.2.7 \
  tsx@^4.21.0
```

### React Query
```bash
npm install \
  @tanstack/react-query@^5.90.18 \
  @tanstack/react-query-devtools@^5.91.2
```

### Utilities
```bash
npm install \
  @headlessui/react@^2.2.9 \
  framer-motion@^12.26.2 \
  lucide-react@^0.562.0 \
  dompurify@^3.3.1 \
  jsonwebtoken@^9.0.3 \
  papaparse@^5.5.3 \
  dotenv@^17.2.3
```

**Estimated Time:** 15-20 minutes
**Risk:** LOW (patch/minor updates)

---

## Phase 2: Major Updates (BREAKING CHANGES)

### Critical: Next.js 16.1
```bash
npm install next@^16.1.2 eslint-config-next@^16.1.2
```

**Breaking Changes:**
- Updated build system
- May fix the current build error!
- Check: https://github.com/vercel/next.js/releases

### Critical: React Types (18 → 19)
```bash
npm install -D @types/react@^19 @types/react-dom@^19
```

**Breaking Changes:**
- Many type definitions changed
- `ref` handling updated
- Form types updated

**Action Required:**
- Fix type errors after update
- May need to update component prop types

### Critical: Node Types (20 → 25)
```bash
npm install -D @types/node@^25
```

**Breaking Changes:**
- API types updated
- May affect server-side code

### Critical: Vitest 4
```bash
npm install -D vitest@^4.0.17 @vitest/coverage-v8@^4.0.17
```

**Breaking Changes:**
- Config format changed
- May need to update `vitest.config.ts`
- Check migration guide: https://vitest.dev/guide/migration.html

### Critical: Zod 4
```bash
npm install zod@^4.3.5
```

**Breaking Changes:**
- Schema API changes
- Validation behavior changes
- Check all schema files in `src/types/entities/*/schema/*.ts`

**Action Required:**
- Review all Zod schemas (50+ files)
- Test validation logic
- Update error handling

### Dev Tools
```bash
npm install -D \
  eslint@^9.39.2 \
  @eslint/eslintrc@^3.3.3 \
  @eslint/js@^9.39.2 \
  @vitejs/plugin-react@^5.1.2 \
  vite@^7.3.1 \
  msw@^2.12.7 \
  jsdom@^27.4.0
```

**Estimated Time:** 2-4 hours (including testing & fixes)
**Risk:** HIGH (multiple breaking changes)

---

## Phase 3: Testing & Verification

### After Each Phase
```bash
# 1. Check for peer dependency warnings
npm list

# 2. Run TypeScript check
npx tsc --noEmit

# 3. Run tests
npm test

# 4. Try to build
npm run build

# 5. Test dev mode
npm run dev
# Manual testing in browser
```

### Specific Test Areas
- [ ] Forms still work
- [ ] Modals open/close correctly
- [ ] Data fetching works
- [ ] Authentication flows
- [ ] Admin pages load
- [ ] Coach pages load
- [ ] Betting page works

---

## Rollback Plan

If something breaks:

```bash
# Quick rollback
cp package.json.backup package.json
cp package-lock.json.backup package-lock.json
rm -rf node_modules
npm install

# Or use git
git checkout package.json package-lock.json
npm install
```

---

## Known Issues to Watch For

### Zod 4 Breaking Changes
- `.refine()` now throws instead of returns
- `.transform()` async behavior changed
- Check all custom validations

### Vitest 4 Breaking Changes
- `vi.mock()` hoisting changed
- Config file format updated
- Coverage reporter options changed

### React 19 Types
- `ref` prop type changed from `Ref<T>` to `RefObject<T>`
- Form types overhauled
- Event handler types stricter

---

## Execution Order

1. ✅ **Backup** (DONE)
2. **Phase 1** - Minor updates (execute all at once)
3. **Test Phase 1** - Verify nothing broke
4. **Phase 2a** - Update Next.js only
5. **Test** - Check if build error is fixed
6. **Phase 2b** - Update Vitest & tooling
7. **Test** - Check tests still pass
8. **Phase 2c** - Update React types
9. **Test** - Fix any type errors
10. **Phase 2d** - Update Zod
11. **Test** - Validate schemas still work
12. **Final Test** - Full regression testing

---

## Post-Update Tasks

- [ ] Update baseline-browser-mapping to remove warnings
- [ ] Consider adding `"type": "module"` to package.json
- [ ] Update dependencies in CI/CD if applicable
- [ ] Document any breaking changes in CHANGELOG
- [ ] Update team on changes

---

**Ready to proceed?** Start with Phase 1 (minor updates)?
