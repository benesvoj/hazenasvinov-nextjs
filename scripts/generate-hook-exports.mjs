import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateExports(dir, basePath = '') {
  const files = fs.readdirSync(dir);
  const exports = [];
  const seenExports = new Set();
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip __tests__ directories
      if (file === '__tests__') {
        return;
      }
      // Recursively process subdirectories
      const subExports = generateExports(fullPath, path.posix.join(basePath, file));
      exports.push(...subExports);
    } else if (file.endsWith('.ts') && !file.startsWith('index') && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts')) {

      // Generate export statement
      const relativePath = path.posix.join(basePath, file.replace('.ts', ''));
      const exportPath = `./${relativePath}`;
      
      // Check for potential conflicts and handle them
      if (file === 'useAuthNew.ts') {
        exports.push(`export { useAuth as useAuthNew } from '${exportPath}';`);
      } else if (file === 'useMatchQueries.ts') {
        // Handle specific exports from useMatchQueries to avoid conflicts
        exports.push(`export { 
          useMatchesWithTeams,
          useMatchesSeasonal,
          useMatchById,
          useOwnClubMatches as useOwnClubMatchesQuery,
          usePublicMatches as usePublicMatchesQuery,
          useUpcomingMatches,
          useCompletedMatches,
          useMatchesByMatchweek,
          useMatchesByDateRange,
          useCreateMatch,
          useUpdateMatch,
          useDeleteMatch,
          useOptimisticMatchUpdate
        } from '${exportPath}';`);
      } else if (basePath.includes('match/') && (file.endsWith('.ts'))) {
        // Handle match sub-folders (data/, state/, business/)
        const subFolder = basePath.split('/').pop();
        if (subFolder === 'data' || subFolder === 'state' || subFolder === 'business') {
          exports.push(`export * from '${exportPath}';`);
        } else {
          exports.push(`export * from '${exportPath}';`);
        }
      } else {
        exports.push(`export * from '${exportPath}';`);
      }
    }
  });
  
  return exports;
}

// Generate and write index.ts
const hooksDir = path.join(__dirname, '..', 'src', 'hooks');
const exports = generateExports(hooksDir);
const outputPath = path.join(hooksDir, 'index.ts');

fs.writeFileSync(outputPath, exports.join('\n'));
console.log(`✅ Generated ${exports.length} hook exports in ${outputPath}`);