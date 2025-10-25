/**
 * Restore Console Fixes Script
 * Safely restores console statements that were broken by the cleanup script
 */

const fs = require("fs");
const path = require("path");

// Files that need console statements restored
const filesToRestore = [
  "src/lib/dst-example.ts",
  "src/lib/generate-jwt-secret.ts",
  "src/lib/program-debug-utils.ts",
  "src/lib/performance-monitor.ts",
  "src/trpc/admin.ts",
  "src/trpc/routers/scheduling.router.ts",
  "src/trpc/routers/analytics.router.ts",
  "src/trpc/routers/clientRouter.router.ts",
  "src/trpc/routers/clients.router.ts",
  "src/trpc/routers/library.router.ts",
  "src/trpc/routers/messaging.router.ts",
  "src/trpc/routers/programs.router.ts",
  "src/trpc/routers/routines.router.ts",
  "src/trpc/routers/workouts.router.ts",
];

function restoreConsoleStatements(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    // Fix broken console.log statements
    const consoleLogFixes = [
      {
        pattern:
          /\/\/ Debug logging removed for production\n\s*console\.log\(/g,
        replacement: "console.log(",
      },
      {
        pattern: /\/\/ Debug logging removed for production\n\s*`/g,
        replacement: "`",
      },
      {
        pattern: /\/\/ Debug logging removed for production\n\s*\)/g,
        replacement: ")",
      },
      {
        pattern: /\/\/ Debug logging removed for production\n\s*;/g,
        replacement: ";",
      },
    ];

    // Fix broken template literals
    const templateLiteralFixes = [
      {
        pattern: /\/\/ Debug logging removed for production\n\s*`([^`]*)`/g,
        replacement: "`$1`",
      },
      {
        pattern:
          /\/\/ Debug logging removed for production\n\s*console\.log\(\s*`([^`]*)`/g,
        replacement: "console.log(`$1`",
      },
    ];

    // Apply console.log fixes
    consoleLogFixes.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    // Apply template literal fixes
    templateLiteralFixes.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    // Fix broken try-catch blocks
    const tryCatchFixes = [
      {
        pattern: /\/\/ Debug logging removed for production\n\s*}\s*catch/g,
        replacement: "} catch",
      },
      {
        pattern: /\/\/ Debug logging removed for production\n\s*}\s*finally/g,
        replacement: "} finally",
      },
    ];

    tryCatchFixes.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Restored: ${filePath}`);
    } else {
      console.log(`ℹ️  No fixes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error restoring ${filePath}:`, error.message);
  }
}

function main() {
  console.log("🔧 Restoring console statements...\n");

  filesToRestore.forEach(file => {
    console.log(`📁 Processing: ${file}`);
    restoreConsoleStatements(file);
  });

  console.log("\n✅ Console statement restoration completed!");
  console.log("\n📋 Next steps:");
  console.log("1. Run ESLint to check remaining errors");
  console.log("2. Test the application");
  console.log("3. Consider a more careful console cleanup approach");
}

if (require.main === module) {
  main();
}

module.exports = { restoreConsoleStatements };
