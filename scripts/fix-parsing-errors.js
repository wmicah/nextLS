/**
 * Fix Parsing Errors Script
 * Fixes syntax errors introduced by console cleanup
 */

const fs = require('fs');
const path = require('path');

// Files with known parsing errors
const filesToFix = [
  'src/lib/daily-digest-service.ts',
  'src/lib/dst-example.ts', 
  'src/lib/generate-jwt-secret.ts',
  'src/lib/program-debug-utils.ts',
  'src/lib/performance-monitor.ts',
  'src/trpc/admin.ts',
  'src/trpc/routers/analytics.router.ts',
  'src/trpc/routers/clientRouter.router.ts',
  'src/trpc/routers/clients.router.ts',
  'src/trpc/routers/library.router.ts',
  'src/trpc/routers/messaging.router.ts',
  'src/trpc/routers/programs.router.ts',
  'src/trpc/routers/routines.router.ts',
  'src/trpc/routers/scheduling.router.ts',
  'src/trpc/routers/workouts.router.ts'
];

// Common fixes for parsing errors
const fixes = [
  {
    pattern: /\/\/ Debug logging removed for production\n\s*\)\s*$/gm,
    replacement: ');'
  },
  {
    pattern: /\/\/ Debug logging removed for production\n\s*`\s*$/gm,
    replacement: '`);'
  },
  {
    pattern: /\/\/ Debug logging removed for production\n\s*;\s*$/gm,
    replacement: ';'
  },
  {
    pattern: /\/\/ Debug logging removed for production\n\s*}\s*$/gm,
    replacement: '}'
  },
  {
    pattern: /\/\/ Debug logging removed for production\n\s*\)\s*;\s*$/gm,
    replacement: ');'
  }
];

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply fixes
    fixes.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`ℹ️  No fixes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🔧 Fixing parsing errors...\n');
  
  filesToFix.forEach(file => {
    console.log(`📁 Processing: ${file}`);
    fixFile(file);
  });
  
  console.log('\n✅ Parsing error fixes completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Run ESLint to check remaining errors');
  console.log('2. Test the application');
  console.log('3. Fix any remaining issues manually');
}

if (require.main === module) {
  main();
}

module.exports = { fixFile };
