# Nawa Ayurveda — Website

Public website and admin dashboard for Nawa Ayurvedic Medical Center.

```
.
├── frontend/               React 19 + Vite + Tailwind CSS v4 + React Router
├── firestore.rules         Firestore security rules (access control + field validation)
├── firestore.indexes.json
└── firebase.json           Firebase CLI config (project nawaayurveda-9b51e, see .firebaserc)
```

There is no separate backend. The browser talks to **Firebase** directly:

| Concern | Firebase service |
| --- | --- |
| Admin login | Firebase Authentication (email + password) |
| Data | Cloud Firestore: `appointments`, `contacts`, `blogs`, `services`, `admins`, `meta` |
| Access control & validation | `firestore.rules` |
| Uploaded images | Compressed to WebP in the browser and stored inside the blog/service document |

## Development

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

No environment variables are required: the Firebase web config lives in `frontend/src/lib/firebase.js`
(it is public by design). `frontend/.env.example` lists optional overrides.

Admin panel: http://localhost:5173/admin/login

## Data model

| Collection | Public | Admin |
| --- | --- | --- |
| `appointments` | create only (status forced to `Pending`, date not in the past) | read / update / delete |
| `contacts` | create only (status forced to `New`) | read / mark read / delete |
| `blogs` | read where `published == true` | full access |
| `services` | read where `published == true` | full access |
| `admins/{uid}` | — | a signed-in user is an admin only if this document exists |

Admin pages keep a realtime listener per collection, so new bookings appear instantly and the
dashboard/reports analytics are computed in the browser (`frontend/src/services/analytics/`).
Day/week/month boundaries use `VITE_CLINIC_TIMEZONE` (default `Asia/Dubai`).

## Firebase setup

Requires the Firebase CLI (`npm i -g firebase-tools`, `firebase login`).

```bash
firebase deploy --only firestore      # deploy rules + indexes after editing firestore.rules
```

**Admins.** The first admin was created with `frontend/scripts/firebase-setup.mjs`, which also closed
admin self-registration (`meta/setup`). To add another admin: create the user in Firebase console →
Authentication, then add a document `admins/<their uid>` with `{ name, email, role: "admin" }`
(Firestore console). Change passwords in Authentication → Users (or "Reset password").

For a brand-new Firebase project, run once (after deploying the rules):

```bash
cd frontend
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' ADMIN_NAME='Clinic Admin' node scripts/firebase-setup.mjs
# optionally: ... node scripts/firebase-setup.mjs --import export.json
```

## Notes

- **Images** are limited to JPG/PNG/WEBP/AVIF up to 3 MB on selection, then resized (max 1600 px) and
  re-encoded to WebP so each stays under ~700 KB inside its Firestore document. External `https://`
  image URLs also work. To use Cloud Storage instead, upgrade the project to the Blaze plan.
- **Blog content** uses lightweight Markdown: blank line = new paragraph, `## ` heading, `- ` bullet,
  `**bold**`. It is rendered without `dangerouslySetInnerHTML`, so stored content cannot inject scripts.
- **Spam protection**: the rules validate every public write, but there is no rate limit. If the forms
  attract spam, enable Firebase App Check (reCAPTCHA Enterprise) for Firestore.

## Deployment (Hostinger)

1. `cd frontend && npm run build`, then zip the **contents** of `dist/` (including `.htaccess`).
2. In File Manager → `public_html`, delete the old `index.html` and `assets/`, upload the zip and extract it in place.
3. hPanel → Cache Manager → Purge All, then hard-reload the site (Ctrl+Shift+R).
