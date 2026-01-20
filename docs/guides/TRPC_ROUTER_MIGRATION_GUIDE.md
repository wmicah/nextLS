# 🔧 tRPC Router Migration Guide

## Goal
Split the 14,321-line `src/trpc/index.ts` into maintainable domain routers **without breaking any existing code**.

---

## ✅ Migration Strategy

### Phase 1: Setup (1 hour)
- [x] Create `src/trpc/routers/` folder
- [x] Create example routers (`user.router.ts`, `client.router.ts`)
- [x] Create new merged `index.new.ts`

### Phase 2: Incremental Migration (1-2 weeks)
Migrate **one domain at a time**, testing after each:

1. **User Router** ✅ (Example created)
2. **Client Router** ✅ (Example created)
3. Program Router
4. Messaging Router
5. Scheduling Router
6. Analytics Router
7. Video Router
8. Notification Router
9. Library Router
10. Routine Router
11. TimeSwap Router
12. Client-specific Router (clientRouter)

### Phase 3: Cutover (1 day)
- Verify all routers are migrated
- Rename `index.ts` to `index.old.ts` (backup)
- Rename `index.new.ts` to `index.ts`
- Test everything
- Delete `index.old.ts` after 1 week

---

## 📋 How to Migrate Each Domain

### Template for New Router

```typescript
// src/trpc/routers/DOMAIN.router.ts
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";

/**
 * DOMAIN Router
 * Brief description of what this router handles
 */
export const domainRouter = router({
  // Copy procedures from index.ts here
  procedureName: publicProcedure
    .input(z.object({ /* ... */ }))
    .query(async ({ input }) => {
      // Implementation
    }),
  
  // ... more procedures
});
```

### Step-by-Step Migration Process

#### 1. Create the Router File
```bash
# Create new file
touch src/trpc/routers/program.router.ts
```

#### 2. Copy the Procedures
Open `src/trpc/index.ts` and find all procedures for that domain:

**For Programs:**
- `programs.list`
- `programs.getById`
- `programs.create`
- `programs.update`
- `programs.delete`
- `programs.assignToClients`
- `programs.getAssignments`
- etc.

**Copy them to the new router file.**

#### 3. Update the Export
```typescript
// src/trpc/routers/program.router.ts
export const programRouter = router({
  list: publicProcedure.query(async () => { /* ... */ }),
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => { /* ... */ }),
  create: publicProcedure.input(/* ... */).mutation(async ({ input }) => { /* ... */ }),
  // ... etc
});
```

#### 4. Add to Main Router
```typescript
// src/trpc/index.new.ts
import { programRouter } from "./routers/program.router";

export const appRouter = router({
  user: userRouter,
  clients: clientRouter,
  programs: programRouter, // ← Add this
  // ...
});
```

#### 5. Test the Migration
```bash
# Start dev server
pnpm dev

# In another terminal, test the endpoints
# Visit pages that use these procedures
# Check browser console for errors
```

#### 6. Verify TypeScript Types
```typescript
// In any component
import { trpc } from "@/app/_trpc/client";

// This should have full type safety
const { data } = trpc.programs.list.useQuery();
//                      ^? Should autocomplete
```

---

## 🗺️ Domain Router Mapping

Here's what to extract from the current `index.ts`:

### 1. User Router (`user.router.ts`)
**Procedures:**
- `user.getProfile`
- `user.updateProfile`
- `user.updateWorkingHours`
- `user.deleteAccount`
- `user.checkRole`
- `user.setRole`

**Status:** ✅ Created

---

### 2. Client Router (`client.router.ts`)
**Procedures:**
- `clients.list`
- `clients.getById`
- `clients.create`
- `clients.update`
- `clients.archive`
- `clients.unarchive`
- `clients.delete`
- `clients.search`

**Status:** ✅ Created

---

### 3. Program Router (`program.router.ts`)
**Procedures:**
- `programs.list`
- `programs.getById`
- `programs.create`
- `programs.update`
- `programs.delete`
- `programs.duplicate`
- `programs.assignToClients`
- `programs.getAssignments`
- `programs.updateAssignment`
- `programs.getClientPrograms`
- `programs.getClientProgramDetails`
- `programs.markDrillComplete`
- `programs.unmarkDrillComplete`
- `programs.getWeeklyProgramView`

**Status:** ⏳ To Do

---

### 4. Messaging Router (`messaging.router.ts`)
**Procedures:**
- `messaging.getConversations`
- `messaging.getMessages`
- `messaging.sendMessage`
- `messaging.markAsRead`
- `messaging.markAllAsRead`
- `messaging.createConversationWithClient`
- `messaging.deleteConversation`
- `messaging.getUnreadCount`
- `messaging.getConversationUnreadCounts`
- `messaging.acknowledgeMessage`

**Status:** ⏳ To Do

