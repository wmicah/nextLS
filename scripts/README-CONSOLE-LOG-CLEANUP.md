# Safe Console.log Removal Script

## 🛡️ Safety First

This script is designed to **ONLY remove console.logs that are clearly safe to remove**. It uses conservative patterns to avoid breaking your code.

## ✅ What It Removes

The script will remove console.logs that match these patterns:
- 🔍 Emoji debug logs (`console.log("🔍 Debug info:")`)
- ✅ Success emoji logs (`console.log("✅ Success:")`)
- ⚠️ Warning emoji logs (`console.log("⚠️ Warning:")`)
- 📊 Stats emoji logs
- Logs containing "Debug", "DEBUG", or "debug" in the message
- Other common debug emoji patterns

## ❌ What It Keeps (Safe)

The script will **NOT remove**:
- `console.error()` - Always kept
- `console.warn()` - Always kept
- Logs in catch blocks - Might be important
- Logs mentioning "error", "Error", "exception", "fail" - Too risky
- Logs that are part of if conditions or return statements
- Any log that might affect program logic

## 🚀 Usage

### Step 1: Dry Run (See what will be removed)
```bash
npm run cleanup:logs
```

This shows you what will be removed **without making any changes**.

### Step 2: Verbose Mode (See details)
```bash
npm run cleanup:logs:verbose
```

This shows each file and each log that will be removed.

### Step 3: Execute (Actually remove them)
```bash
npm run cleanup:logs:execute
```

This will:
1. Create `.backup` files for each modified file
2. Remove the safe console.logs
3. Generate a summary report

## 📊 Output

The script creates `console-log-removal-summary.json` with:
- Files processed
- Files modified
- Total logs removed
- List of changes

## 🔄 Recovery

If something breaks:
1. Find the `.backup` file (e.g., `MyFile.tsx.backup`)
2. Restore it: `cp MyFile.tsx.backup MyFile.tsx`
3. Or use git: `git checkout MyFile.tsx`

## ⚠️ Important Notes

1. **Test after running** - Always test your application after cleanup
2. **Review the summary** - Check `console-log-removal-summary.json`
3. **Keep backups** - The script creates backups, but you can also commit before running
4. **Incremental** - You can run it multiple times safely

## 🎯 Recommended Workflow

1. **Commit your current work**
   ```bash
   git add .
   git commit -m "Before console.log cleanup"
   ```

2. **Run dry run first**
   ```bash
   npm run cleanup:logs:verbose
   ```

3. **Review the output** - Make sure it looks safe

4. **Execute**
   ```bash
   npm run cleanup:logs:execute
   ```

5. **Test your application** - Make sure everything works

6. **If something breaks** - Restore from backup or git

## 📝 Example Output

```
🔍 Safe Console.log Removal Script
==================================

⚠️  DRY RUN MODE - No files will be modified
   Use --execute to actually remove logs

📁 Found 92 source files

📝 src/components/ClientsPage.tsx
   Removed 18 console.log(s)
📝 src/trpc/routers/clientRouter.router.ts
   Removed 17 console.log(s)

==================================
✅ Processed 92 files
📊 Found 15 files with removable logs
🗑️  Total console.logs to remove: 420

💡 Run with --execute to apply changes
```

## 🔧 Customization

If you want to adjust what gets removed, edit `scripts/safe-remove-console-logs.js`:
- `SAFE_TO_REMOVE_PATTERNS` - Add patterns for logs to remove
- `KEEP_PATTERNS` - Add patterns for logs to keep
- `SKIP_FILES` - Files to skip entirely

