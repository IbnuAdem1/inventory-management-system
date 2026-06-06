# DEPLOYMENT GUIDE — AutoPartsPro

> This guide walks you through deploying the app step by step.  
> You do NOT need any prior deployment experience.  
> Every command and every click is explained.

---

## OVERVIEW

This app has two parts to deploy:

| Part | What it is | Where to host |
|---|---|---|
| Frontend (React) | The UI your browser loads | Vercel (free) |
| Backend (Supabase) | Database + API + Auth | Supabase (free tier) |

Supabase is already in the cloud — once you create your project (Phase 4 in the Implementation Plan), the backend is deployed automatically.

Your only job is to deploy the frontend.

---

## OPTION A — DEPLOY TO VERCEL (Recommended)

Vercel is the easiest way to deploy a Vite/React app. It's free, fast, and connects directly to GitHub.

### Step 1: Push your code to GitHub

If you haven't already, you need to put your code on GitHub.

**a. Create a GitHub account** if you don't have one: https://github.com/signup

**b. Create a new repository:**
1. Go to https://github.com/new
2. Name it `autopartspro`
3. Set it to **Private** (this is an internal business app)
4. Click "Create repository"

**c. Push your code from your computer to GitHub:**

Open a terminal (Command Prompt or PowerShell) in your project folder and run:

```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/autopartspro.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

**IMPORTANT:** Make sure `.env` is in your `.gitignore` before committing. Open `.gitignore` and confirm it has a line that says `.env`. If not, add it.

---

### Step 2: Connect Vercel to GitHub

1. Go to https://vercel.com
2. Click "Sign Up" and choose "Continue with GitHub"
3. Authorize Vercel to access your GitHub
4. Click "Add New Project"
5. Find your `autopartspro` repository and click "Import"
6. Vercel will auto-detect it as a Vite project — the settings are correct by default:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
7. **Before clicking Deploy:** You must add your environment variables (next step)

---

### Step 3: Add Environment Variables in Vercel

Still on the "Configure Project" page in Vercel:

1. Scroll down to the "Environment Variables" section
2. Add each variable:
   - Name: `VITE_SUPABASE_URL` → Value: your Supabase project URL
   - Name: `VITE_SUPABASE_ANON_KEY` → Value: your Supabase anon key
3. Click "Add" after each one

These come from your Supabase project → Settings → API.

---

### Step 4: Deploy

Click the "Deploy" button. Vercel will:
1. Download your code from GitHub
2. Run `npm install`
3. Run `npm run build`
4. Upload the `dist/` folder to their CDN
5. Give you a URL like `https://autopartspro-abc123.vercel.app`

This takes about 60–90 seconds.

---

### Step 5: Test your deployment

Open the Vercel URL in your browser. Test:
- [ ] Login page loads
- [ ] Login with correct credentials works
- [ ] Login with wrong credentials shows error
- [ ] All pages are accessible after login
- [ ] Inventory table loads from Supabase
- [ ] Adding an item works
- [ ] Logging out redirects to login

---

### Step 6: Automatic deployments (the best part)

Every time you push code to GitHub, Vercel automatically rebuilds and redeploys your app. No manual steps needed.

```
Edit code → git commit → git push → Vercel rebuilds automatically
```

---

## OPTION B — DEPLOY TO NETLIFY

An alternative to Vercel. The process is similar:

1. Go to https://netlify.com and sign up with GitHub
2. Click "Add new site" → "Import an existing project"
3. Choose your GitHub repo
4. Build settings: `npm run build`, publish directory: `dist`
5. Add environment variables under Site Settings → Environment variables
6. Click Deploy

---

## OPTION C — MANUAL DEPLOYMENT (VPS / cPanel)

If you have a web hosting account or a VPS server:

**a. Build the app locally:**
```
npm run build
```
This creates a `dist/` folder.

**b. Upload the `dist/` folder** to your web server using FTP or your hosting panel's file manager.

**c. Configure URL rewriting** so that all URLs route to `index.html` (required for React Router):

