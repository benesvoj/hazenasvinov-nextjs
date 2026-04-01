cat > /tmp/circular_dependency_found.txt << 'EOF'                                         
CIRCULAR DEPENDENCY CHAIN FOUND:

Step 1: Entry Point
-------
src/features/blogPosts/model/status.ts                                                    
Line 3: import {createEnumHelpers} from '@/shared/lib';

Step 2: Shared Lib Barrel
-------
src/shared/lib/index.ts
Line 4: export {createFeatureFetch} from './createFeatureFetch';

Step 3: createFeatureFetch imports createDataFetchHook
-------
src/shared/lib/createFeatureFetch.ts
Line 1: import {createDataFetchHook} from '@/hooks/factories';

Step 4: Hooks factories barrel re-exports createDataFetchHook
-------
src/hooks/factories/index.ts
Line 1: export * from './createDataFetchHook';

Step 5: createDataFetchHook imports showToast from @/components
-------
src/hooks/factories/createDataFetchHook.ts
Line 5: import {showToast} from '@/components';

Step 6: @/components imports the entire ui/feedback module
-------
src/components/index.ts
(via: export * from './ui')
src/components/ui/index.ts
(via: export * from './feedback')
src/components/ui/feedback/index.ts
Line 8: export { default as showToast } from './Toast';

THE CIRCULAR DEPENDENCY PROBLEM:
================================

When a test or module tries to import anything from @/shared/lib:

1. Node starts loading src/shared/lib/index.ts
2. It encounters: export {createFeatureFetch} from './createFeatureFetch'
3. It loads src/shared/lib/createFeatureFetch.ts
4. Which imports createDataFetchHook from '@/hooks/factories'
5. Which loads src/hooks/factories/index.ts
6. Which does: export * from './createDataFetchHook'
7. Which loads src/hooks/factories/createDataFetchHook.ts
8. This file has at the TOP LEVEL: import {showToast} from '@/components'
9. @/components/index.ts starts loading
10. Eventually it tries to export showToast which might trigger loading of other
    modules
11. Those modules might try to use things from @/shared/lib (directly or indirectly)
12. But @/shared/lib is STILL BEING INITIALIZED at the top level

OR:

The issue is that when vitest loads modules:
- If createFeatureFetch is imported from @/shared/lib
- It triggers import of createDataFetchHook
- Which immediately tries to import showToast from @/components
- But @/components hasn't fully initialized yet
- When the circular dependency gets evaluated, createEnumHelpers might not be exported
  yet

VITEST SPECIFIC ISSUE:
====================
In vitest tests, ES module evaluation is stricter. The circular dependency causes:
1. @/shared/lib starts exporting
2. createFeatureFetch is accessed, which imports from @/hooks/factories
3. @/hooks/factories exports showToast import which goes to @/components
4. If @/components tries to access anything from @/shared/lib during module evaluation
5. The export of createEnumHelpers from @/shared/lib/index.ts hasn't completed yet
6. Result: createEnumHelpers is undefined at runtime in the test

SOLUTION:
=========
The circular dependency should be broken by one of these approaches:
1. Move showToast import in createDataFetchHook to inside functions (lazy import)
2. Move createDataFetchHook outside of @/hooks/factories barrel exports
3. Create a separate showToast module that doesn't depend on anything
4. Refactor to avoid having @/components expose showToast at the barrel level

CURRENT LOCATION OF ISSUE:
=========================
src/hooks/factories/createDataFetchHook.ts - Line 5
import {showToast} from '@/components';

This is a TOP LEVEL import that triggers @/components to load,
which in a circular fashion might depend on modules that use @/shared/lib
EOF
cat /tmp/circular_dependency_found.txt