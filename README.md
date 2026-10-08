# Nawa Ayurveda — Full-Stack Website

Public website, REST API and admin dashboard for Nawa Ayurvedic Medical Center.

```
.
├── frontend/   React 19 + Vite + Tailwind CSS v4 + React Router
└── backend/    Node.js + Express 5 + MongoDB (Mongoose) + JWT
```

## Requirements

- Node.js 20+
- MongoDB (local service or a MongoDB Atlas connection string)

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # then fill in MONGO_URI, JWT_SECRET, ADMIN_* values
npm run seed-admin          # creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD
npm run seed-content        # optional: loads the 6 services and starter blog articles
npm run dev                 # http://localhost:5000/api
```

Generate a strong `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

To reset the admin password later, change `ADMIN_PASSWORD` in `.env` and run `npm run seed-admin -- --reset`.

## 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm run dev                 # http://localhost:5173
```

Admin panel: http://localhost:5173/admin/login

## API overview

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/auth/login` | public (rate-limited) |
| GET | `/api/auth/me` | admin |
| POST | `/api/appointments` | public (rate-limited) |
| GET | `/api/appointments?search=&status=&page=` | admin |
| GET / PUT / DELETE | `/api/appointments/:id` | admin |
| GET | `/api/blogs?category=&page=` | public (published only; admins may add `all=true`) |
| GET | `/api/blogs/:slug` | public (published only) |
| GET | `/api/blogs/id/:id` | admin |
| POST / PUT / DELETE | `/api/blogs`, `/api/blogs/:id` | admin (multipart, field `featuredImage`) |
| GET | `/api/services`, `/api/services/:slug` | public (published only; admins may add `all=true`) |
| POST / PUT / DELETE | `/api/services`, `/api/services/:id` | admin (multipart, field `image`) |
| POST | `/api/contacts` | public (rate-limited) |
| GET / PUT / DELETE | `/api/contacts`, `/api/contacts/:id` | admin |
| GET | `/api/dashboard` | admin (sidebar badge counts) |
| GET | `/api/analytics/overview` | admin — today's cards, contact & blog analytics, recent activity |
| GET | `/api/analytics/today` · `/week` · `/month?month=&year=` · `/year?year=` · `/custom?from=&to=` | admin — totals, status split, time series, top services |
| GET | `/api/analytics/services?period=…` | admin — most requested services |
| GET | `/api/analytics/appointments?period=…` | admin — status totals + time series |
| GET | `/api/analytics/report?period=…` | admin — PDF report download |
| GET | `/api/health` | public |

Analytics endpoints accept `basis=created` (default, date the request was received) or `basis=scheduled` (patient's preferred visit date). Day/week/month boundaries use `CLINIC_TIMEZONE` (default `Asia/Dubai`).

Admin requests send `Authorization: Bearer <token>`.

## Notes

- **Uploads** are stored in `backend/uploads/` and served at `/uploads/...`. Only JPG, PNG, WEBP and AVIF up to 3 MB are accepted; the file signature is checked, not just the extension. For multi-server or serverless hosting, move uploads to object storage (S3, Cloudinary, …).
- **Blog content** uses lightweight Markdown: blank line = new paragraph, `## ` heading, `- ` bullet, `**bold**`. It is rendered without `dangerouslySetInnerHTML`, so stored content cannot inject scripts.
- **Static images** for the public pages are registered in `frontend/src/data/images.js` (currently royalty-free Unsplash placeholders).
- **Rate limiting** is in-memory (per process). Use a shared store such as Redis if you run several API instances.
- **CORS**: set `CLIENT_URL` to your production frontend origin (comma-separate several origins).

## Production build

```bash
cd frontend && npm run build    # outputs frontend/dist (serve as a static SPA with index.html fallback)
cd backend && npm start
```
