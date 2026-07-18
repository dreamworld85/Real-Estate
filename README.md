# Kerala Realty

Mobile-first real estate web app for Kerala — React + TypeScript + Tailwind frontend,
Node/Express + MySQL backend.

## Project structure

```
kerala-realty/
  src/                  Frontend (Vite + React + TS + Tailwind)
  server/               Backend (Express + MySQL)
```

## Backend setup

1. Create a MySQL database and load the schema:
   ```bash
   mysql -u root -p -e "CREATE DATABASE kerala_realty"
   mysql -u root -p kerala_realty < server/schema.sql
   ```
2. Configure environment variables:
   ```bash
   cd server
   cp .env.example .env
   # edit .env with your DB_USER, DB_PASSWORD, and a random JWT_SECRET
   ```
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
   The API listens on `http://localhost:4000` by default. Health check: `GET /api/health`.

### API endpoints

| Method | Path                              | Auth | Description |
|--------|------------------------------------|------|--------------|
| POST   | `/api/auth/register`               | —    | Create account, returns `{ token, user }` |
| POST   | `/api/auth/login`                  | —    | `{ identifier, password }` → `{ token, user }` |
| GET    | `/api/properties`                  | —    | Browse listings. Query: `district`, `propertyType`, `purpose`, `status` (default `Active`) |
| GET    | `/api/properties/mine`             | ✓    | The logged-in user's own listings, any status |
| GET    | `/api/properties/:id`              | —    | Single listing detail (increments view count) |
| POST   | `/api/properties`                  | ✓    | Create a listing. `multipart/form-data`, images/video under the `media` field |
| PATCH  | `/api/properties/:id/status`       | ✓    | Owner toggles `Active` / `Inactive` / `Draft` |
| DELETE | `/api/properties/:id`              | ✓    | Delete own listing |
| GET    | `/api/admin/properties/pending`    | ✓*   | List pending listings for admin review |
| PATCH  | `/api/admin/properties/:id/review` | ✓*   | `{ decision: "approve" \| "reject" }` |

`✓*` — the admin routes only check that *some* user is logged in right now. Before shipping,
add a `role` column to `users` and gate these routes on it, so any logged-in user can't approve listings.

Uploaded files are served statically from `/uploads/<filename>`.

## Frontend setup

```bash
cp .env.example .env   # set VITE_API_URL if the API isn't on localhost:4000
npm install
npm run dev
```

Open the printed local URL — the app is mobile-first, so use your browser's device toolbar
(390px width) for the intended experience.

## Structure

```
src/
  components/     Reusable UI: Button, Input, Select, Header, BottomNav, PropertyCard,
                   RoleBadge, StatusBadge, StepProgress, ProtectedRoute
  screens/        One file/folder per screen
    AddProperty/  The 4-step Add Property wizard (Choose Role → Details → Media → More Info → Review → Success)
  lib/
    api.ts             Typed fetch client for the backend
    AuthContext.tsx    Holds the logged-in user + JWT (persisted to localStorage)
    AddPropertyContext.tsx  Shared form state across the wizard steps
    types.ts           Shared enums (ListingRole, PropertyStatus)
  App.tsx         Route table (React Router), protected routes redirect to /login
  main.tsx        App entry point (wraps App in AuthProvider)
```

## Design tokens

Defined in `tailwind.config.ts`:

| Token     | Hex       | Use                          |
|-----------|-----------|-------------------------------|
| `ink`     | `#0F3D3E` | Primary buttons, headers      |
| `forest`  | `#1B5E4F` | Secondary accents, links      |
| `gold`    | `#C89B3C` | Highlights, active states     |
| `cream`   | `#FAF8F3` | App background                |
| `sage`    | `#E8F0EA` | Card/section surfaces         |
| `charcoal`| `#22302E` | Body text                     |
| `coral`   | `#C0533E` | Destructive actions, inactive |
| `amber`   | `#D98C2B` | Pending status                |
| `slate`   | `#6B7A78` | Secondary text                |

Fonts: **Manrope** (headings, prices, nav) + **Inter** (body/forms).

## Status

**All 15 screens from the spec are built and wired to the real MySQL backend:**

- **Login/Register** — real auth (JWT)
- **Home Dashboard** — real `Active` listings, filterable by category
- **Add Property flow** — Choose Role → Details → Media (real file uploads) → More Info → Review → Submit → Success
- **My Properties** — tabs, Deactivate/Activate/Delete wired live
- **Owner Property Details** — views/enquiries/saves stats, Edit (placeholder)/Deactivate/Delete
- **Public Property Details** — Call/WhatsApp (via owner phone), Save (toggles live), Share (native share sheet or clipboard), Report (UI only)
- **Agency/Broker Profile** — listings count, distinct-enquirer count as "Happy Clients", years active (derived from account age), their active listings
- **Visitors & Enquiries** — total views/enquiries, recent enquirer list
- **Profile** — menu, logout
- **Edit Profile** — updates name/phone/email/location via the API
- **Search** — district/type/purpose filters + text search
- **Saved Properties** — the logged-in user's saved listings

**Still a placeholder:** "Edit Property" (button exists, doesn't yet open a pre-filled form —
would reuse the Add Property wizard's steps with initial values) and "Settings".

### Known simplifications worth knowing about

- The **admin approve/reject routes** (`/api/admin/...`) don't check for an actual admin role
  yet — any logged-in user's token works. Add a `role` column to `users` before shipping.
- **"Happy Clients"** and **"Years Active"** on the Agency profile are derived from real data
  (distinct people who've sent enquiries; time since account creation) rather than self-reported,
  since the schema doesn't have fields for those and the Edit Profile screen in the spec doesn't
  collect them either.
- **Report listing** is UI-only — no backend route handles it yet.

## Note on the in-chat interactive preview

The interactive artifact shown alongside this project is a **visual simulation** for quick
review — it still uses local component state and seed data, since browser-based artifacts
can't reach a real MySQL server. The actual database wiring lives only in this downloadable
project.
