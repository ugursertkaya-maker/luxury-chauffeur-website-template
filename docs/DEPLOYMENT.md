# Deployment

The app builds to a self-contained Next.js standalone server listening on port
3000, packaged as a Docker image. It is designed to run behind a reverse proxy
that terminates TLS.

It has no dependency on any particular host. A small VPS is sufficient.

---

## Local development

```bash
npm ci
cp .env.example .env.local      # then fill it in
npm run dev                     # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve a completed build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check without emitting |

For local development set both URL variables to `http://localhost:3000`.

---

## Production build

```bash
npm ci
npm run build
npm start
```

`next.config.ts` sets `output: 'standalone'`, so the build produces
`.next/standalone/server.js` with its own minimal `node_modules`. That is what
the Docker image runs.

### Build-time environment

The build inlines every `NEXT_PUBLIC_*` variable into the client bundle. They
must be present **at build time**, not just at runtime:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_INSTAGRAM_HANDLE`
- `NEXT_PUBLIC_GOOGLE_REVIEW_URL`

Changing any of them means rebuilding the image, not just restarting it.

Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
`JWT_SECRET`, `PASSWORD_SALT`, …) are read at runtime and should be passed to
the container, never baked into the image.

**One exception: `RESEND_API_KEY` must also be present at build time.** The
Resend SDK throws on construction when the key is missing, and that happens
during Next's page-data collection, so the build fails with:

```
Error: Missing API key. Pass it to the constructor `new Resend("re_123")`
Failed to collect page data for /api/admin/drivers/send-credentials
```

Any non-empty value gets you through the build. Pass the real key at runtime.

### Resources

A full `next build` of this project needs roughly 2 GB of free memory. On a
1 GB VPS the build will be killed by the OOM reaper. Either build on a larger
machine (or in CI) and push the image, or add swap first.

---

## Docker

The included `Dockerfile` is a three-stage build: dependencies, build, runtime.

### Build

```bash
docker build \
  --build-arg NODE_ENV=production \
  -t chauffeur-site:latest .
```

If your `NEXT_PUBLIC_*` values differ per environment, pass them at build time
— either add `ARG`/`ENV` lines to the Dockerfile, or build with an `--env-file`
aware wrapper. They cannot be injected later.

### Run

```bash
docker run -d \
  --name chauffeur-site \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  --env-file /srv/chauffeur-site/.env.production \
  chauffeur-site:latest
```

Binding to `127.0.0.1:3000` rather than `0.0.0.0:3000` keeps the app
unreachable except through your proxy.

### Update

```bash
docker build -t chauffeur-site:latest .
docker stop chauffeur-site && docker rm chauffeur-site
docker run -d ... chauffeur-site:latest     # same flags as above
```

There is a brief outage between `stop` and `run`. For zero-downtime, run the
new container on a second port, flip the proxy's upstream, then retire the old
one.

### docker-compose

```yaml
services:
  web:
    build: .
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    env_file:
      - .env.production
```

---

## Reverse proxy

The app speaks plain HTTP on 3000. Your proxy handles TLS, HTTP/2 and
redirects.

### nginx

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # PDF invoices and the sitemap can take a while to generate.
    proxy_read_timeout 120s;

    # Stripe webhooks and inbound email can carry sizeable payloads.
    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        'upgrade';
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

> Do **not** add security headers at the proxy. `next.config.ts` already sets
> `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
> `Permissions-Policy` and HSTS. Duplicating them causes conflicting headers.

### Caddy

```
your-domain.com {
    reverse_proxy 127.0.0.1:3000
}
```

Caddy obtains and renews certificates automatically.

---

## Domain and DNS

| Record | Name | Value | Purpose |
|---|---|---|---|
| `A` | `@` | your server's IPv4 | the site |
| `A` | `www` | your server's IPv4 | www redirect |
| `AAAA` | `@` | your server's IPv6 | optional |
| `TXT` | `@` | SPF, from Resend | email deliverability |
| `CNAME`/`TXT` | per Resend | DKIM | email signing |
| `TXT` | `_dmarc` | your DMARC policy | email policy |
| `MX` | `@` | your inbound provider | only if using inbound email |