---

### 5. Scheduling Router (`scheduling.router.ts`)
**Procedures:**
- `scheduling.getCoachSchedule`
- `scheduling.getClientSchedule`
- `scheduling.scheduleLesson`
- `scheduling.updateLesson`
- `scheduling.cancelLesson`
- `scheduling.confirmLesson`
- `scheduling.declineLesson`
- `scheduling.getAvailableTimeSlots`

**Status:** ⏳ To Do

---

### 6. Events Router (`events.router.ts`)
**Procedures:**
- `events.getUpcoming`
- `events.create`
- `events.update`
- `events.delete`
- `events.updateStatus`

**Status:** ⏳ To Do

---

### 7. Analytics Router (`analytics.router.ts`)
**Procedures:**
- `analytics.getDashboardData`
- `analytics.getClientProgress`
- `analytics.getProgramPerformance`
- `analytics.getEngagementMetrics`
- `analytics.updateGoals`

**Status:** ⏳ To Do

---

### 8. Video Router (`video.router.ts`)
**Procedures:**
- `videos.list`
- `videos.getById`
- `videos.create`
- `videos.update`
- `videos.delete`
- `videos.createAnnotation`
- `videos.getAnnotations`
- `videos.deleteAnnotation`
- `videos.createAudioNote`
- `videos.deleteAudioNote`
- `videos.createFeedback`
- `videos.deleteFeedback`
- `videos.createScreenRecording`
- `videos.getScreenRecordings`
- `videos.deleteScreenRecording`

**Status:** ⏳ To Do

---

### 9. Library Router (`library.router.ts`)
**Procedures:**
- `library.list`
- `library.getById`
- `library.create`
- `library.update`
- `library.delete`
- `library.importYouTube`
- `library.importYouTubePlaylist`
- `library.assignVideoToClient`
- `library.getAssignedVideos`
- `library.markVideoComplete`
- `library.getCategories`

**Status:** ⏳ To Do

---

### 10. Notification Router (`notification.router.ts`)
**Procedures:**
- `notifications.getNotifications`
- `notifications.getUnreadCount`
- `notifications.markAsRead`
- `notifications.markAllAsRead`
- `notifications.deleteNotification`
- `notifications.deleteAll`

**Status:** ⏳ To Do

---

### 11. Routine Router (`routine.router.ts`)
**Procedures:**
- `routines.list`
- `routines.getById`
- `routines.create`
- `routines.update`
- `routines.delete`
- `routines.duplicate`
- `routines.assignToClient`
- `routines.getAssignments`

**Status:** ⏳ To Do

---

### 12. TimeSwap Router (`timeswap.router.ts`)
**Procedures:**
- `timeSwap.getAvailableClients`
- `timeSwap.getClientEvents`
- `timeSwap.createSwapRequest`
- `timeSwap.createSwapRequestFromLesson`
- `timeSwap.getSwapRequests`
- `timeSwap.approveSwapRequest`
- `timeSwap.declineSwapRequest`

**Status:** ⏳ To Do

---

### 13. Client Router (`clientRouter.router.ts`)
**Note:** There's a separate `clientRouter` for client-specific endpoints
**Procedures:**
- `clientRouter.getNextLesson`
- `clientRouter.getCoachNotes`
- `clientRouter.getVideoAssignments`
- `clientRouter.submitVideoForDrill`
- `clientRouter.getClientUpcomingLessons`

**Status:** ⏳ To Do

---

### 14. Workouts Router (`workouts.router.ts`)
**Procedures:**
- `workouts.getTodaysWorkouts`
- `workouts.debugWorkouts`
- `workouts.markComplete`

**Status:** ⏳ To Do

---

## 🧪 Testing Strategy

### After Each Router Migration:

#### 1. Type Check
```bash
pnpm type-check
```
If this passes, **you haven't broken any client code** 🎉

#### 2. Dev Server Test
```bash
pnpm dev
```
Navigate to pages that use the migrated procedures.

#### 3. Manual Testing Checklist
- [ ] Page loads without errors
- [ ] Data fetches correctly
- [ ] Mutations work (create/update/delete)
- [ ] Loading states work
- [ ] Error handling works
- [ ] Type autocomplete works in VSCode

#### 4. Run Tests (if they exist)
```bash
pnpm test
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot find module"
**Cause:** Import path is wrong  
**Fix:**
```typescript
// ❌ Wrong
import { router } from "./trpc";

// ✅ Correct (from inside /routers/)
import { router } from "../trpc";
```

### Issue 2: "Type 'X' is not assignable"
**Cause:** Router structure doesn't match expected structure  
**Fix:** Make sure your router export matches:
```typescript
export const domainRouter = router({
  procedureName: publicProcedure...
});
```

### Issue 3: "trpc.domain.procedure is not a function"
**Cause:** Forgot to add router to main appRouter  
**Fix:** Add to `index.new.ts`:
```typescript
export const appRouter = router({
  domain: domainRouter, // ← Add this
});
```

### Issue 4: Procedures are nested twice
**❌ Wrong:**
```typescript
// This creates: trpc.domain.domain.procedure
export const appRouter = router({
  domain: router({
    domain: domainRouter,
  }),
});

