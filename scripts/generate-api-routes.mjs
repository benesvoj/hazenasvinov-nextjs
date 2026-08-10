#!/usr/bin/env node

/**
 * Generate type-safe API route constants from the file system
 * Scans src/app/api directory and creates constants for all routes
 *
 * Usage: npm run generate:api-routes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import * as prettier from 'prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_DIR = path.join(__dirname, '../src/app/api');
const OUTPUT_FILE = path.join(__dirname, '../src/lib/api-routes.ts');

// Helper to convert path to camelCase
function toCamelCase(str) {
  return str
    .split(/[-_]/)
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

// Check if a directory contains a route.ts file
function hasRoute(dirPath) {
  const routePath = path.join(dirPath, 'route.ts');
  return fs.existsSync(routePath);
}

// Check if directory name is a dynamic segment
function isDynamicSegment(name) {
  return name.startsWith('[') && name.endsWith(']');
}

// Extract parameter name from dynamic segment
function getParamName(segment) {
  return segment.slice(1, -1); // Remove [ and ]
}

// Build hierarchical route structure
function buildRouteTree(routes) {
  const tree = {};

  for (const route of routes) {
    const parts = route.path.split('/').filter(Boolean);

    // Collect all dynamic params in the path
    const dynamicParams = parts
      .filter(isDynamicSegment)
      .map(getParamName);

    let current = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const isDynamic = isDynamicSegment(part);

      if (isDynamic) {
        const paramName = getParamName(part);
        const remainingParts = parts.slice(i + 1);

        // Check if there are more dynamic segments ahead
        const hasMoreDynamicSegments = remainingParts.some(isDynamicSegment);

        if (hasMoreDynamicSegments) {
          // Multiple dynamic segments - create nested function
          // e.g., /categories/[id]/fees/[feeId] -> feeById
          const subPath = remainingParts.join('/');

          // Replace dynamic segments with "by-id" (no leading dash)
          let cleanedPath = subPath.replace(/\[.*?\]/g, 'by-id');

          // Convert slashes to dashes for camelCase processing
          cleanedPath = cleanedPath.replace(/\//g, '-');

          // Split by dash to get parts
          const pathParts = cleanedPath.split('-');

          // Singularize the last resource name before "by"
          const processedParts = pathParts.map((part, index) => {
            // If next parts are "by" and "id", singularize this part if it's plural
            if (
              index < pathParts.length - 2 &&
              pathParts[index + 1] === 'by' &&
              pathParts[index + 2] === 'id'
            ) {
              // Simple pluralization removal
              if (part.endsWith('ies')) {
                return part.slice(0, -3) + 'y'; // categories -> category
              } else if (part.endsWith('s')) {
                return part.slice(0, -1); // fees -> fee, payments -> payment
              }
            }
            return part;
          });

          const funcKey = toCamelCase(processedParts.join('-'));

          current[funcKey] = {
            _isDynamicNested: true,
            _path: route.fullPath,
            _params: dynamicParams
          };
          break;
        } else if (isLast) {
          // Last segment is dynamic
          // Create 'byId' for [id] segments, 'root' for other dynamic segments like [entity]
          const funcName = paramName === 'id' ? 'byId' : 'root';
          current[funcName] = {
            _isDynamic: true,
            _path: route.fullPath,
            _paramName: paramName
          };
        } else {
          // Dynamic segment with static children after it
          // e.g., /categories/[id]/fees (where fees is static)
          // Join with a dash, not a slash: toCamelCase only splits on [-_], so a
          // multi-segment tail like schedule/generate would otherwise leak the
          // slash into the key and emit invalid TypeScript.
          const funcKey = toCamelCase(remainingParts.join('-'));

          current[funcKey] = {
            _isDynamicNested: true,
            _path: route.fullPath,
            _params: dynamicParams
          };
          break;
        }
      } else {
        // Static segment
        const key = toCamelCase(part);

        if (isLast) {
          // Leaf node - if it's not already an object with children
          if (typeof current[key] !== 'object' || current[key]._isDynamic || current[key]._isDynamicNested) {
            current[key] = route.fullPath;
          } else {
            // It's a parent route - add a special "root" key
            current[key].root = route.fullPath;
          }
        } else {
          // Branch node - create nested object if doesn't exist
          if (!current[key]) {
            current[key] = {};
          } else if (typeof current[key] === 'string') {
            // Convert string to object if needed
            const temp = current[key];
            current[key] = { root: temp };
          }
          current = current[key];
        }
      }
    }
  }

  return tree;
}

// Scan API directory and collect all routes
function scanApiDirectory(dirPath, basePath = '') {
  const routes = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    // Skip special directories
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

    const entryPath = path.join(dirPath, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    // If this directory has a route.ts, it's an endpoint
    if (hasRoute(entryPath)) {
      routes.push({
        path: relativePath,
        fullPath: `/api/${relativePath}`
      });
    }

    // Recurse into subdirectories
    const subRoutes = scanApiDirectory(entryPath, relativePath);
    routes.push(...subRoutes);
  }

  return routes;
}

// Generate TypeScript code from tree
function generateCode(obj, indent = 0) {
  const indentStr = '  '.repeat(indent);
  let code = '';

  const entries = Object.entries(obj).sort(([a], [b]) => {
    // Sort: non-functions first, then functions
    const aIsFunc = typeof obj[a] === 'object' && (obj[a]._isDynamic || obj[a]._isDynamicNested);
    const bIsFunc = typeof obj[b] === 'object' && (obj[b]._isDynamic || obj[b]._isDynamicNested);
    if (aIsFunc && !bIsFunc) return 1;
    if (!aIsFunc && bIsFunc) return -1;
    return a.localeCompare(b);
  });

  for (const [key, value] of entries) {
    // Skip internal metadata keys, but NOT 'root' if it's a dynamic function
    if (key === '_isDynamic' || key === '_isDynamicNested' || key === '_path' || key === '_paramName' || key === '_params') {
      continue; // Skip internal keys
    }

    // Skip 'root' only if it's a string (static route handled separately)
    if (key === 'root' && typeof value === 'string') {
      continue; // This will be handled in the parent object's root property
    }

    if (typeof value === 'string') {
      // Simple route
      code += `${indentStr}${key}: '${value}' as const,\n`;
    } else if (value._isDynamicNested && value._params) {
      // Nested dynamic route with multiple parameters
      // e.g., /api/categories/[id]/fees/[feeId]
      let template = value._path;
      const paramsList = value._params.map(p => `${p}: string | number`).join(', ');

      // Replace all dynamic segments with template literals
      value._params.forEach(param => {
        template = template.replace(`[${param}]`, `\${${param}}`);
      });

      code += `${indentStr}${key}: (${paramsList}) => \`${template}\`,\n`;
    } else if (value._isDynamic) {
      // Single dynamic route function
      const template = value._path.replace(`[${value._paramName}]`, `\${${value._paramName}}`);
      code += `${indentStr}${key}: (${value._paramName}: string | number) => \`${template}\`,\n`;
    } else {
      // Nested object
      code += `${indentStr}${key}: {\n`;

      // If there's a root AND it's a string (static route), add it first
      // Don't add it if it's a dynamic function object (will be handled in recursion)
      if (value.root && typeof value.root === 'string') {
        code += `${indentStr}  root: '${value.root}' as const,\n`;
      }

      code += generateCode(value, indent + 1);
      code += `${indentStr}},\n`;
    }
  }

  return code;
}

// Generate the output file
function generateFile(tree) {
  let content = `/**
 * Auto-generated API route constants
 *
 * DO NOT EDIT THIS FILE MANUALLY
 * Generated by: scripts/generate-api-routes.mjs
 *
 * To regenerate: npm run generate:api-routes
 */

