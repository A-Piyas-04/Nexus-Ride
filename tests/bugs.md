# NexusRide — Beginner-Friendly Frontend Bugs

These bugs can be reproduced from the UI (browser). Start the backend and frontend first:

```bash
docker-compose up --build
cd frontend/frontend && npm install && npm run dev
```

Open `http://localhost:5173`.

---

## Bug 1 — Active subscribers sent to a page that does not exist

**Where:** Login page  
**How to reproduce:**
1. Log in as a staff user who already has an **ACTIVE** subscription.
2. Watch where you land after login.

**Expected:** You go to the staff dashboard (`/dashboard`).  
**Actual:** The app tries to open `/subscriber`. That route is not defined, so the catch-all sends you back to `/login`.

---

## Bug 2 — Dashboard and most pages work without logging in

**Where:** Almost every main page (dashboard, buy token, notifications, profile, etc.)  
**How to reproduce:**
1. Make sure you are logged out (or open a private/incognito window).
2. In the address bar, go to `http://localhost:5173/dashboard`.
3. Also try `/buy-token`, `/notifications`, `/profile`, `/seat-availability`.

**Expected:** You should be redirected to the login page.  
**Actual:** The pages still open. Only payment and some Transport Officer manage pages are protected.

---

## Bug 3 — After creating a route, you get kicked to login

**Where:** Transport Officer → Manage Routes → Add Route  
**How to reproduce:**
1. Log in as the Transport Officer.
2. Open **Route Management** and create a new route.
3. Submit the form (Create Route).

**Expected:** You return to the route list.  
**Actual:** The app navigates to `/to-pages/to-add/routeList` (wrong path). That page does not exist, so you end up on `/login`.

---

## Bug 4 — Empty route list “Create Route” button goes to the wrong URL

**Where:** Manage Routes (empty list / no search results)  
**How to reproduce:**
1. As Transport Officer, open the route list.
2. If there are routes, search for something that matches nothing so the empty state appears.
3. Click **Create Route**.

**Expected:** Opens the real “Add Route” page (`/to-pages/route-manage/routeAdd`).  
**Actual:** Goes to `/to-pages/to-add/routeAdd` and then bounces to login.

---

## Bug 5 — “Change pickup” on TO dashboard only shows an alert

**Where:** Transport Officer dashboard → Subscription section  
**How to reproduce:**
1. Log in as Transport Officer with an active subscription.
2. Click **Change pickup**.

**Expected:** A pickup-change form/modal opens (like on the staff dashboard).  
**Actual:** A browser alert says “Change pickup location for the current day” and nothing else happens.

---

## Bug 6 — Logo always sends drivers and TO to the staff dashboard

**Where:** Top navbar (NexusRide logo)  
**How to reproduce:**
1. Log in as a **driver**.
2. Click the **NexusRide** logo/name in the navbar.
3. Repeat as Transport Officer.

**Expected:** Driver → driver dashboard; TO → TO dashboard.  
**Actual:** Always goes to `/dashboard` (staff dashboard).

---

## Bug 7 — Driver login still says “Enter your email…”

**Where:** Login page → Driver mode  
**How to reproduce:**
1. Open `/login`.
2. Click **Driver**.
3. Read the subtitle under “Welcome Back”.

**Expected:** Text should mention phone number (drivers log in with phone).  
**Actual:** It still says “Enter your email to sign in to your account”.

---

## Bug 8 — Signup has no “Confirm password” field

**Where:** Signup page  
**How to reproduce:**
1. Open `/signup`.
2. Look at the password section.
3. Type a password with a typo on purpose and submit.

**Expected:** A second “Confirm password” field should catch typos.  
**Actual:** There is only one password field. A mistyped password can create the account.

---

## Bug 9 — Phone number field accepts letters and very long input while typing

**Where:** Login / Signup → Driver mode  
**How to reproduce:**
1. Open login or signup and choose **Driver**.
2. In the phone field, type letters like `abcdef` or a long number like `012345678901234`.

**Expected:** Only digits allowed, max 11 characters (Bangladeshi mobile format).  
**Actual:** The field accepts anything. You only get an error after clicking submit.

---

## Bug 10 — Changing route on Buy Token keeps the old stop selected

**Where:** Buy Token page  
**How to reproduce:**
1. Log in as staff and open **Buy Token**.
2. Pick Route A, then pick a stop.
3. Change the route to Route B (different stops).
4. Continue / submit without carefully re-picking a stop.

**Expected:** Pickup stop resets when the route changes, so you must choose a stop for Route B.  
**Actual:** The old stop id can stay in form state even when the dropdown looks empty or wrong, and can be sent to payment.

---

## Bug 11 — “Today” on Buy Token can be the wrong calendar day

**Where:** Buy Token (travel date default / min date)  
**How to reproduce:**
1. Open Buy Token late at night (or in a timezone ahead of UTC).
2. Check the default **Travel date** and the earliest date you can pick.

**Expected:** Default/min date is **today in your local timezone**.  
**Actual:** The app uses UTC (`toISOString()`), so near midnight the date can be yesterday or tomorrow compared to your local clock.

---

## Bug 12 — Transport request allows past event dates

**Where:** New Transport Request form  
**How to reproduce:**
1. Log in as staff/faculty.
2. Open **New Transport Request**.
3. Set **Event Date** to a day in the past and submit.

