# PRODUCTION CHECKLIST — AutoPartsPro

> Go through every item on this list before you show the app to real users.  
> Check each box only when you have VERIFIED it — not just when you think it's done.

---

## HOW TO USE THIS CHECKLIST

- [ ] = Not done yet  
- [x] = Done and verified  
- Each item explains WHY it matters and HOW to verify it

---

# SECTION 1 — AUTHENTICATION & SECURITY

- [ ] **Real authentication is implemented**  
  WHY: Fake auth lets anyone in. VERIFY: Try logging in with wrong credentials — you should see an error.

- [ ] **All dashboard routes redirect to login when not authenticated**  
  HOW: Open a private/incognito browser window. Type `yourapp.com/dashboard` in the URL bar directly. You should land on the login page.

- [ ] **Sign Out button works**  
  HOW: Log in → click Sign Out → you should be on the login page → press browser Back → you should stay on the login page (not go back to dashboard).

- [ ] **Session persists after page refresh**  
  HOW: Log in → refresh the browser → you should still be on the dashboard, not kicked to login.

- [ ] **Session does NOT persist after Sign Out**  
  HOW: Log in → sign out → close and reopen browser → you should be on the login page.

- [ ] **Login form validates input**  
  HOW: Try submitting with empty fields — HTML required validation should stop submission. Try a wrong email format — browser should catch it.

- [ ] **Minimum password length enforced**  
  HOW: Try creating/changing password with 2 characters — should be rejected.

- [ ] **No secrets in the source code**  
  HOW: Search your code for any hardcoded API keys, passwords, or connection strings. None should exist.

- [ ] **`.env` file is in `.gitignore`**  
  HOW: Run `git status` — `.env` should NOT appear in the list.

- [ ] **Supabase Row Level Security (RLS) is enabled**  
  HOW: In Supabase, go to each table → Auth Policies. Each table should have policies that restrict access.

- [ ] **`service_role` key is NOT in the frontend code**  
  HOW: Search all source files for `service_role`. It should not appear anywhere.

---

# SECTION 2 — DATA & FUNCTIONALITY

- [ ] **All hardcoded mock data is replaced with real database calls**  
  HOW: Change a record in Supabase directly → refresh the app → you should see the change.

- [ ] **Add Inventory Item works and saves to database**  
  HOW: Add a new item → refresh the page → item should still be there.

- [ ] **Edit Inventory Item works and saves changes**  
  HOW: Edit an item's price → refresh → price should reflect the change.

- [ ] **Delete Inventory Item works with confirmation**  
  HOW: Delete an item → confirm → item is gone → refresh → still gone.

- [ ] **Delete shows a confirmation dialog before deleting**  
  HOW: Click Delete on any item — a dialog should appear asking "Are you sure?" before proceeding.

- [ ] **New Sale works and reduces inventory stock**  
  HOW: Note the stock of an item → record a sale of that item with quantity 2 → go to Inventory → stock should be reduced by 2.

- [ ] **Sales date is today's actual date** (not hardcoded `"2026-03-31"`)  
  HOW: Create a new sale → check the date shown — it should be today.

- [ ] **Today's total in Sales page is correct**  
  HOW: Add up the amounts of today's sales manually → compare to the "Today's total" shown.

- [ ] **Low stock alerts match actual inventory**  
  HOW: Set an item's stock to 2 and minStock to 10 → go to Dashboard → that item should appear in Low Stock Alerts.

- [ ] **Dashboard stats reflect real data**  
  HOW: Verify "Today's Revenue" matches the sum of today's sales.

- [ ] **Export button downloads a real file**  
  HOW: Click Export on Reports page → a file should download to your computer.

---

# SECTION 3 — USER INTERFACE

- [ ] **App loads without console errors**  
  HOW: Open browser DevTools (F12) → Console tab → Load every page → zero red errors.

- [ ] **All buttons give feedback when clicked**  
  HOW: Click every button — each should do something visible (open a dialog, show a loading spinner, show a toast notification).

- [ ] **Success toast shows after adding an item**  
  HOW: Add an inventory item → a green notification should briefly appear.

- [ ] **Error toast shows when something fails**  
  HOW: Temporarily disconnect your internet → try adding an item → an error notification should appear.

- [ ] **Loading states show while data is fetching**  
  HOW: On a slow connection (DevTools → Network → throttle to "Slow 3G") → refresh the page → skeleton loaders should appear before data loads.

- [ ] **Empty state shows when search returns no results**  
  HOW: Search for `xyzabcnotapart` in Inventory → should see a friendly "No items found" message, not an empty table.

- [ ] **App is fully usable on mobile (320px–768px screens)**  
  HOW: Open DevTools → Toggle device toolbar → test on iPhone SE size (375px wide) → sidebar should be hidden, hamburger menu should appear, tables should be scrollable horizontally.

