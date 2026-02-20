# A3JM – Weekend Tuition Website

Company site and student registration for A3JM voluntary weekend tuition classes.

## Run with Docker Compose

From this directory:

```bash
docker compose up -d
```

This starts:

- **www** – Node app (port 3000) on `traefik_net`
- **www-db** – PostgreSQL 16 with persistent volume; `init-db.sql` creates the `registrations` table

Traefik (in the parent directory) routes **a3jm.com** and **www.a3jm.com** to this service.

## URLs

- https://a3jm.com  
- https://www.a3jm.com  
- http://a3jm.com / http://www.a3jm.com (redirect to HTTPS)

Path-based routes (e.g. /app1, /wazuh) still take precedence on a3jm.com.

## Environment

- `PORT` – default 3000  
- `DATABASE_URL` – default `postgresql://a3jm:a3jm_secret@www-db:5432/a3jm`  

Copy `.env.example` to `.env` to override.

## Database

Schema is applied on first start via `init-db.sql`. Data is stored in the `www_db_data` volume.

## Login and roles

- **Students** can register an account at `/register`, then log in at `/login`. They can submit class registrations from the home page or the student area (`/student`).
- **Admin** – Default admin account: **admin@a3jm.com** / **Admin@123**. Change the password after first login. Admin panel: `/admin` (only when logged in as admin). The admin sidebar links to Wazuh, Portainer, App1, App2, and Traefik (each opens in a new tab).
