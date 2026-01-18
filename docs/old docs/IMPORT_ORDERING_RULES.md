# Import Ordering Rules

This document outlines the automated import ordering rules enforced by ESLint across the entire project.

## 🎯 **Purpose**

Consistent import ordering improves code readability, reduces merge conflicts, and makes it easier to understand dependencies at a glance.

## 📋 **Import Order**

Imports are automatically ordered in the following sequence:

### **1. Node.js Built-in Modules**
```typescript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
```

### **2. External Packages (npm)**
```typescript
// React (always first)
import React from 'react';
import { useState, useEffect } from 'react';

// Next.js (always second)
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// UI Libraries (alphabetically)
import { Button, Card, Modal } from '@heroui/react';
import { UserIcon, HomeIcon } from '@heroicons/react/24/outline';

// Other external packages (alphabetically)
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
```

### **3. Internal Modules (@/ alias)**
```typescript
// Types (always first)
import { User, Match, LineupFormData } from '@/types';

// Enums (always second)
import { UserRoles, TeamTypes } from '@/enums';

// Constants (always third)
import { API_ENDPOINTS, VALIDATION_RULES } from '@/constants';

// Hooks (always fourth)
import { useAuth, useLineupData } from '@/hooks';

// Components (always fifth)
import { Button, Modal, Card } from '@/components';

// Utils (always sixth)
import { formatDate, validateEmail } from '@/utils';

// Services (always seventh)
import { apiClient, authService } from '@/services';

// Helpers (always eighth)
import { classifyError, formatError } from '@/helpers';

// Contexts (always ninth)
import { UserContext, AppDataContext } from '@/contexts';

// Data (always tenth)
import { siteMetadata } from '@/data';

// App-specific (always last)
import { PageLayout } from '@/app/layout';
```

### **4. Relative Imports**
```typescript
// Parent directory imports
import { ParentComponent } from '../ParentComponent';

// Sibling imports
import { SiblingComponent } from './SiblingComponent';

// Index imports
import { utils } from './';
```

## 🔧 **ESLint Configuration**

The import ordering is enforced by the `eslint-plugin-import` with these rules:

```javascript
'import/order': [
  'error',
  {
    groups: [
      'builtin',     // Node.js built-in modules
      'external',    // npm packages
      'internal',    // Internal modules (using @/ alias)
      'parent',      // Parent directory imports
      'sibling',     // Same directory imports
      'index',       // Index file imports
    ],
    'newlines-between': 'always',
    alphabetize: {
      order: 'asc',
      caseInsensitive: true,
    },
    // ... pathGroups configuration
  },
],
```

## 📝 **Formatting Rules**

### **1. Newlines Between Groups**
Always add empty lines between different import groups:

```typescript
// ✅ Correct
import React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@heroui/react';

import { User } from '@/types';
import { useAuth } from '@/hooks';

import { LocalComponent } from './LocalComponent';

// ❌ Incorrect
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import { User } from '@/types';
import { useAuth } from '@/hooks';
import { LocalComponent } from './LocalComponent';
```

### **2. Alphabetical Ordering**
Within each group, imports are sorted alphabetically:

```typescript
// ✅ Correct
import { Button, Card, Modal } from '@heroui/react';
import { HomeIcon, UserIcon } from '@heroicons/react/24/outline';

// ❌ Incorrect
import { Card, Button, Modal } from '@heroui/react';
import { UserIcon, HomeIcon } from '@heroicons/react/24/outline';
```

### **3. No Empty Lines Within Groups**
Don't add empty lines within the same import group:

```typescript
// ✅ Correct
import { Button } from '@heroui/react';
import { Card } from '@heroui/react';
import { Modal } from '@heroui/react';

// ❌ Incorrect
import { Button } from '@heroui/react';

import { Card } from '@heroui/react';
import { Modal } from '@heroui/react';
```

## 🚀 **Usage**

### **Automatic Fixing**
ESLint automatically fixes import ordering issues:

```bash
# Fix all import ordering issues
npx eslint src --ext .ts,.tsx --fix

# Fix specific file
npx eslint src/components/Button.tsx --fix
```

### **IDE Integration**
Most IDEs can be configured to run ESLint on save:

```json
// VS Code settings.json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### **Pre-commit Hooks**
Import ordering is automatically enforced via lint-staged:

```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix"
    ]
  }
}
```

## 📊 **Examples**

### **Complete Import Example**
```typescript
'use client';

// React
import React, { useState, useEffect } from 'react';

// Next.js
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// External UI Libraries
import { Button, Card, Modal } from '@heroui/react';
import { UserIcon, HomeIcon } from '@heroicons/react/24/outline';

// External Utilities
import { format } from 'date-fns';
import { createPortal } from 'react-dom';

// Internal Types
import { User, Match, LineupFormData } from '@/types';

// Internal Enums
import { UserRoles, TeamTypes } from '@/enums';

// Internal Constants
import { API_ENDPOINTS } from '@/constants';

// Internal Hooks
import { useAuth, useLineupData } from '@/hooks';

// Internal Components
import { Button, Modal, Card } from '@/components';

// Internal Utils
import { formatDate, validateEmail } from '@/utils';

// Internal Services
import { apiClient } from '@/services';

// Internal Helpers
import { classifyError } from '@/helpers';

// Internal Contexts
import { UserContext } from '@/contexts';

// Internal Data
import { siteMetadata } from '@/data';

// App-specific
import { PageLayout } from '@/app/layout';

// Relative imports
import { ParentComponent } from '../ParentComponent';
import { SiblingComponent } from './SiblingComponent';

// Component implementation...
export default function MyComponent() {
  // ...
}
```

## ✅ **Benefits**

1. **Consistency**: All files follow the same import order
2. **Readability**: Easy to scan and understand dependencies
3. **Maintainability**: Reduces merge conflicts in import sections
4. **Automation**: No manual maintenance required
5. **Team Collaboration**: Everyone follows the same standards
6. **IDE Support**: Better autocomplete and refactoring

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Missing newlines between groups**
   - **Fix**: Run `npx eslint --fix`
   - **Manual**: Add empty lines between different import groups

2. **Wrong alphabetical order**
   - **Fix**: Run `npx eslint --fix`
   - **Manual**: Sort imports alphabetically within each group

3. **Empty lines within groups**
   - **Fix**: Run `npx eslint --fix`
   - **Manual**: Remove empty lines within the same import group

### **Disabling Rules (Not Recommended)**
```typescript
// eslint-disable-next-line import/order
import { SpecialImport } from './special';
```

This automated system ensures consistent, readable import organization across the entire project!
