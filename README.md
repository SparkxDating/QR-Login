# QR-Login — निःशुल्क मोतियाबिंद शिविर पंजीकरण

Mobile-first Hindi registration for **त्रिशक्ति सेवा फाउंडेशन** and **RJ Shankara Eye Hospital, Varanasi**.

Camp start: **चहनियाँ ब्लॉक में 15 सितंबर 2026 से कार्यक्रम का शुभारंभ होगा**

Public form: `/` and `/register`  
Admin dashboard: `/admin`

Live: [https://qr-login-six.vercel.app/register](https://qr-login-six.vercel.app/register)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SparkxDating/QRLogin&env=ADMIN_PASSWORD,DATABASE_URL&envDescription=Admin%20password%20and%20Neon%20Postgres%20URL&project-name=qr-login&repository-name=QRLogin)

## Features

- Hindi registration form with 10-digit Indian mobile validation
- Unique registration numbers (`TSF-2026-00001`)
- Downloadable confirmation slip
- Protected admin dashboard (search, filters, status workflow, CSV export, printable QR)
- Postgres in production (Neon); embedded PGLite in local preview

## Deploy on Vercel

The GitHub repo is already Vercel-ready (Nitro `vercel` preset + `vercel.json`).

1. Open **[Import QRLogin on Vercel](https://vercel.com/new/import?s=https://github.com/SparkxDating/QRLogin)**.
2. Import **SparkxDating/QRLogin** (Framework: Other / Nitro).
3. Set environment variables **before the first production deploy**:

| Variable | Required | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | **Yes** | Min 8 characters. Initial admin password. No default. |
| `DATABASE_URL` | **Yes** on Vercel | Neon/Postgres. Without it, registrations do not persist. |
| `ADMIN_SESSION_SECRET` | Optional | Cookie signing secret |
| `ADMIN_RECOVERY_CODE` | Optional | Min 8 characters. Forgot-password recovery. Never commit a real value. |
| `SUPER_ADMIN_USERNAME` | Optional | Super Admin username. Empty in `.env.example`. |
| `SUPER_ADMIN_PASSWORD` | Optional | Super Admin password, min 8 characters. Empty in `.env.example`. |

4. Easiest database: Vercel dashboard → Storage → **Neon** → create, then it fills `DATABASE_URL`.
5. Deploy. Public form is `https://YOUR-PROJECT.vercel.app/register`. Admin is `/admin`.

Re-deploys happen automatically on every push to `main` after the project is linked.

## Setup

```bash
cp .env.example .env
# set ADMIN_PASSWORD (required for /admin)
npm install
npm run dev
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `ADMIN_PASSWORD` | **Yes** for `/admin` | Initial admin login. After a password change, the stored hash is used. |
| `ADMIN_SESSION_SECRET` | Optional | Session signing secret |
| `ADMIN_RECOVERY_CODE` | Optional | Forgot-password recovery code. Empty in `.env.example`. |
| `SUPER_ADMIN_USERNAME` | Optional | Super Admin username. Empty in `.env.example`. |
| `SUPER_ADMIN_PASSWORD` | Optional | Super Admin password. Empty in `.env.example`. |
| `DATABASE_URL` | On deploy | Postgres connection string |

There is **no default admin password**. If `ADMIN_PASSWORD` is unset and no hashed password has been saved yet, admin login is disabled.

Super Admin uses `SUPER_ADMIN_USERNAME` + `SUPER_ADMIN_PASSWORD`. That role can delete registrations, reset the regular admin password, view activity logs, and log out all admin sessions. Regular admin cannot.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build + migrations
- `npm run typecheck` — TypeScript check

## Photos

Approved portraits and logo in `public/photos/`:

- `trishakti-seva-foundation.jpg`
- `narendra-modi.jpg`
- `yogi-adityanath.jpg`
- `ambarish-singh-bhola.jpg`
- `jagatguru-vijendra-saraswati.jpg`

## License

Private camp operations use. Not for redistribution of personal data.
