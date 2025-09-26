# Enum Generator Script

This script automatically generates exports for enum files and updates the `enumHelpers.ts` file.

## Usage

```bash
npm run generate:enum-exports
```

## What it does

1. **Scans enum files** in `src/enums/` directory
2. **Identifies "ready" enums** - those that have:
   - An exported enum
   - A labels/constants object (e.g., `GENDER_LABELS`, `AGE_GROUPS`)
   - A getOptions function (e.g., `getGenderOptions`, `getAgeGroupsOptions`)
3. **Updates `src/enums/index.ts`** with exports for ready enums only
4. **Updates `src/utils/enumHelpers.ts`** with option records for ready enums

## Ready vs Not Ready Enums

### Ready Enums (automatically included):
- `ageGroups` - has `AgeGroups` enum, `AGE_GROUPS` labels, `getAgeGroupsOptions()`
- `competitionTypes` - has `CompetitionTypes` enum, `COMPETITION_TYPES` labels, `getCompetitionTypeOptions()`
- `genders` - has `Genders` enum, `GENDER_LABELS` labels, `getGenderOptions()`
- `lineupCoachRole` - has `LineupCoachRole` enum, `LINEUP_COACH_ROLES_NEW` labels, `getLineupCoachRoleOptions()`
- `memberFunction` - has `MemberFunction` enum, `MEMBER_FUNCTION_LABELS` labels, `getMemberFunctionOptions()`

### Not Ready Enums (excluded):
- `lineupErrorType` - missing labels and getOptions function
- `lineupRole` - missing labels and getOptions function
- `playerPosition` - missing labels and getOptions function
- `relationshipStatus` - missing labels and getOptions function
- `relationshipType` - missing labels and getOptions function
- `teamTypes` - missing labels and getOptions function
- `userRoles` - missing labels and getOptions function

## Making an Enum "Ready"

To make an enum ready for automatic inclusion, ensure it has:

1. **An exported enum**:
   ```typescript
   export enum MyEnum {
     VALUE1 = 'value1',
     VALUE2 = 'value2',
   }
   ```

2. **A labels object**:
   ```typescript
   export const MY_ENUM_LABELS: Record<MyEnum, string> = {
     [MyEnum.VALUE1]: 'Label 1',
     [MyEnum.VALUE2]: 'Label 2',
   };
   ```

3. **A getOptions function**:
   ```typescript
   export const getMyEnumOptions = () =>
     Object.entries(MY_ENUM_LABELS).map(([value, label]) => ({
       value: value as MyEnum,
       label,
     }));
   ```

## Generated Files

### `src/enums/index.ts`
```typescript
export * from './ageGroups';
export * from './competitionTypes';
export * from './genders';
export * from './lineupCoachRole';
export * from './memberFunction';
```

### `src/utils/enumHelpers.ts`
```typescript
import {
  getAgeGroupsOptions,
  getCompetitionTypeOptions,
  getGenderOptions,
  getLineupCoachRoleOptions,
  getMemberFunctionOptions
} from '@/enums';

// ... createOptionsRecord function ...

// Pre-built option records for common use cases
export const ageGroupsOptions = createOptionsRecord(getAgeGroupsOptions());
export const competitionTypeOptions = createOptionsRecord(getCompetitionTypeOptions());
export const genderOptions = createOptionsRecord(getGenderOptions());
export const lineupCoachRoleOptions = createOptionsRecord(getLineupCoachRoleOptions());
export const memberFunctionOptions = createOptionsRecord(getMemberFunctionOptions());
```
