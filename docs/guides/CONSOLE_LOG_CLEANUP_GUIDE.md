# Console.log Cleanup Guide

## ✅ What We've Done

We've created a proper logging system that:
- **Hides debug logs from users** in production
- **Still captures important info** via monitoring service
- **Keeps development debugging** when needed

## 📊 Progress

- **Removed**: ~391 console.log statements
- **Remaining**: ~662 console.log statements across 92 files
- **Status**: No functionality broken, no linting errors

## 🔧 How to Use the New Logger

### Import the Logger

```typescript
import { debugLog, infoLog, warnLog, errorLog } from "@/lib/debug-logger";
```

### Replace console.log

**Before:**
```typescript
console.log("User clicked button", { userId, buttonId });
console.log("🔍 Debug info:", data);
```

**After:**
```typescript
// For temporary debugging (will be removed later)
debugLog("User clicked button", { userId, buttonId });

// For important events to track
infoLog("Client request accepted", { clientId, coachId });

// For warnings
warnLog("Large payload detected", { size: payloadSize });
```

### When to Use Each Function

1. **`debugLog()`** - Temporary debugging you plan to remove
   - Development: Shows in console
   - Production: Silently captured, no console output

2. **`infoLog()`** - Important events to track
   - Development: Shows in console
   - Production: Captured via monitoring service

3. **`warnLog()`** - Warnings that should be tracked
   - Development: Shows as warning
   - Production: Captured via monitoring service

4. **`errorLog()`** - Non-critical errors
   - For critical errors, still use `console.error` or throw `Error`

## 🎯 Next Steps

### Files with Most console.logs (Priority Order)

1. **`src/trpc/routers/clientRouter.router.ts`** - 91 console.logs
2. **`src/components/SeamlessRoutineModal.tsx`** - 83 console.logs
3. **`src/components/ProgramBuilder.tsx`** - 30 console.logs
4. **`src/lib/complete-email-service.ts`** - 29 console.logs
5. **`src/lib/lesson-reminder-service.ts`** - 23 console.logs

### Quick Replacement Pattern

```typescript
// Find and replace in your editor:
// Find: console.log(
// Replace with: debugLog(

// Then add import at top:
import { debugLog } from "@/lib/debug-logger";
```

## ⚠️ Important Notes

- **Keep `console.error`** for actual errors - those are fine
- **Remove temporary debug logs** entirely if not needed
- **Use `infoLog`** for events you want to track in production
- **Test after changes** to ensure nothing breaks

## 🔍 Finding Remaining console.logs

```bash
# Count remaining console.logs
grep -r "console\.log" src --count

# List files with console.logs
grep -r "console\.log" src -l
```

## ✅ Benefits

1. **Cleaner Production**: Users don't see debug output
2. **Better Monitoring**: Important events captured via monitoring service
3. **Easier Debugging**: Can still debug in development
4. **Professional**: No console spam in production

