import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for index file generation rules
const INDEX_RULES = {
  // Always create index files at these levels
  alwaysCreate: ['ui', 'features', 'shared', 'boundaries', 'providers', 'routes'],
  
  // Create index files if folder has this many files or more
  minFilesForIndex: 3,
  
  // Skip index files for single file folders
  skipSingleFile: true,
  
  // Skip index files for these specific folders
  skipFolders: ['docs', 'node_modules', '.git', 'dist', 'build', '__tests__'],
  
  // File extensions to include
  includeExtensions: ['.tsx', '.ts'],
  
  // Files to skip
  skipFiles: ['index.ts', 'index.tsx', 'README.md', '*.d.ts', '*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx']
};

function shouldCreateIndexFile(folderPath, relativePath, files) {
  const folderName = path.basename(folderPath);
  const relativePathParts = relativePath.split('/').filter(Boolean);
  
  // Skip if folder is in skip list
  if (INDEX_RULES.skipFolders.includes(folderName)) {
    return false;
  }
  
  // Always create for major categories
  if (INDEX_RULES.alwaysCreate.includes(folderName)) {
    return true;
  }
  
  // Count valid files
  const validFiles = files.filter(file => {
    const ext = path.extname(file);
    return INDEX_RULES.includeExtensions.includes(ext) && 
           !INDEX_RULES.skipFiles.some(skip => {
             if (skip.includes('*')) {
               return file.endsWith(skip.replace('*', ''));
             }
             return file === skip;
           });
  });
  
  // Skip if single file and skipSingleFile is true
  if (INDEX_RULES.skipSingleFile && validFiles.length === 1) {
    return false;
  }
  
  // Create if meets minimum file count
  return validFiles.length >= INDEX_RULES.minFilesForIndex;
}

function hasFolderIgnoreMarker(folderPath) {
  return fs.existsSync(path.join(folderPath, '.barrel-ignore'));
}

function hasFileIgnoreMarker(fileContent) {
  // Only scan the first 5 lines to avoid reading large files unnecessarily
  const firstLines = fileContent.split('\n', 5).join('\n');
  return /\/\/\s*@barrel-ignore/.test(firstLines);
}

