/**
 * Main tRPC Router (Refactored)
 *
 * This file merges all domain-specific routers into a single appRouter.
 *
 * MIGRATION COMPLETE:
 * - Extracted 21 routers from 14,324 lines into manageable domain files
 * - All existing API calls remain unchanged
 * - Type safety preserved
 *
 * Original file backed up at: src/trpc/index.backup.ts
 */

import { router } from "./trpc";
import { adminRouter } from "./admin";

// Import all domain routers
import {
  authCallbackRouter,
  authCallbackProcedure,
} from "./routers/auth.router";
import { userRouter } from "./routers/user.router";
import { clientsRouter } from "./routers/clients.router";
import { libraryRouter } from "./routers/library.router";
import { messagingRouter } from "./routers/messaging.router";
import { workoutsRouter } from "./routers/workouts.router";
import { progressRouter } from "./routers/progress.router";
import { eventsRouter } from "./routers/events.router";
import { workoutTemplatesRouter } from "./routers/workoutTemplates.router";
import { schedulingRouter } from "./routers/scheduling.router";
import { programsRouter } from "./routers/programs.router";
import { routinesRouter } from "./routers/routines.router";
import { notificationsRouter } from "./routers/notifications.router";
import { libraryResourcesRouter } from "./routers/libraryResources.router";
import { analyticsRouter } from "./routers/analytics.router";
import { analyticsGoalsRouter } from "./routers/analyticsGoals.router";
import { settingsRouter } from "./routers/settings.router";
import { videosRouter } from "./routers/videos.router";
import { clientRouterRouter } from "./routers/clientRouter.router";
import { timeSwapRouter } from "./routers/timeSwap.router";
import { utilsRouter } from "./routers/utils.router";
import { organizationRouter } from "./routers/organization.router";
import { sidebarRouter } from "./routers/sidebar.router";
import { blockedTimesRouter } from "./routers/blockedTimes.router";

/**
 * Merge all routers together
 *
 * All existing tRPC calls remain unchanged:
 * - trpc.user.getProfile.useQuery()
 * - trpc.clients.list.useQuery()
 * - trpc.programs.create.mutate()
 * etc.
 */
export const appRouter = router({
  // Auth callback
  authCallback: authCallbackProcedure,

  // Domain routers
  user: userRouter,
  clients: clientsRouter,
  library: libraryRouter,
  messaging: messagingRouter,
  workouts: workoutsRouter,
  progress: progressRouter,
  events: eventsRouter,
  workoutTemplates: workoutTemplatesRouter,
  scheduling: schedulingRouter,
  programs: programsRouter,
  routines: routinesRouter,
  notifications: notificationsRouter,
  libraryResources: libraryResourcesRouter,
  analytics: analyticsRouter,
  analyticsGoals: analyticsGoalsRouter,
  settings: settingsRouter,
  videos: videosRouter,
  clientRouter: clientRouterRouter,
  timeSwap: timeSwapRouter,
  utils: utilsRouter,
  organization: organizationRouter,
  sidebar: sidebarRouter,
  blockedTimes: blockedTimesRouter,

  // Admin router
  admin: adminRouter,
});

// Export type definition for client-side usage
export type AppRouter = typeof appRouter;
