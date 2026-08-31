# QR-Login — निःशुल्क मोतियाबिंद शिविर पंजीकरण

Mobile-first Hindi registration for **त्रिशक्ति सेवा फाउण्डेशन** and **RJ Shankara Eye Hospital, Varanasi**.

Public form: `/` and `/register`  
Admin dashboard: `/admin`

## Features

- Hindi registration form with 10-digit Indian mobile validation
- Unique registration numbers (`TSF-2026-00001`)
- Downloadable confirmation slip
- Protected admin dashboard (search, filters, status workflow, CSV export, QR code)
- Postgres in production (Neon); embedded PGLite in local preview

## Setup

```bash
npm install
npm run dev
```

The app listens on port `8080`.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | On deploy | Postgres connection string |
| `ADMIN_PASSWORD` | **Yes in production** | Admin login |
| `ADMIN_SESSION_SECRET` | Optional | Session signing secret |

Local/preview admin password (only when `ADMIN_PASSWORD` is unset): `Trishakti@2026`

## Scripts

- `npm run dev` — development server
- `npm run build` — production build + migrations
- `npm run typecheck` — TypeScript check

## Photos

Replace placeholder silhouettes in `public/photos/` with approved portraits:

- `narendra-modi.svg`
- `yogi-adityanath.svg`
- `ambarish-singh-bhola.svg`

Or drop JPG/PNG files and update paths in `src/lib/camp.ts`.

## License

Private camp operations use. Not for redistribution of personal data.