function generateExports(folderPath, relativePath = '') {
  const files = fs.readdirSync(folderPath);
  const exports = [];
  const subFolders = [];

  // Separate files and folders
  files.forEach(file => {
    const fullPath = path.join(folderPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      subFolders.push(file);
    } else {
      const ext = path.extname(file);
      const nameWithoutExt = path.basename(file, ext);

      // Skip if file should be skipped
      const shouldSkip = INDEX_RULES.skipFiles.some(skip => {
        if (skip.includes('*')) {
          return file.endsWith(skip.replace('*', ''));
        }
        return file === skip;
      });

      if (shouldSkip || !INDEX_RULES.includeExtensions.includes(ext)) {
        return;
      }

      // Generate export statement
      const exportPath = `./${nameWithoutExt}`;

      // Check if file has default export by reading the file
      const filePath = path.join(folderPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Skip files marked with // @barrel-ignore
      if (hasFileIgnoreMarker(fileContent)) {
        console.log(`⏭️  Skipping ${filePath} (// @barrel-ignore)`);
        return;
      }
      const hasDefaultExport = /export\s+default\s+/.test(fileContent) || /export\s*{\s*default\s*}/.test(fileContent);

      // Handle different export patterns
      if (nameWithoutExt.startsWith('use')) {
        // Hook files - named export
        exports.push(`export { ${nameWithoutExt} } from '${exportPath}';`);
      } else if (folderPath.includes('/config/') || folderPath.includes('/config')) {
        // Config files - typically export multiple named functions, use export *
        exports.push(`export * from '${exportPath}';`);
      } else if (nameWithoutExt === nameWithoutExt.toUpperCase()) {
        // Constants/enums - named export
        exports.push(`export * from '${exportPath}';`);
      } else if (nameWithoutExt.endsWith('Context') || nameWithoutExt.endsWith('Provider')) {
        // Context/Provider files - check for specific exports
        if (fileContent.includes('AdminSidebarProvider')) {
          exports.push(`export { AdminSidebarProvider as ${nameWithoutExt}, useAdminSidebar } from '${exportPath}';`);
        } else {
          exports.push(`export * from '${exportPath}';`);
        }
      } else if (nameWithoutExt === 'Headings' && fileContent.includes('export function Heading')) {
        // Special case for Headings.tsx which exports Heading (singular)
        exports.push(`export { Heading as ${nameWithoutExt} } from '${exportPath}';`);
      } else if (nameWithoutExt === 'Navigation' && fileContent.includes('export function HorizontalNavigation')) {
        // Special case for Navigation.tsx which exports multiple navigation components
        exports.push(`export * from '${exportPath}';`);
      } else if (nameWithoutExt === 'Toast' && fileContent.includes('export default showToast')) {
        // Special case for Toast.tsx which exports showToast as default
        exports.push(`export { default as showToast } from '${exportPath}';`);
      } else if (hasDefaultExport) {
        // Component files with default export
        exports.push(`export { default as ${nameWithoutExt} } from '${exportPath}';`);
      } else {
        // Component files with named export
        exports.push(`export { ${nameWithoutExt} } from '${exportPath}';`);
      }
    }
  });
  
  // Process subfolders
  subFolders.forEach(subFolder => {
    // Skip __tests__ folders entirely
    if (subFolder === '__tests__') {
      return;
    }

    const subFolderPath = path.join(folderPath, subFolder);

    // Skip folders marked with a .barrel-ignore file
    if (hasFolderIgnoreMarker(subFolderPath)) {
      console.log(`⏭️  Skipping ${subFolderPath} (.barrel-ignore)`);
      return;
    }
    const subRelativePath = relativePath ? `${relativePath}/${subFolder}` : subFolder;
    
    // Check if we should create an index file for this subfolder
    const subFiles = fs.readdirSync(subFolderPath);
    if (shouldCreateIndexFile(subFolderPath, subRelativePath, subFiles)) {
      // Generate index file for subfolder
      const subExports = generateExports(subFolderPath, subRelativePath);
      if (subExports.length > 0) {
        const indexPath = path.join(subFolderPath, 'index.ts');
        writeIndexFile(indexPath, subExports, subFolder);
        
        // Add export for the subfolder
        exports.push(`export * from './${subFolder}';`);
      }
    } else {
      // Add direct exports from subfolder
      const subExports = generateExports(subFolderPath, subRelativePath);
      exports.push(...subExports.map(exp => exp.replace('./', `./${subFolder}/`)));
    }
  });
  
  return exports;
}

function writeIndexFile(filePath, exports, folderName) {
  if (exports.length === 0) {
    return;
  }
  
  // Create header comment
  const header = `// Auto-generated file - do not edit manually
// Generated by: scripts/generate-component-exports.mjs
// Folder: ${folderName}

`;

  // Write the file
  fs.writeFileSync(filePath, header + exports.join('\n'));
  console.log(`✅ Generated ${exports.length} component exports in ${filePath}`);
}

function generateComponentExports() {
  const componentsDir = path.join(__dirname, '..', 'src', 'components');
  
  // Check if components directory exists
  if (!fs.existsSync(componentsDir)) {
    console.error('❌ Components directory not found:', componentsDir);
    return;
  }
  
  console.log('🚀 Generating component exports...');
  
  // Generate exports for the main components directory
  const exports = generateExports(componentsDir);
  
  // Write main index.ts
  const mainIndexPath = path.join(componentsDir, 'index.ts');
  writeIndexFile(mainIndexPath, exports, 'components');
  
  console.log('✅ Component exports generation complete!');
}

// Run the script
generateComponentExports();
