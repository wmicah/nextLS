# Design and Style Guide
## NextLevel Coaching - Design System Documentation

This document outlines the design system, styling guidelines, and best practices for NextLevel Coaching. Use this as a reference when creating new pages and components.

---

## 🎨 Color System

### Primary Accent: Golden Yellow
Our primary accent color is a warm, professional golden yellow that conveys energy, achievement, and coaching excellence.

**Color Constants** (defined in `src/lib/colors.ts`):
- **GOLDEN_ACCENT**: `#E5B232` - Primary accent color for buttons, links, active states
- **GOLDEN_HOVER**: `#F5C242` - Hover states and lighter accents
- **GOLDEN_DARK**: `#B1872E` - Darker variant for buttons needing more contrast
- **GOLDEN_BORDER**: `#3D2C10` - Ultra-subtle border shade for card borders

### Alert Colors
- **RED_ALERT**: `#D9534F` - Primary red for alerts, errors, missed items
- **RED_DARK**: `#A63A37` - Darker red for badges and backgrounds
- **RED_BORDER**: `#772C2A` - Red border/outline variant

### Success Colors
- **GREEN_PRIMARY**: `#70CF70` - Soft green for completed items, success states (reduced opacity for classy appearance)
- **GREEN_DARK**: `#3E8E41` - Darker green variant

### Background Colors
- **BACKGROUND_DARK**: `#15191a` - Main page background (darker than sidebar)
- **BACKGROUND_CARD**: `rgba(255, 255, 255, 0.02)` - Card background
- **BACKGROUND_CARD_HOVER**: `rgba(255, 255, 255, 0.04)` - Card hover state

### Border Colors
- **BORDER_SUBTLE**: `rgba(255, 255, 255, 0.1)` - Standard subtle borders
- **BORDER_ACCENT**: `rgba(229, 178, 50, 0.2)` - Accent borders with golden tint

### Text Colors
- **TEXT_PRIMARY**: `#F5F5F5` - Headlines and primary text
- **TEXT_SECONDARY**: `#B3B8C2` - Body text
- **TEXT_MUTED**: `#606364` - Secondary/muted text

### Usage Guidelines
- **Always import colors from `@/lib/colors`**: Use `COLORS.GOLDEN_ACCENT` instead of hardcoded hex values
- **Use helper functions for opacity**: `getGoldenAccent(0.12)` for rgba variations
- **Accent colors are permanent**: Don't use `hover:` classes for accent colors - they should always be visible
- **Golden yellow is the primary accent**: Use it for buttons, active states, important metrics, and visual highlights

---

## 🎯 Design Philosophy

### Core Principles

1. **Coaching-First Design**
   - This is not a generic SaaS - it's built specifically for coaches
   - Prioritize actionable information and workflows
   - Make accountability and client management central

2. **Dark, Professional Aesthetic**
   - Very dark backgrounds (`#15191a`) for reduced eye strain
   - Subtle card backgrounds with minimal opacity
   - Clean, uncluttered interfaces

3. **Subtle Accents, Maximum Impact**
   - Golden yellow accents are used sparingly but strategically
   - Left border accents (3px) on important section headers
   - Accent colors guide attention without overwhelming

4. **Information Hierarchy**
   - Most important items first (Needs Your Attention)
   - Clear visual separation between sections
   - Compact, scannable cards

5. **No Icon Clutter**
   - Icons removed from dashboard components for cleaner UI
   - Focus on text and data, not decorative elements
   - Icons only where they add functional value

---

## 📐 Layout Patterns

### Dashboard Structure

**Top Row (70% / 30% split)**:
- Week at a Glance (70%) - Primary calendar view
- Today's Schedule (30%) - Compact daily schedule

**Middle Row (60% / 40% split)**:
- Needs Your Attention (60%) - Actionable items
- Recent Client Activity (40%) - Activity feed

**Bottom Row (Full width)**:
- Quick Stats - 2x2 grid of metric cards

### Card Patterns

**Standard Card**:
```tsx
<div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
  {/* Content */}
</div>
```

**Card with Golden Left Border Accent** (for important sections):
```tsx
<h2 
  className="text-lg font-semibold text-white pl-3"
  style={{ borderLeft: `3px solid ${COLORS.GOLDEN_HOVER}` }}
>
  Section Title
</h2>
```

**Interactive Card**:
```tsx
<div
  className="rounded-lg border transition-colors cursor-pointer"
  style={{
    borderColor: COLORS.BORDER_SUBTLE,
    backgroundColor: COLORS.BACKGROUND_CARD,
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
  }}
>
  {/* Content */}
</div>
```

---

## 🧩 Component Patterns

### Buttons

**Primary Action Button**:
```tsx
<button
  className="px-2 py-1 rounded text-[10px] font-medium transition-colors"
  style={{
    backgroundColor: COLORS.GOLDEN_ACCENT,
    color: "#FFFFFF",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_HOVER;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
  }}
>
  Action Text
</button>
```

**Dark Variant Button** (for secondary actions):
```tsx
<button
  style={{
    backgroundColor: COLORS.GOLDEN_DARK,
    color: "#FFFFFF",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
  }}
>
  Schedule a lesson
</button>
```

### Badges and Tags

**Type Badge** (golden):
```tsx
<span
  className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
  style={{
    backgroundColor: getGoldenAccent(0.12),
    color: COLORS.GOLDEN_HOVER,
  }}
>
  Video Review
</span>
```