Pick one canonical host — apex or `www` — and 301 the other to it.
`NEXT_PUBLIC_SITE_URL` must be the canonical one, because it generates every
canonical tag and sitemap URL.

> `MX` records are exclusive. Adding them for an inbound-email provider will
> break any existing mail on that domain.

---

## SSL

With nginx, use Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
sudo certbot renew --dry-run     # confirm auto-renewal works
```

Certbot installs a renewal timer. Verify it: `systemctl list-timers | grep certbot`.

HSTS is set by the app with a two-year max-age and `preload`. That is a
long-lived commitment — browsers will refuse plain HTTP to your domain for that
period. Make sure HTTPS works properly before going live, and reduce
`Strict-Transport-Security` in `next.config.ts` if you are not ready for it.

---

## Database

Supabase is hosted, so there is nothing to deploy. Make sure:

- The production environment has the production project's URL and keys.
- `scripts/schema.sql` has been applied to the production project.
- Your admin user exists in production (run `scripts/create-admin.ts` against
  the production environment).
- Supabase's automatic backups suit your retention needs — check the
  **Database → Backups** page for what your plan actually includes.

Use a **separate Supabase project** for staging. Do not point a staging
deployment at production data.

---

## Cron

Three endpoints need an external scheduler. All three authenticate with a `?secret=` **query parameter** matching
`CRON_SECRET`.

> ⚠️ Passing a secret in the query string means it lands in web-server access
> logs and any proxy logs in between. See `KNOWN_ISSUES.md`.

```cron
0 9 * * * curl -fsS "https://your-domain.com/api/cron/reminders?secret=$CRON_SECRET"
0 2 1 * * curl -fsS "https://your-domain.com/api/cron/monthly-statement?secret=$CRON_SECRET"
0 2 2 * * curl -fsS "https://your-domain.com/api/cron/monthly-invoice?secret=$CRON_SECRET"
```

Use `-f` so a failing call is visible in cron mail rather than silently
succeeding. These jobs send real email — test them against test data first.

---

## Stripe webhook

- **Endpoint:** `https://your-domain.com/api/webhooks`
- **Events:** `payment_intent.succeeded` (plus `charge.refunded` if you refund)
- Copy the endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`

The handler verifies the signature and returns `400` on a mismatch, so a wrong
secret means no booking is ever marked paid. Check **Developers → Events** in
Stripe for delivery status.

Test mode and live mode have separate endpoints and separate signing secrets.

---

## Email

Outbound (Resend) needs no infrastructure beyond verified DNS. Inbound needs
`MX` records plus a webhook pointed at
`https://your-domain.com/api/webhooks/inbound-email` with
`INBOUND_EMAIL_SECRET` configured on both sides.

---

## Logs and troubleshooting

```bash
docker logs -f chauffeur-site           # application
docker logs --tail 200 chauffeur-site   # recent only
sudo tail -f /var/log/nginx/error.log   # proxy
docker stats chauffeur-site             # memory / CPU
```

| Symptom | Likely cause |
|---|---|
| `Missing required environment variable JWT_SECRET` | Secret not passed to the container. The app fails loudly here by design. |
| Build killed, no error | Out of memory. Build on a bigger machine or add swap. |
| Admin login always "Invalid credentials" | `scripts/schema.sql` not applied, or applied from an older copy missing `admin_users.role`. |
| All passwords suddenly rejected | `PASSWORD_SALT` changed. Restore the old value, or recreate users. |
| Payments never reach `paid` | Wrong `STRIPE_WEBHOOK_SECRET`, or the endpoint URL is unreachable. Check Stripe's Events tab. |
| Address autocomplete silent | Browser key missing, or the referrer restriction excludes this domain. |
| Quote fails after addresses entered | Server key missing, or Distance Matrix API not enabled. |
| Emails not arriving | Resend domain not verified, or the From address is not on the verified domain. |
| Canonical tags point at the wrong host | `NEXT_PUBLIC_SITE_URL` wrong at **build** time. Rebuild. |
| 502 from nginx | Container not running, or not listening on 3000. |

---

## Not covered here

This document does not set up monitoring, uptime checks, log aggregation,
staging environments, or a CI/CD pipeline. Those are worth adding, but they
depend on your hosting choices.
