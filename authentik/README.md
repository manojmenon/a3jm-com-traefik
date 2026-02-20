# Authentik – Identity Provider

Authentik runs at **https://authentik.a3jm.com**, served by the main Traefik at `traefik/`. Data is stored in Docker named volumes only (no host path).

## Prerequisites

- Main Traefik running and `traefik_net` network created
- DNS: `authentik.a3jm.com` → your server IP (for Let's Encrypt)

## Setup

1. Copy env and set secrets:

   ```bash
   cp .env.example .env
   # Generate and set:
   # PG_PASS (e.g. openssl rand -base64 40)
   # AUTHENTIK_SECRET_KEY (e.g. openssl rand -base64 50)
   ```

2. Start:

   ```bash
   docker compose up -d
   ```

3. Open https://authentik.a3jm.com and create the first admin user.

## Volumes (no host path)

- `authentik_database` – PostgreSQL data
- `authentik_redis` – Redis data
- `authentik_media` – Uploaded media
- `authentik_templates` – Custom templates
- `authentik_certs` – Certificates

## Traefik

The router `authentik-dashboard` in `traefik/dynamic.yml` routes `Host(authentik.a3jm.com)` to this stack’s `authentik-server:9000` with forwarded headers for correct redirects.