**Alert Badge** (red):
```tsx
<span
  className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
  style={{
    backgroundColor: getRedAlert(0.4),
    color: COLORS.RED_ALERT,
  }}
>
  MISSED
</span>
```

### Links

**Accent Link**:
```tsx
<Link
  href="/path"
  className="text-sm"
  style={{ color: COLORS.GOLDEN_ACCENT }}
>
  View all →
</Link>
```

**Green Link** (for completed items):
```tsx
<span className="font-medium text-green-400">
  Program Name
</span>
```

---

## 📏 Spacing and Typography

### Spacing Scale
- **Compact padding**: `p-2` (8px)
- **Standard padding**: `p-4` (16px) or `p-6` (24px)
- **Gap between items**: `gap-2` (8px) or `gap-4` (16px)
- **Card spacing**: `space-y-2` (8px) or `space-y-3` (12px)

### Typography

**Headlines**:
- `text-2xl font-semibold text-white` - Page titles
- `text-lg font-semibold text-white` - Section headers

**Body Text**:
- `text-sm text-zinc-300` - Primary body text
- `text-xs text-zinc-400` - Secondary text
- `text-[10px] text-zinc-500` - Timestamps, metadata

**Compact Mode** (for smaller cards):
- `text-xs` - Headers
- `text-[10px]` - Body text
- `text-[9px]` - Metadata

---

## 🎨 Special Design Elements

### Left Border Accents
Use 3px golden left borders on:
- **Section headers** (Needs Your Attention, Recent Client Activity)
- **Quick Stats cards** (each stat card)
- **Important panels** that need visual emphasis

Implementation:
```tsx
style={{ borderLeft: `3px solid ${COLORS.GOLDEN_HOVER}` }}
```

### Color Usage Rules

1. **Golden Yellow**:
   - Primary buttons
   - Active states
   - Important metrics
   - Section accents
   - Links and CTAs

2. **Green** (Soft):
   - Completed items
   - Success states
   - Program/routine names in activity feeds
   - Use `text-green-400` for softer appearance

3. **Red**:
   - Alerts and errors
   - Missed items
   - Overdue badges
   - Critical notifications

4. **Never Use**:
   - Purple (removed from design system)
   - Full-card colored backgrounds
   - Overly vibrant colors

---

## 🚀 Implementation Guidelines

### Creating New Components

1. **Import color system**:
```tsx
import { COLORS, getGoldenAccent, getRedAlert, getGreenPrimary } from "@/lib/colors";
```

2. **Use centralized colors**: Never hardcode hex values
3. **Follow card patterns**: Use standard card structure
4. **Add hover states**: Use inline styles with `onMouseEnter`/`onMouseLeave` for dynamic colors
5. **Keep it compact**: Use appropriate padding and spacing
6. **Remove icons**: Unless they add functional value

### Updating Existing Components

1. **Replace hardcoded colors**: Find and replace all `#8b5cf6`, `#E5B232`, etc. with `COLORS` constants
2. **Remove purple**: Any remaining purple should be replaced with golden yellow
3. **Update borders**: Use `COLORS.GOLDEN_BORDER` or `COLORS.BORDER_SUBTLE`
4. **Add left border accents**: Where appropriate for section headers

### Navigation Patterns

**Client Detail Navigation**:
- Always use `/clients/${clientId}/detail` for client detail pages
- Make attention items clickable to navigate to client pages
- Action buttons can have separate navigation (e.g., "Review" goes to video page)

---

## 📱 Responsive Considerations

Currently focused on **desktop-only** design. Mobile responsiveness can be added later, but maintain the desktop-first approach.

---

## ✅ Checklist for New Components

- [ ] Import colors from `@/lib/colors`
- [ ] Use golden yellow for accents (not purple or other colors)
- [ ] Follow standard card patterns
- [ ] Add appropriate hover states
- [ ] Use compact spacing where needed
- [ ] Remove unnecessary icons
- [ ] Add left border accents for important sections
- [ ] Use soft green (`text-green-400`) for completed items
- [ ] Test with dark background (`#15191a`)
- [ ] Ensure text is readable (use TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED)

---

## 🔄 Migration Notes

### What Changed
- **Accent color**: From purple (`#8b5cf6`) to golden yellow (`#E5B232`)
- **Background**: Darker main content area (`#15191a`)
- **Icons**: Removed from dashboard components
- **Green links**: Softer appearance (`text-green-400`)

### Files Updated
- `src/lib/colors.ts` - Centralized color system
- `src/components/Dashboard.tsx` - Main dashboard
- `src/components/WeekAtAGlance.tsx` - Calendar component
- `src/components/Sidebar.tsx` - Navigation sidebar

### Future Updates
- Continue migrating other pages to use the new color system
- Add left border accents to important sections
- Remove any remaining purple references
- Standardize button and card patterns across all pages

---

## 📚 Additional Resources

- **Color System**: `src/lib/colors.ts`
- **Main Dashboard**: `src/components/Dashboard.tsx`
- **Example Components**: See `NeedsAttentionPanel`, `ClientActivityFeed`, `QuickStatsPanel`

---

**Last Updated**: Current design system implementation
**Maintained By**: Development team
**Questions?**: Refer to this document or check existing component implementations


