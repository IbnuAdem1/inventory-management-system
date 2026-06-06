# ENVIRONMENT VARIABLES SETUP GUIDE — AutoPartsPro

> Environment variables are like a secret configuration file.  
> They hold sensitive values (API keys, passwords, URLs) OUTSIDE your code,  
> so you never accidentally share them on GitHub.

---

## WHAT IS AN ENVIRONMENT VARIABLE?

Imagine you have a key to a database. You don't want to write that key directly in your code because:
- If you push your code to GitHub, anyone can see it
- Different environments (your computer, the production server) need different values

Environment variables solve this. They live in a special file (`.env`) that:
- Never gets committed to Git
- Can have different values for each environment
- Is read by Vite and made available in your code

---

## YOUR `.env` FILE

Create a file named exactly `.env` (with a dot at the start, no extension) in the root folder of your project — same folder as `package.json`.

### Current variables needed (Phase 4+):

```
VITE_SUPABASE_URL=https://abcdefghijkl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxx
```

### How to get these values:

1. Go to https://app.supabase.com
2. Open your project
3. Click the gear icon (Settings) on the left
4. Click "API"
5. Copy:
   - "Project URL" → paste after `VITE_SUPABASE_URL=`
   - "anon public" key → paste after `VITE_SUPABASE_ANON_KEY=`

---

## HOW TO ACCESS ENV VARIABLES IN CODE

In any `.ts` or `.tsx` file:

```typescript
// Reading an environment variable:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

**RULES:**
- All variable names MUST start with `VITE_` for Vite to expose them to your code
- Variables without `VITE_` prefix are hidden from the browser for security
- Never access `import.meta.env.SECRET_KEY` (no VITE_ prefix) from frontend code

---

## THE `.env.example` FILE

Create a second file called `.env.example`. This file IS committed to Git — it shows teammates what variables are needed, without revealing the actual secret values:

```
# Copy this file to .env and fill in your values
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## `.gitignore` — PROTECTING YOUR SECRETS

Open your `.gitignore` file (in the project root). Confirm it has these lines:

```
# Environment variables — NEVER commit these
.env
.env.local
.env.production
.env.*.local
```

If `.env` is not in `.gitignore`, add it NOW before doing anything else.

**How to check if `.env` is already tracked by Git:**
```
git status
```
If you see `.env` listed, run:
```
git rm --cached .env
```
Then commit that change.

---

## ENVIRONMENT VARIABLE REFERENCE TABLE

| Variable | Required From | Description | Where to find |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Phase 4 | Your Supabase project's base URL | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Phase 4 | Public API key for Supabase | Supabase → Settings → API → anon/public |

> More variables may be added as the app grows. Always update `.env.example` when adding new variables.

---

## SETTING ENVIRONMENT VARIABLES FOR DEPLOYMENT

Your `.env` file only works on YOUR computer. When deploying to Vercel or another host, you must add the same variables through their dashboard.

### Vercel:
1. Go to https://vercel.com → your project
2. Settings → Environment Variables
3. Add each variable with its value
4. Click Save
5. Redeploy the project for changes to take effect

### Netlify:
1. Site Settings → Build & Deploy → Environment
2. Add each variable
3. Trigger a new deploy

### Manual server (Linux):
```bash
export VITE_SUPABASE_URL=https://your-url.supabase.co
export VITE_SUPABASE_ANON_KEY=your-key
npm run build
```

---

## COMMON MISTAKES

| Mistake | What happens | Fix |
|---|---|---|
| Forgot `VITE_` prefix | Variable is `undefined` in code | Rename it to start with `VITE_` |
| Added `.env` to Git | Secrets are exposed on GitHub | Remove with `git rm --cached .env`, add to `.gitignore` |
| Forgot to add variables on Vercel | App works locally, fails in production | Add the same variables in Vercel dashboard |
| Space around the `=` sign | Variable doesn't parse | Write `KEY=value` not `KEY = value` |
| Quotes around values | May include quotes as part of value | Don't use quotes: `KEY=value` not `KEY="value"` |
| Changed `.env` but didn't restart dev server | Old values still in memory | Stop and restart `npm run dev` |

---

## VERIFYING YOUR SETUP

After creating `.env`, restart the dev server and open the browser console. You can temporarily add this to `main.tsx` (remove it after checking):

```typescript
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
```

If it prints your URL, the environment variables are working correctly.

---

## SECURITY NOTES

- The `anon` key IS visible to users in the browser. This is by design. It's safe because Supabase Row Level Security (RLS) policies control what users can actually DO with it.
- Never use the `service_role` key in your frontend. The `service_role` key bypasses all security policies.
- Never store passwords in environment variables that are read by the frontend. Passwords go to the backend only.
- Rotate your keys if you accidentally expose them (Supabase → Settings → API → Regenerate keys).
