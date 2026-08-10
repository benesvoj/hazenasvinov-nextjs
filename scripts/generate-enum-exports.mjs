import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check if an enum file is "ready" - has enum, labels, and getOptions function
 */
function isEnumReady(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for required patterns:
    // 1. Has an enum export
    // 2. Has a labels/constants object (various naming patterns)
    // 3. Has a getOptions function (various naming patterns)
    const hasEnum = /export\s+enum\s+\w+/.test(content);
    const hasLabels = /export\s+const\s+\w+.*Record.*string.*=/.test(content) || 
                     /export\s+const\s+\w+.*=.*{/.test(content);
    const hasGetOptions = /export\s+const\s+get\w+Options\s*=\s*\(\)/.test(content);
    
    return hasEnum && hasLabels && hasGetOptions;
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Extract the getOptions function name from enum file content
 */
function extractGetOptionsFunctionName(content) {
  const match = content.match(/export\s+const\s+(get\w+Options)\s*=\s*\(\)/);
  return match ? match[1] : null;
}

/**
 * Generate enum exports for index.ts
 */
function generateEnumExports(dir) {
  const files = fs.readdirSync(dir);
  const exports = [];
  
  files.forEach(file => {
    if (file.endsWith('.ts') && file !== 'index.ts') {
      const filePath = path.join(dir, file);
      const fileName = file.replace('.ts', '');
      
      if (isEnumReady(filePath)) {
        exports.push(`export * from './${fileName}';`);
      }
    }
  });
  
  return exports;
}

/**
 * Generate enum helper records for enumHelpers.ts
 */
function generateEnumHelperRecords(dir) {
  const files = fs.readdirSync(dir);
  const records = [];
  const imports = [];
  
  files.forEach(file => {
    if (file.endsWith('.ts') && file !== 'index.ts') {
      const filePath = path.join(dir, file);
      const fileName = file.replace('.ts', '');
      
      if (isEnumReady(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const getOptionsFunctionName = extractGetOptionsFunctionName(content);
        
        if (getOptionsFunctionName) {
          // Convert function name to record name (e.g., getGenderOptions -> genderOptions)
          const recordName = getOptionsFunctionName
            .replace('get', '')
            .replace('Options', '')
            .replace(/([A-Z])/g, (match, p1, offset) => offset === 0 ? p1.toLowerCase() : match)
            + 'Options';
          
          imports.push(getOptionsFunctionName);
          records.push(`export const ${recordName} = createOptionsRecord(${getOptionsFunctionName}());`);
        }
      }
    }
  });
  
  return { imports, records };
}

// Generate and write enums index.ts
const enumsDir = path.join(__dirname, '..', 'src', 'enums');
const enumExports = generateEnumExports(enumsDir);
const enumsIndexPath = path.join(enumsDir, 'index.ts');

// Safety guard: isEnumReady() expects the enum, its labels and its getOptions
// function to live in one file, but src/enums splits them across files, so it
// currently classifies every enum as "not ready". Writing that empty result
// truncates src/enums/index.ts and src/utils/enumHelpers.ts. Bail out instead
// of destroying both files — see the readiness check above.
if (enumExports.length === 0) {
  console.error('❌ No enums were detected as ready — refusing to write empty barrels.');
  console.error('   isEnumReady() is out of sync with how src/enums is structured; fix it first.');
  process.exit(1);
}

fs.writeFileSync(enumsIndexPath, enumExports.join('\n'));
console.log(`✅ Generated ${enumExports.length} enum exports in ${enumsIndexPath}`);

// Generate and write enumHelpers.ts
const enumHelpersPath = path.join(__dirname, '..', 'src', 'utils', 'enumHelpers.ts');
const { imports, records } = generateEnumHelperRecords(enumsDir);

// Generate new content
const newContent = `import {
  ${imports.join(',\n  ')}
} from '@/enums';

/**
 * Convert enum options to Record<string, string> format for UI components
 */
export const createOptionsRecord = <T extends string>(
  options: Array<{value: T; label: string}>
): Record<string, string> => {
  return options.reduce(
    (acc, {value, label}) => {
      acc[value] = label;
      return acc;
    },
    {} as Record<string, string>
  );
};

// Pre-built option records for common use cases
${records.join('\n')}
`;

fs.writeFileSync(enumHelpersPath, newContent);
console.log(`✅ Generated ${records.length} new enum helper records in ${enumHelpersPath}`);

// Show which enums are ready
console.log('\n📋 Ready enums:');
const allFiles = fs.readdirSync(enumsDir);
const readyEnums = [];
allFiles.forEach(file => {
  if (file.endsWith('.ts') && file !== 'index.ts') {
    const filePath = path.join(enumsDir, file);
    if (isEnumReady(filePath)) {
      readyEnums.push(file.replace('.ts', ''));
    }
  }
});
console.log(readyEnums.join(', '));

// Show which enums are not ready
console.log('\n⚠️  Not ready enums:');
const notReadyEnums = [];
allFiles.forEach(file => {
  if (file.endsWith('.ts') && file !== 'index.ts') {
    const filePath = path.join(enumsDir, file);
    if (!isEnumReady(filePath)) {
      notReadyEnums.push(file.replace('.ts', ''));
    }
  }
});
console.log(notReadyEnums.join(', '));
