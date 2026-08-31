# QR-Login — निःशुल्क मोतियाबिंद शिविर पंजीकरण

Mobile-first Hindi registration for **त्रिशक्ति सेवा फाउंडेशन** and **RJ Shankara Eye Hospital, Varanasi**.

Camp date: **06 सितंबर 2026**

Public form: `/` and `/register`  
Admin dashboard: `/admin`

## Features

- Hindi registration form with 10-digit Indian mobile validation
- Unique registration numbers (`TSF-2026-00001`)
- Downloadable confirmation slip
- Protected admin dashboard (search, filters, status workflow, CSV export, printable QR)
- Postgres in production (Neon); embedded PGLite in local preview

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

Replace framed placeholders in `public/photos/` with approved portraits (same filenames):

- `narendra-modi.jpg`
- `yogi-adityanath.jpg`
- `ambarish-singh-bhola.jpg`

PNG also works if you update the paths in `src/lib/camp.ts`.

## License

Private camp operations use. Not for redistribution of personal data.
