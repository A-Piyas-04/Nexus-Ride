# Dashboard GUI Modifications (Brief)

This note summarizes the GUI (dashboard-side) changes made during this chat session, focusing on what was added/modified in the frontend UI and where it lives.

## High-level UI outcome

- Dashboard pages now share a **single consistent layout** (sidebar + mobile header + content area).
- Repeated “card UI” patterns were replaced with **reusable components** to keep the dashboard extendable.
- Subscription UX is implemented through a **modal workflow** (instead of a dedicated `/subscription` page route).
- Seat availability and subscriber dashboard screens are styled consistently with the main dashboard.

## Core layout changes (Dashboard shell)

File: [DashboardLayout.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/DashboardLayout.jsx)

- Added a consistent dashboard shell:
  - Left sidebar on desktop.
  - Slide-in sidebar on mobile (hamburger open + close button).
  - Main content area rendered via `{children}`.
- Sidebar now shows signed-in user info using the shared hook:
  - Uses [useCurrentUser.js](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/hooks/useCurrentUser.js)
- Sidebar slide animation is handled via Tailwind classes (`transition-transform`, `translate-x-*`), avoiding a custom transition wrapper inside layout.

## Reusable dashboard UI components (new standardized building blocks)

These are used to standardize the look & feel and reduce repeated JSX.

- Action tiles:
  - [ActionCard.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/ActionCard.jsx)
  - Used in:
    - [DashboardPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/DashboardPage.jsx)
    - [SubscriberDashboardPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/SubscriberDashboardPage.jsx)
- Summary stats cards:
  - [StatCard.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/StatCard.jsx)
  - Used in:
    - [DashboardPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/DashboardPage.jsx)
    - [SeatAvailabilityPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/SeatAvailabilityPage.jsx)
- Welcome header banner:
  - [WelcomeBanner.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/WelcomeBanner.jsx)
  - Used in:
    - [DashboardPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/DashboardPage.jsx)
    - [SubscriberDashboardPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/SubscriberDashboardPage.jsx)

## Dashboard main page UI changes

File: [DashboardPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/DashboardPage.jsx)

- Uses:
  - `WelcomeBanner` at the top (with a “Subscribe” button).
  - `StatCard` row (Trips / Seats remaining / Next departure).
  - `ActionCard` grid (Seat availability / Buy token / Cancel token / Token history).
- Subscription action opens a modal (no route navigation to `/subscription`).

## Subscriber dashboard UI changes

File: [SubscriberDashboardPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/SubscriberDashboardPage.jsx)

- Uses the same layout and component style:
  - `DashboardLayout`, `WelcomeBanner`, `ActionCard`.
- Adds “Subscription details” modal access from the action grid.

## Modal GUI changes (subscription workflow)

- Base modal UI:
  - [Modal.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/Modal.jsx)
  - Includes backdrop + panel animation and ESC/backdrop click to close.
- Subscription form modal:
  - [SubscriptionModal.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/modals/SubscriptionModal.jsx)
  - Provides month range + year + stop selection, then calls `createSubscription`.
- Subscription details modal:
  - [SubscriptionDetailsModal.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/modals/SubscriptionDetailsModal.jsx)
  - Shows subscription status/route/stop/dates with loading state.

## Seat availability page GUI (dashboard-linked screen)

File: [SeatAvailabilityPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/SeatAvailabilityPage.jsx)

- Consistent dashboard styling:
  - Uses `DashboardLayout`
  - Uses `StatCard` summary at the top
- Structured route sections (direction → route cards → vehicles → trip table).
- Data is sourced from centralized constants:
  - [routes.js](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/constants/routes.js)

## Token history page GUI cleanup

File: [TokenHistoryPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/TokenHistoryPage.jsx)

- Token history view is now a single page component (wrapped in `DashboardLayout`) rather than a separate page + child component duplication.
- Uses existing `Card` and `Button` UI components for consistent styling.

## Route-level transition wrapper (UX polish)

File: [App.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/App.jsx)

- Wraps the route outlet with a transition to animate page changes across the whole app.
- Transition implementation lives in:
  - [Transition.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/Transition.jsx)
