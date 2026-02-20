# Prometheus

Metrics collection – served by the main Traefik at **https://a3jm.com/prometheus**.

## Run

Ensure `traefik_net` exists (e.g. start the main Traefik stack first), then:

```bash
docker compose up -d
```

## Config

- **prometheus.yml** – scrape config; add more `scrape_configs` for your targets (Node Exporter, Docker, etc.).
