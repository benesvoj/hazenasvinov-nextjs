#!/usr/bin/env tsx

/**
 * Analyze current database schema from TypeScript types
 * This script extracts schema information from the codebase types
 */

import fs from 'fs';
import path from 'path';

interface ColumnInfo {
  name: string;
  type: string;
  optional: boolean;
  source: string;
}

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  source: string;
}

function extractTableInfoFromFile(filePath: string): TableInfo[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const tables: TableInfo[] = [];
  
  // Look for interface definitions
  const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/g;
  let match;
  
  while ((match = interfaceRegex.exec(content)) !== null) {
    const interfaceName = match[1];
    const interfaceBody = match[2];
    
    // Skip if it's not a database table interface
    if (!interfaceName.match(/^(Category|Match|Member|BlogPost|TrainingSession|Standing|Season|Club|Team)/)) {
      continue;
    }
    
    const columns: ColumnInfo[] = [];
    
    // Extract properties
    const propertyRegex = /(\w+)(\?)?\s*:\s*([^;,\n]+)/g;
    let propMatch;
    
    while ((propMatch = propertyRegex.exec(interfaceBody)) !== null) {
      const propName = propMatch[1];
      const isOptional = !!propMatch[2];
      const propType = propMatch[3].trim();
      
      columns.push({
        name: propName,
        type: propType,
        optional: isOptional,
        source: filePath
      });
    }
    
    if (columns.length > 0) {
      tables.push({
        name: interfaceName,
        columns,
        source: filePath
      });
    }
  }
  
  return tables;
}

function analyzeSchema() {
  const srcDir = path.join(process.cwd(), 'src');
  const tables: TableInfo[] = [];
  
  // Find all TypeScript files
  function findTsFiles(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...findTsFiles(fullPath));
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  const tsFiles = findTsFiles(srcDir);
  
  // Extract table info from each file
  for (const file of tsFiles) {
    try {
      const fileTables = extractTableInfoFromFile(file);
      tables.push(...fileTables);
    } catch (error) {
      console.warn(`Warning: Could not process ${file}:`, error);
    }
  }
  
  // Generate schema report
  console.log('# Current Database Schema Analysis (from TypeScript types)\n');
  console.log('Generated at:', new Date().toISOString());
  console.log('\n## Tables Found:\n');
  
  for (const table of tables) {
    console.log(`### ${table.name}`);
    console.log(`Source: ${table.source}`);
    console.log('```typescript');
    console.log(`interface ${table.name} {`);
    
    for (const column of table.columns) {
      const optional = column.optional ? '?' : '';
      console.log(`  ${column.name}${optional}: ${column.type};`);
    }
    
    console.log('}');
    console.log('```\n');
  }
  
  // Look for category-related fields
  console.log('## Category Field Analysis:\n');
  
  const categoryFields = tables.flatMap(table => 
    table.columns
      .filter(col => col.name.includes('category') || col.name.includes('code'))
      .map(col => ({
        table: table.name,
        column: col.name,
        type: col.type,
        optional: col.optional,
        source: table.source
      }))
  );
  
  if (categoryFields.length > 0) {
    console.log('### Fields containing "category" or "code":');
    for (const field of categoryFields) {
      console.log(`- **${field.table}.${field.column}**: ${field.type} ${field.optional ? '(optional)' : '(required)'}`);
      console.log(`  Source: ${field.source}`);
    }
  } else {
    console.log('No category-related fields found in TypeScript types.');
  }
  
  // Look for potential migration issues
  console.log('\n## Migration Analysis:\n');
  
  const hasCategoryId = tables.some(table => 
    table.columns.some(col => col.name === 'category_id')
  );
  
  const hasCategoryCode = tables.some(table => 
    table.columns.some(col => col.name === 'code' || col.name === 'category')
  );
  
  console.log(`- Has category_id fields: ${hasCategoryId ? '✅ Yes' : '❌ No'}`);
  console.log(`- Has category/code fields: ${hasCategoryCode ? '✅ Yes' : '❌ No'}`);
  
  if (hasCategoryId && hasCategoryCode) {
    console.log('\n⚠️  **MIGRATION IN PROGRESS**: Both category_id and category/code fields found.');
    console.log('This suggests the database is in a partial migration state.');
  } else if (hasCategoryId && !hasCategoryCode) {
    console.log('\n✅ **MIGRATION COMPLETE**: Only category_id fields found.');
    console.log('The database appears to be fully migrated to use UUIDs.');
  } else if (!hasCategoryId && hasCategoryCode) {
    console.log('\n❌ **MIGRATION NOT STARTED**: Only category/code fields found.');
    console.log('The database still uses the legacy VARCHAR category system.');
  }
}

// Run the analysis
analyzeSchema();
