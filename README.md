# QR-Login — निःशुल्क मोतियाबिंद शिविर पंजीकरण

Mobile-first Hindi registration for **त्रिशक्ति सेवा फाउंडेशन** and **RJ Shankara Eye Hospital, Varanasi**.

Camp date: **06 सितंबर 2026**

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
| `ADMIN_PASSWORD` | **Yes** | Min 8 characters. No default. |
| `DATABASE_URL` | **Yes** on Vercel | Neon/Postgres. Without it, registrations do not persist. |
| `ADMIN_SESSION_SECRET` | Optional | Cookie signing secret |

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
| `ADMIN_PASSWORD` | **Yes** for `/admin` | Admin login. No fallback. |
| `ADMIN_SESSION_SECRET` | Optional | Session signing secret |
| `DATABASE_URL` | On deploy | Postgres connection string |

There is **no default admin password**. If `ADMIN_PASSWORD` is unset, admin login is disabled.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build + migrations
- `npm run typecheck` — TypeScript check

## Photos

Approved portraits in `public/photos/`:

- `narendra-modi.jpg`
- `yogi-adityanath.jpg`
- `ambarish-singh-bhola.jpg`
- `jagatguru-vijendra-saraswati.jpg`

## License

Private camp operations use. Not for redistribution of personal data.
