# Nawa Ayurveda — Full-Stack Website

Public website, REST API and admin dashboard for Nawa Ayurvedic Medical Center.

```
.
├── frontend/         React 19 + Vite + Tailwind CSS v4 + React Router + Firebase SDK
├── firestore.rules   Firestore security rules (who may read/write what)
├── firebase.json     Firebase Hosting + Firestore rules config
└── backend/          Legacy Express + MongoDB API (kept for the one-time data migration)
```

The live site runs entirely on Firebase (project `nawaayurveda-9b51e`): Hosting serves the
frontend, which reads and writes Firestore directly; the admin signs in with Firebase
Authentication. There is no separate API server in production.

## Requirements

- Node.js 20+
- MongoDB (local service or a MongoDB Atlas connection string)

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # then fill in MONGODB_URI and JWT_SECRET
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
npm run dev                 # http://localhost:5173 (uses the live Firebase project)
```

No environment variables are needed: the public Firebase web config is in
`frontend/src/lib/firebase.js`. Admin panel: http://localhost:5173/admin/login (Firebase
Authentication account with an `admins/{uid}` profile in Firestore).

## Deploy to Firebase

```bash
cd frontend && npm run build && cd ..
firebase deploy --only hosting           # website
firebase deploy --only firestore:rules   # only after editing firestore.rules
```

## Copy data from MongoDB to Firestore

```bash
cd backend
MONGODB_URI="<production MongoDB URI>" npm run migrate-firestore            # dry run
MONGODB_URI="<production MongoDB URI>" npm run migrate-firestore -- --write # copy
```

Keeps MongoDB ids, overwrites the same Firestore documents on re-runs and never deletes.

## Legacy: backend on Render

The repository includes a Render Blueprint at `render.yaml`. It deploys only `backend/` as a Node web service, using `npm ci`, `npm start`, and `/api/health` as its health check. You can also create a Web Service manually with Root Directory `backend`, Build Command `npm ci`, and Start Command `npm start`.

Set these environment variables in Render:

- `MONGODB_URI`: the existing MongoDB connection string. The backend also accepts the legacy `MONGO_URI` name.
- `JWT_SECRET`: a long, random secret. Render generates one through the Blueprint by default.
- `FRONTEND_URL`: the deployed frontend origin, without a path. Multiple origins can be comma-separated. The legacy `CLIENT_URL` name is also accepted.
- `CLINIC_TIMEZONE`: optional; defaults to `Asia/Dubai`.

The backend listens on Render's `PORT` and binds to `0.0.0.0`. Its `/api/health` response reports API status and database connectivity separately. To connect the frontend, set its build-time `VITE_API_URL` to `https://<your-render-service>.onrender.com/api` and rebuild/redeploy the frontend. Keep `.env` files and service credentials out of Git.

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
- **CORS**: set `FRONTEND_URL` to your production frontend origin (comma-separate several origins); `CLIENT_URL` remains supported for existing setups.

## Production build

```bash
cd frontend && npm run build    # outputs frontend/dist, deployed by Firebase Hosting
```
