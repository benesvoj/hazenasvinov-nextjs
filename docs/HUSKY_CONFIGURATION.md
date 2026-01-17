# Husky Git Hooks Configuration

## Current Setup (Latest Husky v9+)

### Hooks Configured

#### 1. Pre-Commit Hook
**Location:** `.husky/pre-commit`

**What it does:**
- Runs `lint-staged` on staged files
- ESLint fixes code issues
- Prettier formats code
- TypeScript checks for errors
- Generates hooks exports if hooks changed

**When it runs:** Before every `git commit`

**To bypass temporarily:**
```bash
git commit --no-verify -m "your message"
```

---

#### 2. Pre-Push Hook
**Location:** `.husky/pre-push`

**What it does:**
- Runs full test suite (`npm run test:run`)
- Ensures all tests pass before pushing

**When it runs:** Before every `git push`

**To bypass temporarily:**
```bash
git push --no-verify
```

---

## Configuration Files

### Pre-Commit (.husky/pre-commit)
```bash
#!/bin/sh

echo "🔍 Running pre-commit checks..."

if ! npx lint-staged; then
  echo "❌ Pre-commit checks failed. Please fix the errors before committing."
  exit 1
fi

echo "✅ Pre-commit checks passed!"
exit 0
```

### Pre-Push (.husky/pre-push)
```bash
#!/bin/sh

echo "🧪 Running tests before push..."

if ! npm run test:run; then
  echo "❌ Tests failed. Please fix the failing tests before pushing."
  echo "💡 To skip this check temporarily, use: git push --no-verify"
  exit 1
fi

echo "✅ All tests passed! Proceeding with push..."
exit 0
```

---

## Lint-Staged Configuration

**Location:** `package.json` → `lint-staged` section

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "src/**/*.{ts,tsx}": [
      "bash -c 'npx tsc --noEmit --skipLibCheck'"
    ],
    "src/hooks/**/*.ts": [
      "npm run generate:hooks"
    ],
    "src/types/**/*.ts": [
      "npm run generate:types-barrel"
    ],
    "src/components/**/*.{ts,tsx}": [
      "npm run generate:component-exports"
    ]
  }
}
```

**What each task does:**
- `eslint --fix` - Auto-fixes linting issues
- `prettier --write` - Formats code
- `tsc --noEmit` - Type checks (no compilation)
- `generate:hooks` - Updates hooks barrel exports
- `generate:types-barrel` - Updates types barrel exports
- `generate:component-exports` - Updates component barrel exports

---

## How to Update Husky

### If you need to change hooks:

1. **Edit the hook file directly:**
   ```bash
   nano .husky/pre-commit
   # or
   code .husky/pre-commit
   ```

2. **Make executable:**
   ```bash
   chmod +x .husky/pre-commit
   ```

3. **Test manually:**
   ```bash
   ./.husky/pre-commit
   echo "Exit code: $?"
   ```

---

## Common Issues & Solutions

### Issue 1: "husky - command not found"
**Solution:**
```bash
npm install
npx husky init
```

### Issue 2: Hook exits with code 1 even when checks pass
**Solution:** Ensure script ends with `exit 0`

### Issue 3: Lint-staged creates infinite stashes
**Solution:** Simplified hooks (current config avoids this)

### Issue 4: Tests take too long
**Solution:** Modify pre-push to only run changed tests:
```bash
npm run test:run -- --changed
```

---

## Optional: Additional Hooks

### Commit Message Validation (commit-msg)
**Create:** `.husky/commit-msg`

```bash
#!/bin/sh

# Enforce conventional commits
npx --no -- commitlint --edit "$1"
```

**Requires:**
```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

### Pre-Build Check (Optional)
**Add to pre-push:**

```bash
#!/bin/sh

echo "🧪 Running tests before push..."
if ! npm run test:run; then
  echo "❌ Tests failed."
  exit 1
fi

echo "🏗️ Verifying build..."
if ! npm run build; then
  echo "❌ Build failed."
  exit 1
fi

echo "✅ All checks passed!"
exit 0
```

---

## Current Status

### ✅ Working Configuration
- Pre-commit: Linting, formatting, TypeScript ✅
- Pre-push: Tests ✅
- Proper exit codes ✅
- Clear error messages ✅

### Hooks Pipeline

```
git commit
  ↓
Pre-commit hook
  ↓
lint-staged
  ↓
ESLint (auto-fix)
  ↓
Prettier (format)
  ↓
TypeScript (check)
  ↓
Generate hooks (if needed)
  ↓
✅ Commit succeeds

git push
  ↓
Pre-push hook
  ↓
Run all tests
  ↓
✅ Push succeeds
```

---

## Best Practices

### Do:
- ✅ Keep hooks fast (use lint-staged for pre-commit)
- ✅ Provide bypass instructions
- ✅ Have clear success/failure messages
- ✅ Exit with proper codes (0 = success, 1 = failure)

### Don't:
- ❌ Run full test suite in pre-commit (too slow)
- ❌ Run build in pre-commit (too slow)
- ❌ Forget exit codes (causes mysterious failures)
- ❌ Make hooks too complex

---

## Verification

Test your hooks:

```bash
# Test pre-commit
git add .
./.husky/pre-commit
echo "Exit code: $?"

# Test pre-push
./.husky/pre-push
echo "Exit code: $?"
```

Both should exit with code 0 if successful.

---

**Status:** Husky properly configured! ✅