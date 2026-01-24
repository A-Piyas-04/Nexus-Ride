# Transition / Animation Logic (Frontend)

This note documents where the transition/animation logic lives in the frontend, how it works, and exactly what to change if you want different animation behavior.

## What is animated right now

- **Route/page transitions (whole app content)**: when navigating between routes, the main view fades + slides vertically.
- **Modal transitions**: when opening/closing a modal, the backdrop fades and the modal panel fades + slides + scales.
- **Dashboard sidebar (mobile)**: when opening/closing the sidebar on small screens, the sidebar slides in/out.

## Files and folders involved

- **Core transition component**
  - [Transition.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/Transition.jsx)
  - Folder: `frontend/frontend/src/components/ui/`
- **Route transition usage**
  - [App.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/App.jsx)
  - Folder: `frontend/frontend/src/`
- **Modal transition usage**
  - [Modal.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/Modal.jsx)
  - Folder: `frontend/frontend/src/components/ui/`
- **Sidebar slide animation (Tailwind classes, not Transition.jsx)**
  - [DashboardLayout.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/DashboardLayout.jsx)
  - Folder: `frontend/frontend/src/pages/dashboard/`
- **Class merging utility used by transitions**
  - [cn.js](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/utils/cn.js)
  - Folder: `frontend/frontend/src/utils/`

## How the Transition component works

File: [Transition.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/Transition.jsx)

### Key props

- `open` (boolean): controls whether the element should be visible.
- `baseClassName` (string): shared transition classes. Default is:
  - `transition-all duration-500 ease-out`
- `enterClassName` (string): applied when visible.
- `exitClassName` (string): applied when hidden (but still mounted during exit animation).
- `durationMs` (number): controls when the component unmounts after closing (default `DEFAULT_DURATION_MS = 500`).
- `persist` (boolean): if `true`, the element never unmounts; it just toggles classes.
- `as` (string): HTML tag to render (default `div`).

### Mount/unmount timing (important)

- When `open` becomes `true`:
  - `isMounted` becomes `true` immediately.
  - Then a `requestAnimationFrame` flips `isVisible` to `true` so CSS transitions can run.
- When `open` becomes `false`:
  - `isVisible` becomes `false` immediately (so `exitClassName` applies).
  - If `persist` is `false`, it waits `durationMs` and then unmounts.

This means:
- **Your Tailwind duration class (`duration-500`) and `durationMs` should match.**
  - If they don’t match, you can get cut-off animations (unmount too early) or delayed unmounts.

## Where route transitions are implemented

File: [App.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/App.jsx)

- The whole `<Routes />` tree is wrapped inside `<Transition />`.
- It keeps a separate `displayLocation` state. When the real `location` changes:
  - `open` is set to `false` to play exit animation.
  - After `DEFAULT_DURATION_MS`, `displayLocation` updates and `open` becomes `true` to play enter animation.
- The exit direction is derived from `useNavigationType()`:
  - `POP` → treated as “backward”
  - other navigation types → treated as “forward”

Relevant section:

```jsx
import Transition, { DEFAULT_DURATION_MS } from './components/ui/Transition';

// ...
const exitClassName =
  direction === 'backward' ? 'opacity-0 -translate-y-4' : 'opacity-0 translate-y-4';

return (
  <Transition
    open={open}
    enterClassName="opacity-100 translate-y-0"
    exitClassName={exitClassName}
    className="min-h-screen"
  >
    <Routes location={displayLocation}>{/* ... */}</Routes>
  </Transition>
);
```

## Where modal transitions are implemented

File: [Modal.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/Modal.jsx)

Two nested transitions are used:

1) **Backdrop wrapper fade**
- `enterClassName="opacity-100"`
- `exitClassName="opacity-0"`

2) **Modal panel animation**
- `enterClassName="opacity-100 translate-y-0 scale-100"`
- `exitClassName="opacity-0 translate-y-4 scale-95"`

Relevant section:

```jsx
<Transition
  open={open}
  enterClassName="opacity-100"
  exitClassName="opacity-0"
  className="fixed inset-0 z-50 flex items-center justify-center p-4"
>
  <button className="absolute inset-0 bg-black/30" onClick={onClose} />

  <Transition
    open={open}
    enterClassName="opacity-100 translate-y-0 scale-100"
    exitClassName="opacity-0 translate-y-4 scale-95"
    className={cn('relative w-full rounded-2xl border ...', maxWidth, className)}
  >
    {children}
  </Transition>
</Transition>
```

## Where sidebar “transition animation” is implemented

File: [DashboardLayout.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/DashboardLayout.jsx)

This is not using `Transition.jsx`. It uses Tailwind’s `transition-transform`:

- Base classes include:
  - `transition-transform duration-300 ease-in-out`
- State toggles between:
  - open: `translate-x-0`
  - closed (mobile): `-translate-x-full`
- On `md:` screens the sidebar is forced visible via:
  - `md:static md:translate-x-0`

Relevant section:

```jsx
<aside
  className={cn(
    'fixed inset-y-0 left-0 ... transition-transform duration-300 ease-in-out md:static md:translate-x-0',
    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
  )}
>
```

## How to change any characteristic (practical guide)

### 1) Change route transition speed

Option A (global default):
- Edit `DEFAULT_DURATION_MS` in [Transition.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/Transition.jsx).
- Also update the default `baseClassName` duration class to match:
  - e.g. `duration-300` with `DEFAULT_DURATION_MS = 300`

Option B (per usage):
- Pass `durationMs` and `baseClassName` from the caller (e.g. in [App.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/App.jsx)).

### 2) Change route transition style (slide direction, fade-only, etc.)

Edit in [App.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/App.jsx):
- `enterClassName`
- `exitClassName`

Examples:
- Fade only:
  - enter: `opacity-100`
  - exit: `opacity-0`
- Horizontal slide:
  - enter: `opacity-100 translate-x-0`
  - exit: `opacity-0 translate-x-4` (or `-translate-x-4`)

### 3) Change modal animation

Edit in [Modal.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/Modal.jsx):
- Backdrop opacity:
  - `className="... bg-black/30"` (change `30`)
  - outer transition `enterClassName/exitClassName`
- Panel animation:
  - inner transition `enterClassName/exitClassName`
- Panel size:
  - `maxWidth` prop (`max-w-lg` default)

### 4) Change sidebar slide speed / easing

Edit in [DashboardLayout.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/DashboardLayout.jsx):
- `duration-300` → `duration-200`/`duration-500`
- `ease-in-out` → other easings
- `translate-x-0` / `-translate-x-full` → different distances

### 5) If you add new transitions elsewhere

- Reuse [Transition.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/components/ui/Transition.jsx) for mount/unmount-aware animations.
- Or use Tailwind `transition-*` classes directly when you don’t need controlled unmount timing.
