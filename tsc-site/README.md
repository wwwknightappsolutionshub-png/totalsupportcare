# tsc-site

Vite + React public site, admin CMS, and HR UI for Total Support Care.

## Run locally

```bash
cd tsc-site
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Leave `VITE_API_BASE` empty so the Vite proxy forwards `/api` and `/uploads` to the API (same-origin cookies).

## Build

```bash
# Production build — set canonical origin for OG / SEO
# Windows PowerShell:
$env:VITE_SITE_URL="https://www.totalsupportcare.co.uk"
npm run build
npm run preview
```

Serve `dist/` behind your TLS reverse proxy. Prefer proxying `/api` and `/uploads` to `tsc-api` on the same host.

## Env

| Variable | Purpose |
|----------|---------|
| `VITE_SITE_URL` | Absolute canonical / Open Graph origin (no trailing slash) |
| `VITE_API_BASE` | Leave empty when API is same-origin via proxy; set only if API is on another origin |
