# MiniHog — UI Design Specification

> **Status:** Awaiting design assets from Claude Design. Implementation pending.
> **Scope:** Full UI redesign of all pages. All features and functionality below must be preserved.

---

## 1. INFORMATION ARCHITECTURE

### Public Routes
| Route | Purpose |
|-------|---------|
| `/` | Landing/marketing page |
| `/signin` | Login + Registration (single page, toggling) |

### Protected Routes (sidebar layout)
| Route | Purpose |
|-------|---------|
| `/dashboard` | Overview — KPI cards + event breakdown |
| `/events` | Deep-dive event analytics with charts |
| `/funnel` | Multi-step funnel builder and visualization |
| `/retention` | Cohort retention analysis |
| `/keys` | API key management |
| `/settings` | Profile, password, preferences |

---

## 2. LANDING PAGE (`/`)

### Sections
1. **Hero** — App name, tagline, primary and secondary CTA buttons
2. **Feature highlights** — 4 cards:
   - Event Tracking
   - Real-time Analytics
   - Attribution
   - Easy Integration
3. **Quick Start** — 3 code blocks (install → init → track)
4. **Bottom CTA** — "Generate API Key" button

### Dynamic Elements
- Nav shows "Dashboard" if authenticated, "Sign In" if not
- "Get Started" → `/signin`, "Dashboard" → `/dashboard`

---

## 3. AUTHENTICATION PAGE (`/signin`)

### Two Modes (toggled inline, no page reload)

**Sign In**
- Fields: Username, Password
- Submit: "Sign In"
- Toggle: "Don't have an account? Sign Up"

**Register / Create Account**
- Fields: Username, Email, Password
- Validations: username min 3, email format, password min 8
- Submit: "Create Account"
- Toggle: "Already have an account? Sign In"

### States
- Loading: submit button disabled + label change
- Error: red message below form
- Success: auto-redirect to `/dashboard`
- Back link: "← Back to home"

---

## 4. GLOBAL NAVIGATION

### Desktop Sidebar (fixed, left, currently 240px)
- Brand logo + "MiniHog" wordmark
- 6 navigation items with icons:
  1. **Overview** (BarChart3) → `/dashboard`
  2. **Events** (Activity) → `/events`
  3. **Funnel** (Filter) → `/funnel`
  4. **Retention** (Users) → `/retention`
  5. **API Keys** (Key) → `/keys`
  6. **Settings** (Settings) → `/settings`
- Bottom user section:
  - Avatar (first letter of username)
  - Username + Email (truncated)
  - Sign out button
- Active link: distinct background + accent text

### Mobile Header (fixed, top)
- Logo + wordmark (left)
- Hamburger → X toggle (right)
- Slide-in full-screen overlay menu

### Design Freedom
- Sidebar can be redesigned as collapsible, icon-only rail, top nav, or any other pattern
- Mobile nav pattern is fully open for redesign

---

## 5. DATE RANGE PICKER (Reusable, appears on most pages)

- Two date inputs: "from" and "to"
- Quick preset buttons: **7d**, **30d**, **90d** (active preset highlighted)
- Apply button
- Default: 7d on Overview/Events, 30d on Funnel/Retention
- Manual date entry clears preset highlight

---

## 6. OVERVIEW PAGE (`/dashboard`)

### Header
- Page title: "Overview"
- DateRangePicker (top-right on desktop)

### KPI Cards (3-up grid)
1. **Total Events** — sum across all event types
2. **Unique Users** — max unique users across event types
3. **Event Types** — count of distinct event names

### Event Breakdown Grid
- Card per event type (install, signup, purchase, app_open)
- Per card: event name (monospace), unique users count, total count (large + bold)
- States: loading, error, empty ("No events in this period.")

---

## 7. EVENTS PAGE (`/events`)

### Controls
- **Event selector** dropdown — dynamically populated from API
- **Granularity** dropdown — Daily / Hourly
- **DateRangePicker**
- **Refresh button** — visible only when event selected; shows spinner while loading

### KPI Cards (3-up, shown after event selected)
1. Total Events
2. Unique End Users
3. Granularity label

### Time Series Chart
- Two lines: **count** (blue) + **unique_users** (cyan)
- X-axis: dates (rotated labels), Y-axis: values
- Interactive tooltip, dashed grid

### Properties Breakdown
- **Property key selector** dropdown (top-right of card)
- **Horizontal Bar Chart** — count by property value
- **Pie Chart** — proportional distribution (5-color)
- **Summary table** (max 5 rows): Value | Count | Unique Users

### User Journeys
- Up to 10 individual users
- Per user: truncated user ID, total event count, event sequence as pill badges
- Scrollable container

### Common Paths
- Aggregated most-common event sequences
- Per path: path number, user count + percentage, event chain (→ separators), events as badges

### Empty State
- "Select an event to view analytics." (centered)

---

## 8. FUNNEL PAGE (`/funnel`)

### Controls
- **DateRangePicker** (30d default)

