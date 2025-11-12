# Member Type Converters and Type Guards - Usage Guide

**Date:** 2025-10-21
**Related:** [MEMBER_TYPE_SYSTEM_CLEANUP_PLAN.md](./MEMBER_TYPE_SYSTEM_CLEANUP_PLAN.md), [MEMBER_TYPE_SYSTEM_CLEANUP_STATUS.md](./MEMBER_TYPE_SYSTEM_CLEANUP_STATUS.md)

---

## Table of Contents

1. [Overview](#overview)
2. [Type Converters](#type-converters)
3. [Type Guards](#type-guards)
4. [Common Patterns](#common-patterns)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Overview

This guide explains how to use the Member type conversion and validation utilities introduced in the Member Type System cleanup.

### Why Do We Need These?

**Problem:** The database stores data as strings, but our application uses TypeScript enums for type safety:

```typescript
// Database returns:
{ sex: "male", functions: ["coach", "player"] }  // strings

// Application expects:
{ sex: Genders.MALE, functions: [MemberFunction.COACH, MemberFunction.PLAYER] }  // enums
```

**Solution:** Converters transform database types → application types, and type guards validate the data.

### What's Included?

- **4 converter functions** - Transform between database and application types
- **5 type guard functions** - Validate and narrow types at runtime
- **Automatic exports** - Available via `import {functionName} from '@/types'`

---

## Type Converters

### Location
`src/types/entities/member/converters/memberConverters.ts`

### 1. `parseGenderFromDb()`

Converts database string to `Genders` enum.

#### Signature
```typescript
function parseGenderFromDb(sex: string | null): Genders | null
```

#### Parameters
- `sex` - Database sex value (string: "male", "female", "mixed") or null

#### Returns
- `Genders` enum value or `null` if input is null/invalid

#### Behavior
- Normalizes input to lowercase and trims whitespace
- Returns `null` for invalid values (with console warning)
- Case-insensitive matching

#### Example Usage

```typescript
import {parseGenderFromDb, Genders} from '@/types';

// Valid values
parseGenderFromDb("male")     // → Genders.MALE
parseGenderFromDb("FEMALE")   // → Genders.FEMALE  (case-insensitive)
parseGenderFromDb("  Mixed  ") // → Genders.MIXED  (trimmed)

// Invalid/null values
parseGenderFromDb(null)       // → null
parseGenderFromDb("invalid")  // → null (with console.warn)
parseGenderFromDb("")         // → null
```

#### Valid Database Values
| Database String | Enum Result |
|----------------|-------------|
| `"male"` | `Genders.MALE` |
| `"female"` | `Genders.FEMALE` |
| `"mixed"` | `Genders.MIXED` |
| `null` | `null` |
| Any other value | `null` (warning logged) |

---

### 2. `parseFunctionsFromDb()`

Converts database string array to `MemberFunction` enum array.

#### Signature
```typescript
function parseFunctionsFromDb(functions: string[] | null): MemberFunction[]
```

#### Parameters
- `functions` - Database functions array (e.g., `["coach", "player"]`) or null

#### Returns
- Array of `MemberFunction` enums (empty array if input is null/empty)

#### Behavior
- Normalizes each function to lowercase and trims whitespace
- Filters out invalid function values (with console warnings)
- Returns empty array for null/empty input
- Never returns null (always returns array)

#### Example Usage

```typescript
import {parseFunctionsFromDb, MemberFunction} from '@/types';

// Valid values
parseFunctionsFromDb(["coach", "player"])
// → [MemberFunction.COACH, MemberFunction.PLAYER]

parseFunctionsFromDb(["  COACH  ", "referee"])
// → [MemberFunction.COACH, MemberFunction.REFEREE]  (trimmed + case-insensitive)

// Mixed valid/invalid
parseFunctionsFromDb(["coach", "invalid", "player"])
// → [MemberFunction.COACH, MemberFunction.PLAYER]  (invalid filtered out with warning)

// Null/empty values
parseFunctionsFromDb(null)    // → []
parseFunctionsFromDb([])      // → []
parseFunctionsFromDb([""])    // → [] (empty strings filtered)
```

#### Valid Database Values
| Database String | Enum Result |
|----------------|-------------|
| `"player"` | `MemberFunction.PLAYER` |
| `"coach"` | `MemberFunction.COACH` |
| `"referee"` | `MemberFunction.REFEREE` |
| `"team_manager"` | `MemberFunction.TEAM_MANAGER` |
| `"administrator"` | `MemberFunction.ADMINISTRATOR` |
| Any other value | Filtered out (warning logged) |

---

### 3. `convertSchemaToMember()`

Converts full `MemberSchema` (database type) to `Member` (application type).

#### Signature
```typescript
function convertSchemaToMember(schema: MemberSchema): Member
```

#### Parameters
- `schema` - Raw member data from database (type: `MemberSchema`)

#### Returns
- Strongly-typed `Member` object with enum fields

#### Behavior
- Converts `sex` field using `parseGenderFromDb()`
- Defaults to `Genders.MALE` if sex is null/invalid
- Converts `functions` field using `parseFunctionsFromDb()`
- Preserves all other fields unchanged

#### Example Usage

```typescript
import {convertSchemaToMember} from '@/types';

// Database response
const dbMember = {
  id: "123",
  name: "John",
  surname: "Doe",
  registration_number: "REG001",
  sex: "male",                    // string
  functions: ["coach", "player"], // string[]
  date_of_birth: "1990-01-01",
  category_id: "cat-1",
  is_active: true,
  created_at: "2025-01-01",
  updated_at: "2025-01-01"
};

// Convert to application type
const member = convertSchemaToMember(dbMember);

console.log(member.sex);        // Genders.MALE (enum)
console.log(member.functions);  // [MemberFunction.COACH, MemberFunction.PLAYER] (enums)
```

#### Use Cases

1. **In data fetching hooks:**
```typescript
const response = await fetch('/api/members/internal');
const result = await response.json();

// Convert each schema to Member
const members = result.data.map(convertSchemaToMember);
setData(members);
```

2. **With existing converters:**
```typescript
// Chain with payment status converter
const members = result.data.map(schema => {
  const member = convertSchemaToMember(schema);
  return convertToInternalMemberWithPayment(member);
});
```

---

### 4. `convertMemberToSchema()`

Converts `Member` (application type) to `MemberSchema` (for database operations).

#### Signature
```typescript
function convertMemberToSchema(member: Member): MemberSchema
```

#### Parameters
- `member` - Application Member object with enum fields

#### Returns
- `MemberSchema` object with string fields suitable for database

#### Behavior
- Converts `sex` enum to string
- Converts `functions` enum array to string array
- Preserves all other fields unchanged

#### Example Usage

```typescript
import {convertMemberToSchema, Genders, MemberFunction} from '@/types';

// Application member with enums
const member = {
  id: "123",
  name: "John",
  surname: "Doe",
  registration_number: "REG001",
  sex: Genders.MALE,                                    // enum
  functions: [MemberFunction.COACH, MemberFunction.PLAYER], // enum[]
  date_of_birth: "1990-01-01",
  category_id: "cat-1",
  is_active: true,
  created_at: "2025-01-01",
  updated_at: "2025-01-01"
};

// Convert to database schema
const schema = convertMemberToSchema(member);

console.log(schema.sex);        // "male" (string)
console.log(schema.functions);  // ["coach", "player"] (string[])
```

#### Use Cases

1. **In create/update operations:**
```typescript
// Create new member
const newMember: Member = {
  name: formData.name,
  sex: Genders.MALE,
  functions: [MemberFunction.PLAYER],
  // ... other fields
};

// Convert to schema for API
const schema = convertMemberToSchema(newMember);
const response = await fetch('/api/members', {
  method: 'POST',
  body: JSON.stringify(schema)
});
```

2. **In CRUD hooks:**
```typescript
export async function updateMember(member: Member) {
  const schema = convertMemberToSchema(member);

  const response = await fetch(`/api/members/${member.id}`, {
    method: 'PATCH',
    body: JSON.stringify(schema)
  });

  const result = await response.json();
  return convertSchemaToMember(result.data); // Convert back
}
```

---

## Type Guards

### Location
`src/types/entities/member/guards/memberTypeGuards.ts`

### 1. `isValidGender()`

Checks if a value is a valid `Genders` enum.

#### Signature
```typescript
function isValidGender(value: any): value is Genders
```

#### Parameters
- `value` - Any value to check

#### Returns
- `true` if value is a valid `Genders` enum member
- `false` otherwise
- **Type predicate**: Narrows type to `Genders` in true branch

#### Example Usage

```typescript
import {isValidGender, Genders} from '@/types';

isValidGender(Genders.MALE)     // → true
isValidGender("male")           // → false (string, not enum)
isValidGender(null)             // → false
isValidGender(undefined)        // → false
isValidGender({})               // → false

// Type narrowing
function processMember(sex: any) {
  if (isValidGender(sex)) {
    // TypeScript knows sex is Genders here
    console.log(sex); // sex: Genders
  } else {
    console.error("Invalid gender value");
  }
}
```

#### Use Cases

1. **Validate user input:**
```typescript
function handleGenderSelect(value: any) {
  if (isValidGender(value)) {
    setMember({...member, sex: value}); // Safe assignment
  } else {
    showToast.danger("Please select a valid gender");
  }
}
```

2. **Runtime validation:**
```typescript
const dbResult = await fetchFromDB();
if (!isValidGender(dbResult.sex)) {
  console.warn(`Invalid sex value in database: ${dbResult.sex}`);
  dbResult.sex = Genders.MALE; // Fallback
}
```

---

### 2. `isValidMemberFunction()`

Checks if a value is a valid `MemberFunction` enum.

#### Signature
```typescript
function isValidMemberFunction(value: any): value is MemberFunction
```

#### Parameters
- `value` - Any value to check

#### Returns
- `true` if value is a valid `MemberFunction` enum member
- `false` otherwise
- **Type predicate**: Narrows type to `MemberFunction` in true branch

#### Example Usage

```typescript
import {isValidMemberFunction, MemberFunction} from '@/types';

isValidMemberFunction(MemberFunction.COACH)  // → true
isValidMemberFunction("coach")               // → false (string, not enum)
isValidMemberFunction(null)                  // → false

// Validate array
const functions = ["coach", MemberFunction.PLAYER, null];
const validFunctions = functions.filter(isValidMemberFunction);
// → [MemberFunction.PLAYER]
```

#### Use Cases

1. **Filter valid functions:**
```typescript
const selectedFunctions = formData.functions.filter(isValidMemberFunction);
```

2. **Validate before assignment:**
```typescript
function addFunction(func: any) {
  if (isValidMemberFunction(func)) {
    setMember({
      ...member,
      functions: [...member.functions, func]
    });
  }
}
```

---

### 3. `isMember()`

Checks if an object is a valid `Member` interface.

#### Signature
```typescript
function isMember(obj: any): obj is Member
```

#### Parameters
- `obj` - Any object to check

#### Returns
- `true` if object conforms to `Member` interface
- `false` otherwise
- **Type predicate**: Narrows type to `Member` in true branch

#### Validation Checks
- Object is not null
- Has `id`, `name`, `surname` as strings
- Has `sex` as valid `Genders` enum
- Has `functions` as array of valid `MemberFunction` enums

#### Example Usage

```typescript
import {isMember} from '@/types';

const data = await fetchMemberFromAPI();

if (isMember(data)) {
  // TypeScript knows data is Member here
  console.log(data.name);      // Safe access
  console.log(data.sex);       // Genders enum
  console.log(data.functions); // MemberFunction[]
} else {
  console.error("Invalid member data from API");
}
```

#### Use Cases

1. **API response validation:**
```typescript
const response = await fetch('/api/members/123');
const data = await response.json();

if (!isMember(data)) {
  throw new Error("Invalid member data received");
}

// Safe to use data as Member
setMember(data);
```

2. **Type narrowing in components:**
```typescript
function MemberCard({data}: {data: any}) {
  if (!isMember(data)) {
    return <ErrorState message="Invalid member data" />;
  }

  // data is Member here
  return <div>{data.name} {data.surname}</div>;
}
```

---

### 4. `isBaseMember()`

Checks if an object is a valid `BaseMember` interface.

#### Signature
```typescript
function isBaseMember(obj: any): obj is BaseMember
```

#### Parameters
- `obj` - Any object to check

#### Returns
- `true` if object conforms to `BaseMember` interface
- `false` otherwise
- **Type predicate**: Narrows type to `BaseMember` in true branch

#### Validation Checks
- Object is not null
- Has `id`, `name`, `surname` as strings
- Has `sex` as valid `Genders` enum OR null

#### Example Usage

```typescript
import {isBaseMember} from '@/types';

function processMembers(members: any[]) {
  const validMembers = members.filter(isBaseMember);
  // validMembers is BaseMember[]

  validMembers.forEach(member => {
    console.log(member.name); // Safe access
  });
}
```

#### Use Cases

1. **Validate partial member data:**
```typescript
const partialData = {
  id: "123",
  name: "John",
  surname: "Doe",
  sex: null  // Allowed in BaseMember
};

if (isBaseMember(partialData)) {
  // Can use as BaseMember
  displayMember(partialData);
}
```

---

### 5. `validateMemberFromDb()`

Asserts that data from database is a valid `Member`. Throws error if invalid.

#### Signature
```typescript
function validateMemberFromDb(data: any): asserts data is Member
```

#### Parameters
- `data` - Data to validate

#### Returns
- Nothing (void) - Uses assertion signature

#### Behavior
- If data is valid: Function returns, TypeScript narrows type to `Member`
- If data is invalid: Throws `Error` with message "Invalid member data from database"

#### Example Usage

```typescript
import {validateMemberFromDb} from '@/types';

async function fetchMember(id: string) {
  const response = await fetch(`/api/members/${id}`);
  const data = await response.json();

  // Throws error if invalid
  validateMemberFromDb(data);

  // TypeScript knows data is Member here (no need for type assertion)
  return data; // Type is Member
}
```

#### Use Cases

1. **Critical data validation:**
```typescript
try {
  const dbResult = await fetchFromDatabase();
  validateMemberFromDb(dbResult);

  // Safe to use
  processMember(dbResult);
} catch (error) {
  console.error("Database returned invalid member data:", error);
  showToast.danger("Data integrity error");
}
```

2. **Fail-fast validation:**
```typescript
function importMembers(csvData: any[]) {
  return csvData.map(row => {
    const member = parseCSVRow(row);
    validateMemberFromDb(member); // Throws if invalid
    return member; // Type is Member
  });
}
```

---

## Common Patterns

### Pattern 1: Fetch and Convert Members

**Use Case:** Fetching members from API and converting to application types.

```typescript
// src/hooks/entities/member/data/useFetchMembersInternal.ts

import {convertSchemaToMember, MemberInternal} from '@/types';

export function useFetchMembersInternal() {
  const fetchData = async () => {
    const response = await fetch('/api/members/internal');
    const result = await response.json();

    // Convert each schema to Member, then to MemberInternal
    const members = result.data.map(schema => {
      const member = convertSchemaToMember(schema);
      return convertToInternalMemberWithPayment(member);
    });

    setData(members);
  };

  return {data, fetchData};
}
```

---

### Pattern 2: Create/Update with Conversion

**Use Case:** Converting application types to schema before sending to API.

```typescript
// src/hooks/entities/member/useMembers.ts

import {convertMemberToSchema, convertSchemaToMember, Member} from '@/types';

export function useMembers() {
  const createMember = async (memberData: Member) => {
    // Convert to schema for API
    const schema = convertMemberToSchema(memberData);

    const response = await fetch('/api/members', {
      method: 'POST',
      body: JSON.stringify(schema)
    });

    const result = await response.json();

    // Convert response back to Member
    return convertSchemaToMember(result.data);
  };

  const updateMember = async (member: Member) => {
    const schema = convertMemberToSchema(member);

    const response = await fetch(`/api/members/${member.id}`, {
      method: 'PATCH',
      body: JSON.stringify(schema)
    });

    const result = await response.json();
    return convertSchemaToMember(result.data);
  };

  return {createMember, updateMember};
}
```

---

### Pattern 3: Validate Form Input

**Use Case:** Validating user input in forms before submission.

```typescript
// src/components/forms/MemberForm.tsx

import {isValidGender, isValidMemberFunction, Genders, MemberFunction} from '@/types';

function MemberForm() {
  const handleSubmit = (formData: any) => {
    // Validate sex
    if (!isValidGender(formData.sex)) {
      showToast.danger("Please select a valid gender");
      return;
    }

    // Validate functions
    const validFunctions = formData.functions.filter(isValidMemberFunction);
    if (validFunctions.length === 0) {
      showToast.danger("Please select at least one valid function");
      return;
    }

    // Safe to submit
    onSubmit({
      ...formData,
      sex: formData.sex as Genders,
      functions: validFunctions as MemberFunction[]
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

### Pattern 4: Safe Type Narrowing

**Use Case:** Using type guards to safely narrow unknown types.

```typescript
// src/utils/memberUtils.ts

import {isMember, isBaseMember} from '@/types';

function displayMember(data: unknown) {
  if (isMember(data)) {
    // Full member data available
    return `${data.name} ${data.surname} (${data.registration_number})`;
  } else if (isBaseMember(data)) {
    // Partial member data
    return `${data.name} ${data.surname}`;
  } else {
    return "Unknown member";
  }
}
```

---

### Pattern 5: Error Handling with Validation

**Use Case:** Catching validation errors gracefully.

```typescript
// src/api/members/route.ts

import {validateMemberFromDb, convertSchemaToMember} from '@/types';

export async function GET(request: Request) {
  try {
    const dbResult = await database.query('SELECT * FROM members WHERE id = $1', [id]);

    // Validate database result
    validateMemberFromDb(dbResult.rows[0]);

    return Response.json({
      success: true,
      data: dbResult.rows[0]
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid member data")) {
      console.error("Database integrity error:", error);
      return Response.json({
        success: false,
        error: "Data integrity error"
      }, {status: 500});
    }
    throw error;
  }
}
```

---

## Best Practices

### 1. Always Convert at Boundaries

**Convert data at API boundaries** - don't pass raw database types through your application.

```typescript
// ✅ GOOD: Convert at the boundary
const response = await fetch('/api/members');
const result = await response.json();
const members = result.data.map(convertSchemaToMember); // Convert immediately
return members;

// ❌ BAD: Pass raw schema through app
const response = await fetch('/api/members');
const result = await response.json();
return result.data; // Raw schemas passed around
```

---

### 2. Use Type Guards for Runtime Validation

**Use type guards** when data comes from external sources (API, user input, localStorage).

```typescript
// ✅ GOOD: Validate external data
const storedMember = JSON.parse(localStorage.getItem('member'));
if (isMember(storedMember)) {
  setMember(storedMember);
} else {
  console.error("Invalid stored member data");
}

// ❌ BAD: Trust external data
const storedMember = JSON.parse(localStorage.getItem('member')) as Member;
setMember(storedMember); // Might crash if data is invalid
```

---

### 3. Handle Invalid Values Gracefully

**Provide fallbacks** for invalid enum values instead of crashing.

```typescript
// ✅ GOOD: Graceful handling
const sex = parseGenderFromDb(dbValue);
const finalSex = sex ?? Genders.MALE; // Fallback to default

// ❌ BAD: No fallback
const sex = parseGenderFromDb(dbValue);
setMember({...member, sex}); // Might set null, causing issues
```

---

### 4. Centralize Conversion Logic

**Keep conversion logic in one place** - don't duplicate converters.

```typescript
// ✅ GOOD: Use centralized converter
import {convertSchemaToMember} from '@/types';
const member = convertSchemaToMember(schema);

// ❌ BAD: Duplicate conversion logic
const member = {
  ...schema,
  sex: schema.sex === 'male' ? Genders.MALE : Genders.FEMALE, // Duplicated logic
  functions: schema.functions.map(f => f as MemberFunction)
};
```

---

### 5. Log Warnings for Invalid Data

**Log warnings** when encountering invalid data to help debugging.

```typescript
// ✅ GOOD: Converters already log warnings
const sex = parseGenderFromDb("invalid"); // Logs: "Unknown gender value from DB: invalid"

// If you need custom logging:
const functions = parseFunctionsFromDb(dbFunctions);
if (functions.length === 0 && dbFunctions?.length > 0) {
  console.warn("All member functions were invalid:", dbFunctions);
}
```

---

## Troubleshooting

### Issue 1: "Unknown gender value from DB" Warning

**Symptom:** Console warning: `Unknown gender value from DB: <value>`

**Cause:** Database contains invalid sex value (not "male", "female", or "mixed")

**Solution:**
1. Check database for invalid values:
   ```sql
   SELECT DISTINCT sex FROM members WHERE sex NOT IN ('male', 'female', 'mixed');
   ```
2. Fix database:
   ```sql
   UPDATE members SET sex = 'male' WHERE sex NOT IN ('male', 'female', 'mixed');
   ```
3. Or handle in code:
   ```typescript
   const sex = parseGenderFromDb(dbValue) ?? Genders.MALE;
   ```

---

### Issue 2: "Unknown member function value from DB" Warning

**Symptom:** Console warning: `Unknown member function value from DB: <value>`

**Cause:** Database contains invalid function value

**Solution:**
1. Check database for invalid values:
   ```sql
   SELECT DISTINCT unnest(functions) AS func
   FROM members
   WHERE NOT (functions <@ ARRAY['player', 'coach', 'referee', 'team_manager', 'administrator']);
   ```
2. Fix database or filter in code:
   ```typescript
   const functions = parseFunctionsFromDb(dbFunctions);
   if (functions.length === 0) {
     functions.push(MemberFunction.PLAYER); // Default
   }
   ```

---

### Issue 3: Type Error - "string is not assignable to Genders"

**Symptom:** TypeScript error when assigning string to Genders field

**Cause:** Trying to assign raw database string without conversion

**Solution:** Use converter:
```typescript
// ❌ ERROR
member.sex = dbResult.sex; // string → Genders (type error)

// ✅ FIX
member.sex = parseGenderFromDb(dbResult.sex) ?? Genders.MALE;

// ✅ BETTER: Use full converter
const member = convertSchemaToMember(dbResult);
```

---

### Issue 4: "Invalid member data from database" Error

**Symptom:** Error thrown by `validateMemberFromDb()`

**Cause:** Database result doesn't match `Member` interface (missing fields, wrong types)

**Solution:**
1. Use try-catch to handle gracefully:
   ```typescript
   try {
     validateMemberFromDb(dbResult);
     return dbResult;
   } catch (error) {
     console.error("Invalid member data:", dbResult);
     // Return default or re-fetch
   }
   ```
2. Use `isMember()` instead for non-critical validation:
   ```typescript
   if (!isMember(dbResult)) {
     console.warn("Invalid member, using defaults");
     return getDefaultMember();
   }
   ```

---

### Issue 5: Converters Not Found

**Symptom:** Import error: `Module '"@/types"' has no exported member 'convertSchemaToMember'`

**Cause:** Types not regenerated after adding converters

**Solution:**
```bash
npm run generate:types
```

Then restart TypeScript server in your IDE.

---

## Summary

### Quick Reference

| Task | Function | When to Use |
|------|----------|-------------|
| DB string → Genders enum | `parseGenderFromDb()` | Parsing database sex field |
| DB string[] → MemberFunction[] | `parseFunctionsFromDb()` | Parsing database functions field |
| MemberSchema → Member | `convertSchemaToMember()` | After fetching from DB |
| Member → MemberSchema | `convertMemberToSchema()` | Before saving to DB |
| Validate Genders enum | `isValidGender()` | Runtime validation, user input |
| Validate MemberFunction enum | `isValidMemberFunction()` | Runtime validation, filtering |
| Check if Member | `isMember()` | Type narrowing, optional validation |
| Check if BaseMember | `isBaseMember()` | Type narrowing, partial data |
| Assert Member or throw | `validateMemberFromDb()` | Critical validation, fail-fast |

### Import Statement

```typescript
import {
  // Converters
  parseGenderFromDb,
  parseFunctionsFromDb,
  convertSchemaToMember,
  convertMemberToSchema,

  // Type Guards
  isValidGender,
  isValidMemberFunction,
  isMember,
  isBaseMember,
  validateMemberFromDb,

  // Types & Enums
  Member,
  MemberSchema,
  BaseMember,
  Genders,
  MemberFunction
} from '@/types';
```

---

**Document Version:** 1.0
**Last Updated:** 2025-10-21
**Maintainer:** Development Team
