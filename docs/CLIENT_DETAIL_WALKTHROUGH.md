# Client Detail Page — First-Time Walkthrough

## Goal

Guide first-time users to the correct navigation flow (plan by day → click a day → drag from right rail) without simplifying or removing features. No blocking modals, no multi-step tour. Subtle, professional, popped-out card style.

## Tooltip Anchors & Copy

### 1. Calendar intro (where to start)

- **Anchor:** Own row below the "Calendar View" heading. Only on the **Overview** tab.
- **Copy:** _"Plan this client's training by day. Click a day to select it, then assign from the right."_
- **Don't show again:** Persisted per user via `dismissedClientDetailHints` in UserSettings.

### 2. Dock / drag hint

- **Anchor:** Own row above the Calendar Legend, left-aligned. Shown only when the **right dock is open** and **desktop**.
- **Copy:** _"Drag a program or routine onto a calendar day to assign it."_
- **Don't show again:** Same persistence; hint id `dock_drag`.

## Implementation

- **Component:** `ClientDetailWalkthroughHint` — popped-out card (shadow, elevated background, subtle border), max-width 320px, "Don't show again" link.
- **Schema:** `UserSettings.dismissedClientDetailHints` (JSON array of hint IDs).
- **API:** `settings.dismissClientDetailHint({ hintId })` appends and saves; `settings.getSettings()` returns the list.
- **Hint IDs:** `calendar_intro`, `dock_drag`.
