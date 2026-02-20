# Grafana

Dashboards – served by the main Traefik at **https://a3jm.com/grafana**.

## Run

Ensure `traefik_net` exists (e.g. start the main Traefik stack first), then:

```bash
docker compose up -d
```

## Login

Default credentials: **admin** / **admin**. Change the password on first login, or set `GF_SECURITY_ADMIN_PASSWORD` in a `.env` file (see `.env.example`).

## Datasource

A Prometheus datasource is auto-provisioned pointing at `http://prometheus:9090` (Prometheus container on `traefik_net`). Start Prometheus before or with Grafana.
