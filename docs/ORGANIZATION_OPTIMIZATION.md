# Organization Area Performance Optimization

## Problem Identified

The organization area was making **redundant database queries** that were hammering the database and causing connection issues.

### The Issues:

1. **7 simultaneous queries for the same data** - Every component was independently calling `trpc.organization.get.useQuery()`:
   - OrganizationSidebar
   - OrganizationOverviewContent
   - OrganizationLibraryView
   - OrganizationCalendarView
   - OrganizationResourcesView
   - OrganizationTeamView
   - OrganizationClientsView

2. **Constant refetching** - `getPendingInvitations` had:
   - `refetchOnMount: true` - Refetch every time component mounts
   - `refetchOnWindowFocus: true` - Refetch every time window gets focus

3. **No caching** - All queries had default settings (30 seconds stale time), causing frequent database hits

### Impact:
- Multiple database connections opened simultaneously
- Database connection pool exhaustion
- "Shutting down database connection" log spam
- Slow page loads
- Poor user experience

## Solution Applied

### 1. Added React Query Caching with `staleTime`

**Organization Data** (5 minutes cache):
```typescript
trpc.organization.get.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
});
```

**User Profile** (5 minutes cache):
```typescript
trpc.user.getProfile.useQuery(undefined, {
  staleTime: 5 * 60 * 1000,
});
```

**Shared Resources** (2 minutes cache):
```typescript
trpc.organization.getSharedResources.useQuery(undefined, {
  staleTime: 2 * 60 * 1000,
});
```

**Organization Library** (2 minutes cache):
```typescript
trpc.organization.getOrganizationLibrary.useQuery(undefined, {
  enabled: !!organization?.id,
  staleTime: 2 * 60 * 1000,
});
```

**Lessons Calendar** (30 seconds cache):
```typescript
trpc.organization.getOrganizationLessons.useQuery(
  { month, year },
  { staleTime: 30 * 1000 }
);
```

**Pending Invitations** (1 minute cache, no auto-refetch):
```typescript
trpc.organization.getPendingInvitations.useQuery(undefined, {
  staleTime: 1 * 60 * 1000,
  refetchOnMount: false,     // Don't refetch on every mount
  refetchOnWindowFocus: false, // Don't refetch on every focus
});
```

**Organization Invitations** (1 minute cache):
```typescript
trpc.organization.getOrganizationInvitations.useQuery(
  { organizationId },
  { 
    enabled: !!organization,
    staleTime: 1 * 60 * 1000,
  }
);
```

### 2. How React Query Caching Works

With `staleTime` set:
- **First component** that mounts makes the actual database query
- **All other components** that mount within the `staleTime` window use the cached data
- No additional database queries are made until the cache expires

### 3. Benefits

✅ **Reduced Database Load**: 7 queries → 1 query when navigating organization pages
✅ **Faster Page Loads**: Instant data from cache for subsequent views
✅ **No Connection Issues**: Prevents database connection pool exhaustion
✅ **Better UX**: Smoother navigation, no loading states when data is cached
✅ **Reduced Costs**: Fewer database queries = lower costs

## Cache Durations Explained

- **5 minutes** - Organization/User data (rarely changes)
- **2 minutes** - Library/Resources (changes occasionally)
- **1 minute** - Invitations (may change more frequently)
- **30 seconds** - Calendar lessons (users expect recent updates)

These durations can be adjusted based on your needs. The key is balancing:
- **Fresh data** (shorter cache)
- **Performance** (longer cache)

## Testing

After this optimization:
1. Navigate to `/organization` - Makes DB queries
2. Navigate to `/organization/library` - Uses cached org data, only queries library
3. Navigate to `/organization/calendar` - Uses cached org data, only queries lessons
4. Switch between pages - Instant, no DB queries until cache expires

## Future Improvements

If you want even better optimization:
1. Use React Context to share organization data from the layout
2. Implement optimistic updates for mutations
3. Add query invalidation on specific actions (e.g., after creating a resource)

