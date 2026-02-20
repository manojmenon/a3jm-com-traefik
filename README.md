# A3JM Infrastructure & Web Stack

This repository contains the infrastructure and web applications for **A3JM** (weekend voluntary tuition classes): Traefik reverse proxy, the main company website with student registration, and path-based access to internal tools.

## Overview

- **Traefik** – Reverse proxy with automatic HTTPS (Let's Encrypt), routing for `a3jm.com` / `www.a3jm.com` and path-based routes for Wazuh, Portainer, Pi-hole, App1, App2, and Traefik dashboard.
- **www** – Node.js/Express company website and student registration app (PostgreSQL), served at `https://a3jm.com` and `https://www.a3jm.com`.
- **app1** / **app2** – Additional Node apps served at `/app1` and `/app2` (and `/new` for app2).
- **External services** (Wazuh, Portainer, Pi-hole) – Routed via Traefik from the same host; Wazuh Docker files are ignored in this repo.

## Repository layout

```
.
├── README.md                 # This file
├── .gitignore                # Pi-hole data, Wazuh Docker, env, certs
├── traefik/                  # Traefik + routing + app1/app2
│   ├── README.md             # Traefik & routing details
│   ├── docker-compose.yml    # traefik, app, app2
│   ├── traefik.yml           # Static config (entrypoints, ACME)
│   ├── dynamic.yml           # Routers, services, middlewares
│   ├── app1/                 # App at /app1
│   ├── app2/                 # App at /app2 and /new
│   └── www/                  # Main site (see www/README.md)
│       ├── README.md
│       ├── docker-compose.yml
│       ├── server.js
│       ├── init-db.sql
│       └── public/
└── pihole/                   # Pi-hole data (gitignored)
```

## Quick start

1. **Create the Traefik network** (once):
   ```bash
   docker network create traefik_net
   ```

2. **Start Traefik and apps** (from `traefik/`):
   ```bash
   cd traefik
   docker compose up -d
   ```

3. **Start the www site and database** (from `traefik/www/`):
   ```bash
   cd traefik/www
   docker compose up -d
   ```

4. **DNS**: Ensure `a3jm.com` and `www.a3jm.com` (and any subdomains you use) point to this host so Let's Encrypt can issue certificates.

See **traefik/README.md** for routing and services, and **traefik/www/README.md** for the website, auth, and database.

## Ignored / external

- **traefik/siem/wazuh/wazuh-docker/** – Ignored via `.gitignore`; run Wazuh separately and attach to `traefik_net` if using path/subdomain routing from `dynamic.yml`.
- **pihole/** – Pi-hole adlists and data (gitignored).
- **danger/** – Experimental or third-party content (e.g. unbound-docker); not part of core A3JM stack.

## License and contact

Internal use for A3JM. Adjust domains, secrets, and paths for your environment.