**Expected:** Past dates are blocked (min = today).  
**Actual:** Any past date is accepted; the date input has no `min` limit.

---

## Bug 13 — Leave form allows past “from” dates

**Where:** Staff / TO dashboard → Take leave  
**How to reproduce:**
1. On the dashboard, open the leave / “Take leave” flow.
2. Set **From** and **To** to dates in the past.
3. Submit.

**Expected:** Leave cannot start in the past.  
**Actual:** Past dates are allowed (only “from ≤ to” and max length are checked).

---

## Bug 14 — Subscribe modal shows hardcoded stop names, not live routes

**Where:** Dashboard → Subscribe  
**How to reproduce:**
1. Log in as staff.
2. Click **Subscribe**.
3. Open the **Stop name** dropdown.

**Expected:** Stops match real routes/stops from the backend.  
**Actual:** You always see fixed demo stops (e.g. Tongi, Uttara) from a hardcoded list, which may not match the database.

---

## Bug 15 — Opening `/payment` directly shows a broken payment screen

**Where:** Payment start page  
**How to reproduce:**
1. Log in.
2. In the address bar, go to `http://localhost:5173/payment` (do not come from Buy Token / Subscribe).

**Expected:** Clear message like “Start from Buy Token or Subscribe”, or redirect back.  
**Actual:** Type shows `-`, and **Initiate Payment** stays disabled with little guidance. Refreshing after a real payment flow can also lose state and hit the same dead end.

---

## Bug 16 — Failed subscription payment button says “View Subscription” but goes to dashboard

**Where:** Payment result screen (failed payment)  
**How to reproduce:**
1. Start a subscription payment.
2. Reach the **Payment Failed** screen (fail/cancel the payment flow if the UI allows).
3. Click **View Subscription**.

**Expected:** Opens subscription details or a relevant subscription page.  
**Actual:** It behaves like “continue” and navigates to `/dashboard`. The label does not match what the button does.

---

## Bug 17 — Notifications / Token History “Back to Dashboard” ignores drivers and TO

**Where:** Notifications page, Token History page, Seat Availability  
**How to reproduce:**
1. Log in as a **driver** (or Transport Officer).
2. Open **Notifications** or **Token History**.
3. Click **Back to Dashboard** (or similar back control on those pages).

**Expected:** Return to `/driver-dashboard` or `/to-dashboard`.  
**Actual:** Always goes to `/dashboard` (staff dashboard).

---

## Bug 18 — TO transport-requests back arrow goes to staff dashboard

**Where:** Transport Officer → Transport Requests list  
**How to reproduce:**
1. Log in as Transport Officer.
2. Open **Transport Requests** (manage list).
3. Click the back arrow at the top.

**Expected:** Return to `/to-dashboard`.  
**Actual:** Navigates to `/dashboard`.

---

## Bug 19 — After driver signup, navbar still behaves like staff

**Where:** Signup → Driver → then Profile / logo  
**How to reproduce:**
1. Sign up as a **Driver** (valid phone + licence like `DL-1234`).
2. You should land on the driver dashboard.
3. Click **Profile** or the NexusRide logo / home controls that depend on auth user.

**Expected:** App knows you are a driver (driver profile, driver home).  
**Actual:** Signup only saves the token to `localStorage` and never updates AuthContext’s user, so the navbar can treat you like a normal staff user.

---

## Bug 20 — “Decline” / “outline” buttons look unstyled or wrong

**Where:** Subscription Requests (Decline), empty Route List (Create Route), Navbar Profile/Logout, and other screens using `variant="outline"` or `variant="destructive"`  
**How to reproduce:**
1. As Transport Officer, open **Subscription Requests** and look at **Decline** buttons.
2. Or open Manage Routes empty state **Create Route**.
3. Compare those buttons to normal primary/secondary buttons.

**Expected:** Outline and destructive styles (bordered / red danger look).  
**Actual:** The shared `Button` component only supports `primary`, `secondary`, `ghost`, and `link`. `outline`, `destructive`, and `icon` are missing, so those buttons look broken or oddly padded.

---

## Quick reference

| # | Short title                         | Role needed        |
|---|-------------------------------------|--------------------|
| 1 | Active user → `/subscriber` 404     | Staff (subscribed) |
| 2 | Unprotected pages                   | Logged out         |
| 3 | Create route → wrong redirect       | Transport Officer  |
| 4 | Empty-state Create Route wrong URL  | Transport Officer  |
| 5 | Change pickup is alert-only         | Transport Officer  |
| 6 | Logo always → staff dashboard       | Driver / TO        |
| 7 | Driver login copy still says email  | Anyone             |
| 8 | No confirm password on signup       | Anyone             |
| 9 | Phone field accepts invalid input   | Anyone             |
|10 | Buy Token stale stop after route change | Staff         |
|11 | UTC “today” on Buy Token            | Staff              |
|12 | Past event date allowed             | Staff / Faculty    |
|13 | Past leave dates allowed            | Staff / TO         |
|14 | Hardcoded subscribe stops           | Staff              |
|15 | Direct `/payment` dead end          | Logged-in user     |
|16 | “View Subscription” wrong action    | Staff (payment)    |
|17 | Back to Dashboard ignores role      | Driver / TO        |
|18 | TO requests back → staff dashboard  | Transport Officer  |
|19 | Driver signup skips AuthContext     | New driver         |
|20 | Missing Button variants             | TO / several pages |