- [ ] **App is fully usable on tablet (768px–1024px)**  
  HOW: Test at 768px width — layout should not break.

- [ ] **Tables are horizontally scrollable on small screens**  
  HOW: On mobile, all table columns should be accessible by scrolling right, not cut off.

- [ ] **Sidebar works on mobile**  
  HOW: On mobile, click the hamburger menu → sidebar slides in → click a nav item → sidebar closes → correct page loads.

- [ ] **No text overflows or gets cut off**  
  HOW: Check on multiple screen sizes — no text should be cut off mid-word.

---

# SECTION 4 — CODE QUALITY

- [ ] **No TypeScript errors**  
  HOW: Run `npm run build` — zero TypeScript errors.

- [ ] **No ESLint errors**  
  HOW: Run `npm run lint` — zero errors (warnings are OK).

- [ ] **TypeScript strict mode is enabled**  
  HOW: Check `tsconfig.app.json` — `"strict": true` should be set.

- [ ] **No unused imports or variables**  
  HOW: Run `npm run lint` — check for unused variable warnings.

- [ ] **Dead files removed** (Index.tsx, NavLink.tsx if unused, App.css boilerplate)  
  HOW: These files should not exist in the project.

- [ ] **No hardcoded dates** in production code  
  HOW: Search for date strings like `"2026-03-31"` in source files — none should appear.

- [ ] **No `console.log` calls in production code**  
  HOW: Search for `console.log` in `src/` — remove any that are not in tests.

- [ ] **`console.error` in NotFound only logs, doesn't crash**  
  HOW: Navigate to a non-existent URL — the 404 page should show, console.error logs the path.

---

# SECTION 5 — PERFORMANCE

- [ ] **Production build size is reasonable**  
  HOW: Run `npm run build` → look at the output — main JS bundle should ideally be under 500KB.

- [ ] **App loads in under 3 seconds on a normal connection**  
  HOW: Open Chrome DevTools → Network tab → Disable cache → Reload → check "Load" time.

- [ ] **Images are optimized** (if any are used)  
  HOW: Check all images are WebP or have compression applied.

- [ ] **Google Fonts load correctly** (or are self-hosted for reliability)  
  HOW: Open the app with DevTools → Network tab → Look for `fonts.googleapis.com` requests — they should be status 200.

---

# SECTION 6 — DEPLOYMENT

- [ ] **Production build runs without errors**  
  HOW: Run `npm run build` → zero errors → run `npm run preview` → app loads correctly.

- [ ] **Environment variables are set in production host** (Vercel/Netlify)  
  HOW: Go to your hosting dashboard → Environment Variables section → all required variables should be set.

- [ ] **App loads at the production URL**  
  HOW: Open your Vercel/Netlify URL in a browser → the login page appears.

- [ ] **HTTPS is working** (padlock in browser address bar)  
  HOW: Check that the URL starts with `https://` and the padlock icon is visible.

- [ ] **Direct URL navigation works**  
  HOW: While logged in, type `/inventory` directly in the browser URL bar → the Inventory page loads (not a 404).

- [ ] **Supabase Site URL is configured** to match your production URL  
  HOW: Supabase → Authentication → URL Configuration → Site URL should match your production URL.

- [ ] **Database has at least the owner user created**  
  HOW: Supabase → Authentication → Users → your owner email should appear there.

- [ ] **Database tables exist with correct structure**  
  HOW: Supabase → Table Editor → verify `inventory`, `sales`, `activity_logs` tables exist.

---

# SECTION 7 — TESTING

- [ ] **All unit tests pass**  
  HOW: Run `npm test` → all tests green, zero failures.

- [ ] **Core flows have E2E test coverage**  
  HOW: Run `npx playwright test` → login flow, add item, new sale all pass.

---

# SECTION 8 — BRANDING & CONTENT

- [ ] **Page title says "AutoPartsPro" not "Lovable App"**  
  HOW: Check browser tab — it should say "AutoPartsPro — Spare Parts Management".

- [ ] **Meta description is correct**  
  HOW: View page source → meta description should describe the app, not say "Lovable Generated Project".

- [ ] **OG tags don't reference Lovable**  
  HOW: View page source → no `lovable.dev` references in meta tags.

- [ ] **Favicon is the AutoPartsPro icon** (not default Vite favicon)  
  HOW: Check browser tab → the icon should be a wrench, not the default.

---

# FINAL SIGN-OFF

Before going live, have someone else (ideally not you) test the app fresh from a new browser with no prior login. They should be able to:

1. See the login page
2. Try wrong credentials → see error
3. Log in with correct credentials
4. Navigate every page
5. Add, edit, delete an inventory item
6. Record a new sale
7. See the sale reflected in the sales page
8. Log out
9. Confirm they cannot access /dashboard after logging out

If they can do all of the above without confusion: **YOU ARE READY TO LAUNCH.**
