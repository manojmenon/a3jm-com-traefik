# Zeal – Tools Learning & Labs Website

Node.js/Express site for Zeal tools learning and labs. Offers learning paths and hands-on labs; includes access request form and auth. Served by Traefik at **https://a3jm.com** and **https://www.a3jm.com**.

## Features

- **Public**: Home page, labs/learning section, get-started (access request) form (guest or logged-in).
- **Auth**: User and admin accounts; login/register; session stored in PostgreSQL.
- **User area** (`/student`) – view info and submit access requests when logged in.
- **Admin**: Dashboard (`/admin/dashboard`) – registrations/requests list and quick links to Wazuh, Portainer, Pi-hole, App1, App2, Traefik (opens in new tabs).
- **Left sidebar** (main page): Quick links to the same tools plus account (Login/Register or Admin Panel / My Area / Logout).

## Tech stack

- **Runtime**: Node.js (Express)
- **Database**: PostgreSQL 16 (Alpine image)
- **Auth**: `express-session` with `connect-pg-simple`, `bcrypt` for passwords
- **Front-end**: Static HTML/CSS/JS; no framework

## Run with Docker Compose

From this directory:

```bash
docker compose up -d
```

This starts:

- **www** – Node app (port 3000) on `traefik_net`; serves static files and API.
- **www-db** – PostgreSQL 16 with healthcheck; schema and seed data from `init-db.sql`.

Traefik (parent directory) routes **a3jm.com** and **www.a3jm.com** to the `www` service. The app must be on Docker network `traefik_net` (declared as `external: true` in this compose file).

## URLs

| URL | Description |
|-----|-------------|
| https://a3jm.com, https://www.a3jm.com | Main site (home, labs, get started). |
| https://a3jm.com/login | Login page. |
| https://a3jm.com/register | Create account. |
| https://a3jm.com/student | Your account (requires login). |
| https://a3jm.com/admin/dashboard | Admin panel (admin only). |

HTTP is redirected to HTTPS by Traefik. Path-based routes (e.g. `/wazuh`, `/portainer`) are handled by Traefik and take precedence over the default www route.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Port the app listens on inside the container. |
| `DATABASE_URL` | `postgresql://a3jm:a3jm_secret@www-db:5432/a3jm` | PostgreSQL connection string. |
| `SESSION_SECRET` | (dev default in code) | Secret for signing session cookies; **set in production**. |

Copy `.env.example` to `.env` and override as needed. Do not commit `.env`.

## Database

- **Schema**: Applied on first start via `init-db.sql` (mounted into Postgres init).
- **Persistence**: Data is stored in `./data/postgres` (bind mount). Ensure this directory exists or is created by compose; backup this folder for backups.
- **Tables**:
  - `users` – email, password hash (bcrypt), role (`student` | `admin`), full name.
  - `session` – express-session store (connect-pg-simple).
  - `registrations` – access requests (learning/labs); optional `user_id` to link to a user.

## Login and roles

- **Users**
  - Create account at `/register`, then log in at `/login`.
  - Can submit access requests from the home page or from the account area (`/student`).
- **Admin**
  - Default account: **admin@a3jm.com** / **Admin@123**. Change the password after first login.
  - Admin panel: **https://a3jm.com/admin/dashboard** (only when logged in as admin).
  - The admin sidebar links to Wazuh, Portainer, Pi-hole, App1, App2, and Traefik (each opens in a new tab).

**Important**: All admin redirects use **`/admin/dashboard`** (not `/admin`) so Traefik routes the request to this app instead of Pi-hole’s admin (which uses `/admin` with higher priority in Traefik).

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/login | - | Login; returns `{ success, role, redirect }`. |
| POST | /api/logout | - | Destroy session. |
| GET | /api/me | - | Current user or 401; used by header/sidebar. |
| POST | /api/register-account | - | Create student account (email, password, full name). |
| POST | /api/register | - | Submit access request (optional session to set `user_id`). |
| GET | /api/admin/registrations | Admin | List registrations for admin panel. |

Static pages: `/`, `/login`, `/register`, `/student`, `/admin/dashboard`, `/about`, `/labs`; `GET *` serves `index.html` for SPA-style fallback.

## Project layout

```
www/
├── README.md           # This file
├── docker-compose.yml  # www + www-db, traefik_net
├── Dockerfile          # Node app image
├── package.json
├── server.js           # Express app, routes, auth, API
├── init-db.sql         # Schema + session table + admin seed
├── .env.example
├── public/
│   ├── index.html      # Home, labs, get-started form
│   ├── login.html
│   ├── register.html
│   ├── student.html
│   ├── admin.html      # Admin dashboard and tool links
│   ├── styles.css
│   ├── app.js          # Registration form
│   ├── auth-header.js  # Header auth links
│   └── sidebar.js      # Sidebar links and auth
└── data/
    └── postgres/       # PostgreSQL data (gitignored; create or let compose create)
```

## Rebuild after code changes

After changing `server.js` or files in `public/`, rebuild and recreate the www container:

```bash
docker compose build www
docker compose up -d www
```

## Traefik integration

- The www service is defined in the parent Traefik `dynamic.yml` as service `www` → `http://www:3000`.
- Routers `www-default` (Host `a3jm.com`) and `www-www` (Host `www.a3jm.com`) use priority 50 so that path-based routes (e.g. `/wazuh`, `/pihole`, `/admin` for Pi-hole) take precedence.
- Admin panel uses **`/admin/dashboard`** so it is not routed to Pi-hole; Pi-hole’s Traefik rule excludes `PathPrefix(/admin/dashboard)` and `PathPrefix(/admin/registrations)`.

For full routing and Traefik setup, see the parent **traefik/README.md**.
