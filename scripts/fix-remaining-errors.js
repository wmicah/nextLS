/**
 * Fix Remaining Parsing Errors Script
 * Fixes the most critical syntax errors
 */

const fs = require('fs');
const path = require('path');

// Critical files to fix
const criticalFiles = [
  'src/lib/dst-example.ts',
  'src/lib/generate-jwt-secret.ts', 
  'src/lib/program-debug-utils.ts',
  'src/lib/performance-monitor.ts',
  'src/trpc/admin.ts',
  'src/trpc/routers/scheduling.router.ts'
];

function fixDstExample() {
  const filePath = 'src/lib/dst-example.ts';
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix broken console statements
  content = content.replace(
    /\/\/ Debug logging removed for production\n\s*console\.log\(/g,
    'console.log('
  );
  
  // Fix broken template literals
  content = content.replace(
    /\/\/ Debug logging removed for production\n\s*`/g,
    '`'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed: src/lib/dst-example.ts');
}

function fixGenerateJwtSecret() {
  const filePath = 'src/lib/generate-jwt-secret.ts';
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix broken console statements
  content = content.replace(
    /\/\/ Debug logging removed for production\n\s*console\.log\(/g,
    'console.log('
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed: src/lib/generate-jwt-secret.ts');
}

function fixProgramDebugUtils() {
  const filePath = 'src/lib/program-debug-utils.ts';
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix broken console statements
  content = content.replace(
    /\/\/ Debug logging removed for production\n\s*console\.log\(/g,
    'console.log('
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed: src/lib/program-debug-utils.ts');
}

function fixPerformanceMonitor() {
  const filePath = 'src/lib/performance-monitor.ts';
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix broken console statements
  content = content.replace(
    /\/\/ Debug logging removed for production\n\s*console\.log\(/g,
    'console.log('
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed: src/lib/performance-monitor.ts');
}

function fixAdmin() {
  const filePath = 'src/trpc/admin.ts';
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix broken console statements
  content = content.replace(
    /\/\/ Debug logging removed for production\n\s*console\.log\(/g,
    'console.log('
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed: src/trpc/admin.ts');
}

function fixSchedulingRouter() {
  const filePath = 'src/trpc/routers/scheduling.router.ts';
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix broken console statements
  content = content.replace(
    /\/\/ Debug logging removed for production\n\s*console\.log\(/g,
    'console.log('
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed: src/trpc/routers/scheduling.router.ts');
}

function main() {
  console.log('🔧 Fixing remaining critical parsing errors...\n');
  
  fixDstExample();
  fixGenerateJwtSecret();
  fixProgramDebugUtils();
  fixPerformanceMonitor();
  fixAdmin();
  fixSchedulingRouter();
  
  console.log('\n✅ Critical parsing error fixes completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Run ESLint to check remaining errors');
  console.log('2. Fix any remaining issues manually');
  console.log('3. Test the application');
}

if (require.main === module) {
  main();
}

module.exports = { 
  fixDstExample, 
  fixGenerateJwtSecret, 
  fixProgramDebugUtils, 
  fixPerformanceMonitor, 
  fixAdmin, 
  fixSchedulingRouter 
};
