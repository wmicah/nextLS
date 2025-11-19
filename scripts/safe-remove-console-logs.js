/**
 * Safe Console.log Removal Script
 * 
 * This script safely removes console.log statements that won't break functionality.
 * It's conservative and only removes clearly safe console.logs.
 * 
 * Safety rules:
 * - Only removes standalone console.log() calls
 * - Keeps console.error, console.warn, console.info
 * - Skips console.logs in conditionals, returns, assignments
 * - Skips console.logs that are part of expressions
 * - Creates backup before making changes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to process
const SRC_DIR = path.join(__dirname, '..', 'src');
const BACKUP_DIR = path.join(__dirname, '..', '.backup-console-logs');

// Statistics
const stats = {
  filesProcessed: 0,
  logsRemoved: 0,
  logsSkipped: 0,
  errors: 0,
};

/**
 * Check if a console.log is safe to remove
 * Returns true if it's a standalone statement that can be safely removed
 */
function isSafeToRemove(line, index, lines) {
  const trimmed = line.trim();
  
  // Skip if it's not a console.log
  if (!trimmed.includes('console.log')) {
    return false;
  }
  
  // Skip console.error, console.warn, console.info, etc.
  if (trimmed.match(/console\.(error|warn|info|debug|table|dir|trace)/)) {
    return false;
  }
  
  // Skip if it's part of a conditional (if, else, while, for, etc.)
  const prevLine = index > 0 ? lines[index - 1].trim() : '';
  if (prevLine.match(/^\s*(if|else|while|for|switch|case|catch)\s*\(/)) {
    return false;
  }
  
  // Skip if it's part of a return statement
  if (trimmed.startsWith('return') && trimmed.includes('console.log')) {
    return false;
  }
  
  // Skip if it's assigned to a variable
  if (trimmed.match(/^\s*(const|let|var)\s+\w+\s*=\s*console\.log/)) {
    return false;
  }
  
  // Skip if it's part of a ternary or expression
  if (trimmed.includes('?') || trimmed.includes(':')) {
    return false;
  }
  
  // Only remove if it's a standalone console.log statement
  // Pattern: console.log(...) or console.log(...);
  if (trimmed.match(/^\s*console\.log\s*\(/)) {
    // Check if it's properly closed (has semicolon or is multiline)
    const isMultiline = trimmed.includes('\n') || !trimmed.endsWith(';');
    const nextLines = lines.slice(index + 1);
    let fullStatement = trimmed;
    let braceCount = (fullStatement.match(/\(/g) || []).length - (fullStatement.match(/\)/g) || []).length;
    
    // If multiline, check if it's complete
    if (braceCount > 0) {
      for (let i = 0; i < nextLines.length && braceCount > 0; i++) {
        fullStatement += nextLines[i];
        braceCount += (nextLines[i].match(/\(/g) || []).length - (nextLines[i].match(/\)/g) || []).length;
        if (braceCount === 0 && nextLines[i].includes(';')) {
          break;
        }
      }
    }
    
    return true;
  }
  
  return false;
}

/**
 * Remove safe console.log statements from a file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    let removedCount = 0;
    let skippedCount = 0;
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      if (isSafeToRemove(line, i, lines)) {
        // Check if it's a multiline console.log
        let braceCount = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
        let isMultiline = braceCount > 0;
        
        if (isMultiline) {
          // Skip the console.log line
          removedCount++;
          i++;
          
          // Skip continuation lines until we find the closing
          while (i < lines.length && braceCount > 0) {
            braceCount += (lines[i].match(/\(/g) || []).length - (lines[i].match(/\)/g) || []).length;
            if (braceCount === 0 && lines[i].includes(';')) {
              i++; // Skip the closing line
              break;
            }
            i++;
          }
          continue;
        } else {
          // Single line console.log - just skip it
          removedCount++;
          i++;
          continue;
        }
      } else if (line.includes('console.log')) {
        // It's a console.log but not safe to remove
        skippedCount++;
        newLines.push(line);
        i++;
      } else {
        // Regular line - keep it
        newLines.push(line);
        i++;
      }
    }
    
    // Only write if we removed something
    if (removedCount > 0) {
      const newContent = newLines.join('\n');
      fs.writeFileSync(filePath, newContent, 'utf8');
      stats.logsRemoved += removedCount;
      stats.logsSkipped += skippedCount;
      return { removed: removedCount, skipped: skippedCount };
    }
    
    return { removed: 0, skipped: skippedCount };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    stats.errors++;
    return null;
  }
}

/**
 * Find all TypeScript/JavaScript files
 */
function findSourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!['node_modules', '.next', 'dist', 'build', '.git', 'coverage'].includes(file)) {
        findSourceFiles(filePath, fileList);
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/) && !file.match(/\.(test|spec)\./)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Create backup
 */
function createBackup() {
  if (fs.existsSync(BACKUP_DIR)) {
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  
  console.log('📦 Creating backup...');
  execSync(`xcopy /E /I /Y "${SRC_DIR}" "${path.join(BACKUP_DIR, 'src')}"`, { stdio: 'ignore' });
  console.log('✅ Backup created at:', BACKUP_DIR);
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Safe Console.log Removal Script');
  console.log('=====================================\n');
  
  // Create backup first
  createBackup();
  
  // Find all source files
  console.log('📂 Finding source files...');
  const files = findSourceFiles(SRC_DIR);
  console.log(`Found ${files.length} files to process\n`);
  
  // Process each file
  console.log('🧹 Removing safe console.log statements...\n');
  
  const results = [];
  
  files.forEach(file => {
    const relativePath = path.relative(SRC_DIR, file);
    const result = processFile(file);
    
    if (result && result.removed > 0) {
      stats.filesProcessed++;
      results.push({
        file: relativePath,
        removed: result.removed,
        skipped: result.skipped,
      });
      console.log(`✅ ${relativePath}: Removed ${result.removed} console.log(s)`);
    }
  });
  
  // Print summary
  console.log('\n=====================================');
  console.log('📊 Summary:');
  console.log(`   Files processed: ${stats.filesProcessed}`);
  console.log(`   Console.logs removed: ${stats.logsRemoved}`);
  console.log(`   Console.logs skipped (unsafe): ${stats.logsSkipped}`);
  console.log(`   Errors: ${stats.errors}`);
  console.log(`\n💾 Backup location: ${BACKUP_DIR}`);
  console.log('\n✅ Done! Review the changes and test your application.');
  console.log('   If something breaks, restore from backup.');
}

// Run the script
main();