### Step Builder Card
- **Available events** — clickable buttons with `+` icon to add to funnel
- **Selected steps list** (ordered):
  - Step number (#1, #2, …)
  - Event name (monospace)
  - Move up / Move down arrows (disabled at boundaries)
  - Remove (×) button
- Empty message: "Click events below to add them as funnel steps."
- **"Analyze Funnel" button** — disabled until ≥ 2 steps; helper text "Add at least 2 steps" when only 1
- "All events added" message when event pool is exhausted

### Results

**Funnel Visualization**
- Horizontal Bar Chart: Y = step names, X = user count

**Per-Step Results Cards**
- Step label + event name (monospace)
- Drop-off % in red if > 0
- User count (bold monospace)

---

## 9. RETENTION PAGE (`/retention`)

### Controls
- **DateRangePicker** (30d default)
- **Cohort Event** dropdown — auto-selects first event; skeleton during load
- **Day** number input (min 1, default 7)
- **Quick day presets** — Day 1 / Day 3 / Day 7 / Day 14 / Day 30 (selected highlighted)

### KPI Cards (3-up)
1. Cohort Size
2. Retained Users
3. Retention Rate (2 decimal places)

### Details Card
- Cohort event name, Retention day, Date range

---

## 10. API KEYS PAGE (`/keys`)

### Generate New Key
- Text input: key name
- "Generate" button — disabled if name empty

### Post-Generation Reveal
- Success banner: "Key generated! Copy it now — it won't be shown again."
- Key value in monospace (one-time display only)
- Copy button: icon swaps Copy → Check (resets after 2s)
- Dismiss link: "I've copied the key"

### Existing Keys List
- Per key: name, created date, "Revoke" button
- Bulk: "Revoke All" button (trash icon)
- States: loading, empty ("No API keys yet.")
- Confirmation before any revoke (single and bulk)

---

## 11. SETTINGS PAGE (`/settings`)

### Profile
- **Email** — editable input, pre-filled; "Save" button; success/error inline feedback
- **Username** — read-only display

### Change Password
- 3 inputs: Current Password, New Password, Confirm New Password
- "Change password" button → "Saving…" during load
- Success/error inline feedback

### Preferences
- **Theme** — Light / Dark / System
- **Default Date Range** — Last 7 days / Last 30 days / Last 90 days (persisted in localStorage)

### About
- App name + version ("MiniHog Dashboard v1.0.0")

---

## 12. CROSS-CUTTING PATTERNS

### Loading States
- Initial load: skeleton pulse OR "Loading…" text
- Button submits: disabled + label change ("Saving…", "Loading…")

### Error States
- Inline error messages in destructive/red
- Generic fallback: "Something went wrong. Please try again."

### Empty States
- Short descriptive text centered in container
- **No illustrations currently** — full creative freedom to add them

### Responsive Breakpoints
- **Mobile:** Single column, top nav bar, hamburger menu
- **Tablet+:** Sidebar visible, multi-column grids
- **Desktop:** Full sidebar, 2–3 column card/chart grids

### Feedback / Notifications
- Inline success/error text (no toast system currently — can be added)
- Copy-to-clipboard: icon swap for 2s
- Destructive confirmations before revoke actions (currently `window.confirm` — modal system welcome)

---

## 13. DATA & METRICS REFERENCE

| Metric | Page(s) |
|--------|---------|
| Total event count | Overview, Events |
| Unique users per event | Overview, Events |
| Event types count | Overview |
| Daily/Hourly time series | Events |
| Property value breakdown (bar + pie) | Events |
| Individual user event journeys | Events |
| Common user path patterns | Events |
| Funnel step conversion counts | Funnel |
| Step drop-off percentages | Funnel |
| Cohort size | Retention |
| Retained user count | Retention |
| Retention rate % | Retention |
| Installs by campaign | Attribution (API exists, no page yet) |
| Purchases by campaign | Attribution (API exists, no page yet) |

---

## 14. CHARTS IN USE (Recharts)

| Chart Type | Used On |
|-----------|---------|
| Line Chart (2 series) | Events — time series |
| Horizontal Bar Chart | Events — properties; Funnel — steps |
| Pie Chart | Events — property distribution |
| Bar Chart (vertical) | Funnel — step visualization |

---

## 15. DESIGN FREEDOM NOTES

These are areas with **no current implementation** — full creative freedom:

- **Empty state illustrations** — nothing exists; icons, illustrations, or copy can be added freely
- **Toast / notification system** — only inline text exists; a toast/snackbar system can be designed in
- **Confirmation modals** — currently `window.confirm`; full modal design is welcome
- **Attribution page** — API and routing exist but no UI page; can be designed as a new page showing installs and purchases by campaign
- **Onboarding flow** — no first-time user experience exists; a wizard or guided setup could be designed
- **Command palette / global search** — not implemented; can be designed in
- **Notification / activity feed** — not implemented; can be designed in
- **Sidebar behavior** — collapsible, icon-rail, or any pattern is fine
- **Mobile navigation** — current slide-over is basic; full redesign welcome
- **Color palette** — fully replaceable; current vars: `primary`, `secondary`, `accent`, `destructive`, `sidebar-accent`
- **Typography** — Tailwind defaults; any typeface system is open
- **Chart styles** — Recharts supports custom colors, shapes, tooltips, legends freely

---

## 16. IMPLEMENTATION NOTES (for when design assets arrive)

- Component library: **shadcn/ui** (Radix UI primitives + Tailwind) — prefer extending existing components
- Icons: **Lucide React** — can be swapped or supplemented
- Charts: **Recharts** — wrapping components are in each page file directly
- Auth state: `useAuth()` hook — do not change the auth flow, only the UI
- API calls: `src/lib/api.ts` Axios client — keep all existing method signatures
- All pages are in `packages/dashboard/app/`
- Shared components live in `packages/dashboard/src/components/`
- CSS variables for theming are in `packages/dashboard/app/globals.css`