If using Apache, create a `.htaccess` file inside `dist/`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

If using Nginx, add to your server block:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## ENVIRONMENT VARIABLES REFERENCE

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes (Phase 4+) | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes (Phase 4+) | Your Supabase public/anon API key |

**Rules:**
- All Vite env variables must start with `VITE_`
- Access in code with: `import.meta.env.VITE_SUPABASE_URL`
- Never commit `.env` to Git
- Never use your `service_role` key in the frontend (only `anon` key)

---

## SUPABASE SETUP

### Create a new project

1. Go to https://app.supabase.com
2. Click "New project"
3. Set a strong database password and save it
4. Choose a region close to your users
5. Wait ~2 minutes for the project to spin up

### Get your API keys

1. In your Supabase project, go to Settings (gear icon)
2. Click "API"
3. Copy "Project URL" → this is your `VITE_SUPABASE_URL`
4. Copy "anon public" key → this is your `VITE_SUPABASE_ANON_KEY`

### Set up your database

Go to the SQL Editor in Supabase and run the CREATE TABLE statements from Task 4.2 in MASTER_IMPLEMENTATION_PLAN.md.

### Enable Email Auth

1. Go to Authentication → Providers
2. Email is enabled by default
3. Optionally: disable "Confirm email" for easier testing

### Create your first user (the owner)

1. Go to Authentication → Users
2. Click "Add user"
3. Enter email: `owner@autopartspro.com`
4. Enter a strong password
5. Click "Create user"

---

## MONITORING & UPKEEP

### Checking if your app is running

Vercel dashboard shows uptime and deployment status at https://vercel.com/dashboard.

### Checking for errors

Vercel shows function logs and build logs. For frontend JavaScript errors, you'll want to add error monitoring (optional — see below).

### Database backups

Supabase free tier includes daily automated backups. You can also export data manually:
1. Go to Supabase → Settings → Database
2. Click "Database Backups"

### Supabase free tier limits

| Resource | Limit |
|---|---|
| Database size | 500 MB |
| Monthly active users | 50,000 |
| Storage | 1 GB |
| Bandwidth | 5 GB/month |
| API requests | Unlimited |

For a small spare parts shop, you will not hit these limits.

---

## CUSTOM DOMAIN SETUP (Optional)

If you have a domain name (e.g., `autopartspro.com`):

**On Vercel:**
1. Go to your project → Settings → Domains
2. Add your domain
3. Vercel gives you DNS records to add to your domain registrar
4. SSL/HTTPS is automatic and free

**Where to buy a domain:** Namecheap, GoDaddy, or Google Domains (now Squarespace).

---

## TROUBLESHOOTING

### Build fails on Vercel

Run `npm run build` locally first. If it fails locally, the same error will happen on Vercel. Fix it locally first.

### "Page not found" on reload after deploying

You're missing the URL rewrite rule. In Vercel, this is handled automatically. In other hosts, see Option C above.

### Environment variables not working after deploy

Make sure:
1. Variable names start with `VITE_`
2. You added them in Vercel's dashboard (not just locally in `.env`)
3. You re-deployed after adding them

### Login works locally but not in production

Check that your Supabase project has the correct "Site URL" configured:
1. Supabase → Authentication → URL Configuration
2. Set "Site URL" to your Vercel URL (e.g., `https://autopartspro.vercel.app`)
3. Add your URL to the "Redirect URLs" list

---

## POST-DEPLOYMENT CHECKLIST

- [ ] App loads at the Vercel URL
- [ ] Login with real credentials works
- [ ] Signup creates a user in Supabase Auth → Users
- [ ] Database queries return real data
- [ ] Adding inventory item saves to Supabase
- [ ] Adding a sale saves to Supabase and updates inventory stock
- [ ] Logout redirects to login
- [ ] Direct URL access to `/dashboard` without login redirects to `/`
- [ ] HTTPS is working (padlock icon in browser)
- [ ] No `console.error` messages in browser DevTools