// ✅ Correct:
export const appRouter = router({
  domain: domainRouter,
});
```

---

## 📊 Migration Progress Tracker

Create a checklist to track progress:

```markdown
## Router Migration Progress

- [x] Setup router structure
- [x] User Router (6 procedures)
- [x] Client Router (8 procedures)
- [ ] Program Router (~15 procedures)
- [ ] Messaging Router (~10 procedures)
- [ ] Scheduling Router (~7 procedures)
- [ ] Events Router (~5 procedures)
- [ ] Analytics Router (~5 procedures)
- [ ] Video Router (~15 procedures)
- [ ] Library Router (~12 procedures)
- [ ] Notification Router (~6 procedures)
- [ ] Routine Router (~8 procedures)
- [ ] TimeSwap Router (~7 procedures)
- [ ] ClientRouter (~5 procedures)
- [ ] Workouts Router (~3 procedures)

**Total Estimated Procedures:** ~107
**Completed:** 14 (13%)
**Remaining:** 93 (87%)
```

---

## 🎯 Benefits After Migration

### Before:
```
src/trpc/index.ts - 14,321 lines 😱
```

### After:
```
src/trpc/
├── index.ts (50 lines) ← Just imports and merges
├── admin.ts (470 lines)
└── routers/
    ├── user.router.ts (150 lines)
    ├── client.router.ts (250 lines)
    ├── program.router.ts (400 lines)
    ├── messaging.router.ts (300 lines)
    ├── scheduling.router.ts (250 lines)
    ├── analytics.router.ts (200 lines)
    ├── video.router.ts (400 lines)
    ├── library.router.ts (350 lines)
    ├── notification.router.ts (180 lines)
    ├── routine.router.ts (250 lines)
    ├── timeswap.router.ts (220 lines)
    ├── clientRouter.router.ts (180 lines)
    └── workouts.router.ts (120 lines)
```

### Improvements:
✅ **Maintainability:** Easy to find and modify specific domains  
✅ **Collaboration:** Multiple devs can work on different routers  
✅ **Testing:** Can unit test individual routers  
✅ **Performance:** Faster IDE performance (no 14K line file)  
✅ **Clarity:** Clear separation of concerns  
✅ **Scalability:** Easy to add new domains  

---

## 🚀 Quick Start Commands

```bash
# 1. Create your first router
code src/trpc/routers/program.router.ts

# 2. Copy procedures from index.ts (search for "programs.")

# 3. Add to index.new.ts
# import { programRouter } from "./routers/program.router";
# programs: programRouter,

# 4. Test
pnpm dev
pnpm type-check

# 5. Commit
git add src/trpc/routers/program.router.ts
git add src/trpc/index.new.ts
git commit -m "refactor(trpc): migrate programs router"
```

---

## 📝 Final Cutover Checklist

When all routers are migrated:

- [ ] All procedures have been moved to domain routers
- [ ] `pnpm type-check` passes
- [ ] `pnpm test` passes
- [ ] Manual testing of all major features passes
- [ ] Create backup: `cp src/trpc/index.ts src/trpc/index.old.ts`
- [ ] Rename: `mv src/trpc/index.new.ts src/trpc/index.ts`
- [ ] Test production build: `pnpm build`
- [ ] Deploy to staging
- [ ] Test in staging
- [ ] Deploy to production
- [ ] Monitor for errors (24 hours)
- [ ] Delete backup: `rm src/trpc/index.old.ts`

---

## 💡 Pro Tips

1. **Migrate in Order of Complexity:** Start with simple routers (user, client) before tackling complex ones (programs, videos)

2. **Commit After Each Router:** Makes it easy to rollback if something breaks

3. **Keep index.ts Until Done:** Don't delete the old file until ALL routers are migrated and tested

4. **Use Git Branches:**
   ```bash
   git checkout -b refactor/split-trpc-routers
   # Do migrations
   git push origin refactor/split-trpc-routers
   # Create PR for review
   ```

5. **Document as You Go:** Add JSDoc comments explaining complex procedures

6. **Test on Staging First:** Don't deploy router refactors directly to production

---

## 🆘 Need Help?

If you run into issues:

1. Check the TypeScript errors first
2. Verify import paths are correct
3. Make sure the router is added to `appRouter`
4. Test with a simple query first
5. Check browser console for runtime errors
6. Verify the procedure name matches the old structure

Remember: **TypeScript will catch almost all breaking changes at compile time!**


