# Redundancy / Duplicacy / Non-Extensibility Fixes (Detailed)

This note documents the redundancy problems that existed in the frontend dashboard area and how they were fixed during this chat session: what was changed, where code was moved/centralized, and what can be improved further later.

## What “redundancy / non-extensibility” meant in this repo

The frontend had multiple places where the same kind of logic/UI/data was reimplemented:

- **User identity display logic repeated** (name/email extraction and formatting scattered).
- **Dashboard UI patterns repeated** (similar card layouts for actions and stats).
- **Routes/stops/vehicle data duplicated** across pages/modals, making it hard to keep consistent.
- **Transition / animation logic used inconsistently** (some places used a custom component, some should use Tailwind-only).
- **Legacy/duplicate page components** existed (same screen split into “Page + Child component”, even when child wasn’t reused).

The fixes focused on centralizing shared logic and standardizing reusable components.

## Summary of what was centralized / extracted

### 1) Centralized “current user” logic (remove repeated localStorage + auth extraction)

**New single source of truth**:
- [useCurrentUser.js](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/hooks/useCurrentUser.js)

What it does:
- Reads `user` from the auth context.
- Falls back to `localStorage` values (e.g., `full_name`, `name`) when needed.
- Provides standardized fields:
  - `fullName`, `userEmail`, `welcomeName`

Key code:

```js
// src/hooks/useCurrentUser.js
export function useCurrentUser() {
  const { user } = useAuth();

  const fullName =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('full_name') || localStorage.getItem('name'))) ||
    user?.full_name ||
    user?.name ||
    'User';

  const userEmail = user?.email || '';
  const welcomeName = userEmail ? userEmail.split('@')[0] : fullName;

  return { user, fullName, userEmail, welcomeName };
}
```

Where it is used:
- [DashboardLayout.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/DashboardLayout.jsx)
- [WelcomeBanner.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/WelcomeBanner.jsx)

Impact:
- Future pages can display user info without re-implementing parsing/fallback logic.

### 2) Standardized the dashboard layout (remove repeated layout code from every page)

Central dashboard shell:
- [DashboardLayout.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/DashboardLayout.jsx)

What moved into the layout:
- Sidebar + mobile top bar + responsiveness.
- “Signed in as” block (fed by `useCurrentUser()`).
- Logout action wiring via `useAuth().logout()` + redirect.

Key structure:

```jsx
// src/pages/dashboard/DashboardLayout.jsx
return (
  <div className="min-h-screen w-full bg-gray-100 flex">
    <aside className={cn(/* ... */)}>
      {/* sidebar content + user info + actions */}
    </aside>
    <main className="flex-1 min-w-0">
      {/* mobile header */}
      {children}
    </main>
  </div>
);
```

Impact:
- Every dashboard-related screen can focus on content only and automatically gets consistent navigation + styling.

### 3) Replaced repeated “card UI” blocks with reusable components

Added reusable UI components:

- [ActionCard.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/ActionCard.jsx)
  - Standardizes the large clickable dashboard actions (icon + title + description + arrow).
- [StatCard.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/StatCard.jsx)
  - Standardizes KPI-style summary stats.
- [WelcomeBanner.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/WelcomeBanner.jsx)
  - Standardizes the “Welcome back / Logged in as …” banner UI.

Where they are applied:
- Main dashboard:
  - [DashboardPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/DashboardPage.jsx)
- Subscriber dashboard:
  - [SubscriberDashboardPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/SubscriberDashboardPage.jsx)
- Seat availability:
  - [SeatAvailabilityPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/SeatAvailabilityPage.jsx)

Impact:
- UI consistency improves.
- Adding a new dashboard action/stat becomes “add a new `ActionCard` / `StatCard`” instead of copy-paste.

### 4) Centralized route/stop/vehicle constants (remove duplicated route data)

Single source of truth for route definitions and seat availability mock data:
- [routes.js](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/constants/routes.js)

Contains:
- `ROUTE_DEFINITIONS`
- `ROUTE_VEHICLES`
- `SEAT_AVAILABILITY_SECTIONS` (derived)

Where it’s used:
- [SeatAvailabilityPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/SeatAvailabilityPage.jsx) imports `SEAT_AVAILABILITY_SECTIONS`.
- [SubscriptionModal.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/modals/SubscriptionModal.jsx) imports `ROUTE_DEFINITIONS` to populate stops.

Example of stop selection now using shared constants:

```jsx
// src/modals/SubscriptionModal.jsx
import { ROUTE_DEFINITIONS } from '../constants/routes';

{ROUTE_DEFINITIONS.map((route) => (
  <optgroup key={route.route_name} label={route.route_name}>
    {route.stops.map((stop) => (
      <option key={stop} value={stop}>
        {stop}
      </option>
    ))}
  </optgroup>
))}
```

Impact:
- Stops/routes don’t drift out of sync between pages.
- Later, replacing mock constants with backend data becomes a single, clear refactor point.

### 5) Removed legacy duplication: Token history page/component split

What was removed:
- `src/pages/TokenHistory.jsx` (deleted)

What replaced it:
- [TokenHistoryPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/TokenHistoryPage.jsx) now contains the page content directly.

Why:
- The separate `TokenHistory` child component was not reused elsewhere.
- Keeping it separate was adding file-level duplication and navigation indirection without benefits.

Impact:
- One file per screen → easier maintenance.

## Bugfixes made along the way (tightly related to refactor)

### Fix 1) “Dashboard white screen” caused by transition usage in layout

- The dashboard layout previously used a transition wrapper which caused runtime failure (white screen).
- The layout now uses Tailwind `transition-transform` + `translate-x-*` classes directly for sidebar animation:
  - [DashboardLayout.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/DashboardLayout.jsx)

### Fix 2) “Modal is not defined” in subscription modal

File:
- [SubscriptionModal.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/modals/SubscriptionModal.jsx)

Fix:
- Ensured the modal component is imported and used:

```jsx
import { Modal } from '../components/ui/Modal';
```

### Fix 3) Clarified “/subscription 404” (frontend route vs backend API)

- The frontend router does **not** define a `/subscription` page route.
  - See routes in [App.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/App.jsx)
- Subscription is handled as a **modal** opened from the dashboard:
  - UI: [SubscriptionModal.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/modals/SubscriptionModal.jsx)
- The backend API calls use the `/subscription/` endpoint (note the trailing slash) via:
  - [auth.js](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/services/auth.js)

### Fix 4) Utility import mismatch for class merging

File:
- [Modal.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/Modal.jsx)

Fix:
- Uses the project’s `cn()` helper:
  - [cn.js](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/utils/cn.js)

```js
import { cn } from '../../utils/cn';
```

## What was intentionally kept (not removed)

- [Transition.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/Transition.jsx) was reviewed as a possible legacy file, but it is actively used by:
  - [App.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/App.jsx) for route transitions
  - [Modal.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/Modal.jsx) for modal open/close transitions

## What can be done later (brief, next improvement steps)

- Replace mock route/vehicle data in [routes.js](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/constants/routes.js) with backend-driven API data, keeping the same UI components.
- Make Token History real (replace static list in [TokenHistoryPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/TokenHistoryPage.jsx) with API data + empty/loading states).
- Create a small “dashboard navigation config” list (labels + route paths) so sidebar items can be mapped instead of hardcoded.
- Add a dedicated `/subscription` route only if product UX requires deep-linking; currently subscription is modal-based from dashboard.
- Consider consolidating all dashboard routes under a nested route layout in React Router (single layout wrapper), so `DashboardLayout` usage is guaranteed by routing instead of manual wrapping.