export const API_ROUTES = {
`;

  content += generateCode(tree, 1);

  content += `} as const;

/**
 * Type-safe API route constants
 *
 * @example
 * // Static routes
 * fetch(API_ROUTES.status);
 * // => '/api/status'
 *
 * fetch(API_ROUTES.members.internal);
 * // => '/api/members/internal'
 *
 * // Dynamic routes
 * fetch(API_ROUTES.members.byId('123'));
 * // => '/api/members/123'
 *
 * fetch(API_ROUTES.sponsorship.mainPartners.byId('abc'));
 * // => '/api/sponsorship/main-partners/abc'
 */
`;

  return content;
}

// Main execution
try {
  console.log('🔍 Scanning API directory...');
  const routes = scanApiDirectory(API_DIR);

  console.log(`📋 Found ${routes.length} API routes`);

  console.log('🌳 Building route tree...');
  const tree = buildRouteTree(routes);

  console.log('✍️  Generating TypeScript constants...');
  const content = generateFile(tree);

  // Format with the repo's prettier config so regenerating produces no diff
  // beyond the actual route changes, and pre-commit doesn't reformat it back.
  console.log('💅 Formatting with prettier...');
  const prettierConfig = await prettier.resolveConfig(OUTPUT_FILE);
  const formatted = await prettier.format(content, {
    ...prettierConfig,
    parser: 'typescript',
  });

  console.log('💾 Writing to', OUTPUT_FILE);
  fs.writeFileSync(OUTPUT_FILE, formatted, 'utf8');

  console.log('✅ API routes generated successfully!');
} catch (error) {
  console.error('❌ Error generating API routes:', error);
  process.exit(1);
}
