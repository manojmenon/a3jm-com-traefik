# Traefik Reverse Proxy – A3JM

Traefik v3 reverse proxy for **a3jm.com**: automatic HTTPS (Let's Encrypt), routing for the main website, and path-based and subdomain routes for Wazuh, Portainer, Pi-hole, App1, App2, and the Traefik dashboard.

## Requirements

- Docker and Docker Compose
- Network `traefik_net` (create with `docker network create traefik_net`)
- DNS: `a3jm.com` and `www.a3jm.com` (and optional subdomains) pointing to this host for ACME HTTP challenge

## Files

| File | Purpose |
|------|--------|
| `docker-compose.yml` | Defines `traefik`, `app` (app1), and `app2`; all use `traefik_net`. |
| `traefik.yml` | Static config: API/dashboard, entrypoints (80 → HTTPS, 443), file provider, Let's Encrypt. |
| `dynamic.yml` | All HTTP routers, middlewares, and services (path-based and subdomain). |
| `acme.json` | Let's Encrypt storage (create empty `{}`, chmod 600; **gitignored**). |

## Running

From this directory:

```bash
docker compose up -d
```

This starts:

- **traefik** – Listens on 80 (redirect to HTTPS) and 443; reads `traefik.yml` and `dynamic.yml`; uses `acme.json` for certificates.
- **app** – Built from `./app1`, backend for `/app1`.
- **app2** – Built from `./app2`, backend for `/app2` and `/new`.

The **www** site and **www-db** run from `www/docker-compose.yml` (see `www/README.md`). Portainer, Pi-hole, and Wazuh are separate stacks; they must be on `traefik_net` and match the service names/hosts in `dynamic.yml`.

## Entrypoints

- **web (80)** – Redirects all HTTP to HTTPS (websecure).
- **websecure (443)** – TLS termination; certificates from Let's Encrypt.

## Routing summary

### Main site (www)

| Host | Service | Notes |
|------|---------|--------|
| `a3jm.com` | www | Priority 50; path-based routes (below) take precedence. |
| `www.a3jm.com` | www | Same site. |

### Path-based routes on `a3jm.com`

All require HTTPS. Paths are stripped before forwarding unless noted.

| Path | Service | Backend | Notes |
|------|---------|---------|--------|
| `/` (default) | www | http://www:3000 | Company site, registration, login. |
| `/wazuh`, `/wazuh/` | wazuh | https://wazuh.dashboard:5601 | Wazuh dashboard; no strip (base path in app). |
| `/portainer`, `/portainer/` | portainer | https://portainer:9443 | Portainer UI. |
| `/pihole`, `/pihole/` | pihole | http://pihole:80 | Pi-hole admin; uses `pihole-headers` and path stripping. |
| `/app1`, `/app1/` | app | http://app:3000 | App from `./app1`. |
| `/app2`, `/app2/` | app2 | http://app2:4000 | App from `./app2`. |
| `/new`, `/new/` | app2 | http://app2:4000 | Same app2 container. |
| `/traefik`, `/traefik/dashboard`, `/traefik/api` | api@internal | Traefik API/dashboard | Dashboard at `/traefik/dashboard/`; API for dashboard data. |

### Subdomain routes (optional)

Require DNS for the subdomain.

| Host | Service |
|------|---------|
| `wazuh.a3jm.com` | wazuh |
| `portainer.a3jm.com` | portainer |
| `pihole.a3jm.com` | pihole |
| `traefik.a3jm.com` | api@internal (Traefik dashboard) |

### Pi-hole and www app path split

- **Pi-hole** uses `/admin` (and `/api` for its own API). To avoid clashes with the www app’s admin:
  - www app admin is at **`/admin/dashboard`** (and `/admin/registrations` for API).
  - Traefik rule for Pi-hole excludes `PathPrefix(/admin/dashboard)` and `PathPrefix(/admin/registrations)` so those go to www.

## Middlewares (concept)

- **strip-*-prefix** – Strip path (e.g. `/pihole`, `/app1`) before sending to backend.
- **redirect-*-slash** – Redirect e.g. `/wazuh` → `/wazuh/`.
- **pihole-headers** – Set `X-Forwarded-Proto`, `X-Forwarded-Host`, `X-Forwarded-Prefix` for Pi-hole.
- **add-pihole-admin-prefix** – Rewrite `/admin` → `/admin/index.php` for Pi-hole.
- **replace-path-pihole-login** – Rewrite `/login` → `/admin/login.php` for Pi-hole (when used with Pi-hole route).

## Services in `dynamic.yml`

- **www** – http://www:3000 (from `www/` stack).
- **app** – http://app:3000 (app1).
- **app2** – http://app2:4000.
- **wazuh** – https://wazuh.dashboard:5601 (insecure TLS allowed).
- **portainer** – https://portainer:9443 (insecure TLS allowed).
- **pihole** – http://pihole:80.
- **api@internal** – Traefik API/dashboard.

Portainer and Pi-hole must be started separately (e.g. their own compose files) and attached to `traefik_net` with container names `portainer` and `pihole`. Wazuh dashboard container must be named and reachable as per your Wazuh setup (e.g. `wazuh.dashboard` on `traefik_net`).

## TLS

- Certificates are obtained automatically via Let's Encrypt (HTTP challenge).
- ACME data is stored in `./acme.json`; ensure it exists (e.g. `echo '{}' > acme.json && chmod 600 acme.json`) and is not committed.

## Traefik dashboard

- **Path-based**: https://a3jm.com/traefik/dashboard/
- **Subdomain** (if DNS set): https://traefik.a3jm.com

The dashboard uses Traefik’s API; path-based routing for `/traefik/api` and `/api/http/*` etc. is configured so the UI can load data correctly.

## Wazuh Docker

The directory `traefik/siem/wazuh/wazuh-docker/` is **gitignored**. To use Wazuh:

1. Run Wazuh (e.g. single-node) elsewhere or restore that directory.
2. Ensure the Wazuh dashboard container is on `traefik_net` and that `dynamic.yml`’s wazuh service URL (e.g. `https://wazuh.dashboard:5601`) matches your setup.

## See also

- **www/README.md** – Main site, auth, database, and how it fits with Traefik.
