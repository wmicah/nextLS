/**
 * Console Cleanup Script
 * Systematically removes development console statements from the codebase
 */

const fs = require("fs");
const path = require("path");

// Files to process
const filesToProcess = ["src/components", "src/lib", "src/app", "src/trpc"];

// Console patterns to remove (development debug logs)
const patternsToRemove = [
  /console\.log\([^)]*\);?\s*/g,
  /console\.debug\([^)]*\);?\s*/g,
  /console\.info\([^)]*\);?\s*/g,
];

// Console patterns to replace with proper logging
const patternsToReplace = [
  {
    pattern: /console\.error\(([^)]*)\);?/g,
    replacement: "// Error logging removed - use proper error handling",
  },
  {
    pattern: /console\.warn\(([^)]*)\);?/g,
    replacement: "// Warning logging removed - use proper logging service",
  },
];

// Files to skip (already processed or special cases)
const filesToSkip = ["node_modules", ".next", "dist", "build", "coverage"];

function shouldSkipFile(filePath) {
  return filesToSkip.some(skip => filePath.includes(skip));
}

function processFile(filePath) {
  if (shouldSkipFile(filePath)) return;

  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    // Remove development debug logs
    patternsToRemove.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(
          pattern,
          "// Debug logging removed for production\n"
        );
        modified = true;
      }
    });

    // Replace error/warning logs
    patternsToReplace.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Cleaned: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  if (shouldSkipFile(dirPath)) return;

  try {
    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        processDirectory(fullPath);
      } else if (
        stat.isFile() &&
        (item.endsWith(".ts") ||
          item.endsWith(".tsx") ||
          item.endsWith(".js") ||
          item.endsWith(".jsx"))
      ) {
        processFile(fullPath);
      }
    });
  } catch (error) {
    console.error(`❌ Error processing directory ${dirPath}:`, error.message);
  }
}

function main() {
  console.log("🧹 Starting console cleanup...\n");

  filesToProcess.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`📁 Processing directory: ${dir}`);
      processDirectory(dir);
    } else {
      console.log(`⚠️  Directory not found: ${dir}`);
    }
  });

  console.log("\n✅ Console cleanup completed!");
  console.log("\n📋 Next steps:");
  console.log("1. Review the changes");
  console.log("2. Test the application");
  console.log("3. Run ESLint to check for remaining issues");
  console.log("4. Commit the changes");
}

if (require.main === module) {
  main();
}

module.exports = { processFile, processDirectory };
