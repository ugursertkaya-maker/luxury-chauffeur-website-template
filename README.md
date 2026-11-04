# Luxury Chauffeur Website Template

A complete, production-shaped website for a chauffeur, limousine or black-car
company — public marketing site, SEO content engine, online booking with card
payment, customer accounts, a corporate portal, a driver view, and a full admin
back office.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 and
Supabase. Self-hosts with Docker behind any reverse proxy.

> **This is a starting point, not a finished product.** It ships with
> placeholder branding and clearly-marked sample content. Read
> [`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md) before you deploy it — there
> are known defects, including security ones, that you are responsible for
> reviewing and fixing.

---

## What's in the box

| Area | Routes | What it does |
|---|---|---|
| **Marketing + SEO** | 18 | Nine database-driven content types (locations, airports, routes, hotels, cruise ports, attractions, destinations, services, blog), each with a hub and detail page. Dynamic sitemap, robots, JSON-LD structured data, generated Open Graph images. |
| **Booking funnel** | 7 | Address autocomplete, distance-based quoting, vehicle selection, Stripe payment, confirmation, and self-service management of an existing booking. |
| **Customer accounts** | 3 | Register, log in, view trip history, referral code. |
| **Corporate portal** | 6 | Separate login, company dashboard, book-on-account, monthly PDF invoices. |
| **Driver view** | 1 | Per-driver trip list with status progression. |
| **Admin back office** | 16 | Bookings calendar, fleet, drivers, pricing + rate tester, discounts, corporate accounts, earnings, ratings, subscribers, email inbox, users, audit log. |
| **API** | 64 | All of the above, plus Stripe webhooks, inbound email, and three cron endpoints. |

---

## Quick start

```bash
# 1. Install
npm ci

# 2. Configure
cp .env.example .env.local
#    then fill in .env.local — see docs/API_SETUP.md

# 3. Create the database
#    paste scripts/schema.sql into the Supabase SQL editor and run it

# 4. Create your admin login
npx tsx scripts/create-admin.ts owner 'a-long-random-password'

# 5. (optional) Load sample content so the site renders end-to-end
npx tsx scripts/seed-example.ts

# 6. Run
npm run dev        # http://localhost:3000
```

The minimum to get a page rendering is `NEXT_PUBLIC_SITE_URL`, the three
Supabase values, `JWT_SECRET` and `PASSWORD_SALT`. Everything else switches on
an individual feature — see
[`docs/FEATURE_DEPENDENCIES.md`](docs/FEATURE_DEPENDENCIES.md).

---

## Make it yours

**Start here: [`src/config/brand.ts`](src/config/brand.ts).** It is the single
source of truth for the company name, phone, emails, address, service area,
social links, logo paths and colours. 60 files read from it, so changing it once
updates the header, footer, homepage, emails, PDF invoices, metadata, canonical
URLs and structured data together.

Then:

1. Replace the placeholder images in `public/` — `logo.svg`, `logo-nav.svg`,
   `logo.png` (used by the PDF invoice renderer), and the vehicle images under
   `public/vehicles/`.
2. Replace `src/app/icon.svg` with your own favicon.
3. Set your real rates in `/admin/pricing`.
4. Add your vehicles in `/admin/vehicles`.
5. Write real SEO content to replace the samples, and publish it by setting
   `is_published = true`.
6. Rewrite `/about`, `/terms`, `/privacy` and `/cancellation-policy` for your
   own business and jurisdiction.

Full walkthrough: [`docs/CLIENT_SETUP_CHECKLIST.md`](docs/CLIENT_SETUP_CHECKLIST.md).

---

## Documentation

| Document | Read it when |
|---|---|
| [`docs/API_SETUP.md`](docs/API_SETUP.md) | Creating the external accounts and credentials |
| [`docs/CLIENT_SETUP_CHECKLIST.md`](docs/CLIENT_SETUP_CHECKLIST.md) | Setting the site up end to end, in order |
| [`docs/FEATURE_DEPENDENCIES.md`](docs/FEATURE_DEPENDENCIES.md) | Working out which features need which services |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Going to production |
| [`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md) | **Before** going to production |

---

## Content that is deliberately empty

Three things ship blank on purpose, because inventing them would be
misleading — and in the case of reviews, a search-engine policy violation:

- `brand.testimonials` — an empty array. The homepage and SEO-page review
  sections hide themselves until you add real, attributable reviews.
- `brand.aggregateRating` — `null`. The Google rating badge stays hidden until
  you set a rating you can actually substantiate.
- The `stats` band on `/about`, and the insurance and licensing copy — written
  as prompts, not claims. Only state what you genuinely hold.

---

## Project layout

```
src/
  app/
    (public)/        SEO content pages — hub + [slug] per type
    admin/           admin back office (16 pages)
    corporate/       corporate portal (6 pages)
    account/         customer accounts
    api/             64 route handlers
    book/            booking funnel
    layout.tsx       root layout, metadata, GA4
    sitemap.ts       dynamic sitemap
    robots.ts        robots.txt
  components/        shared UI; components/seo/ is the SEO page engine
  config/
    brand.ts         ← EDIT THIS FIRST
  lib/
    env.ts           required-secret accessors (no hardcoded fallbacks)
    seo/             metadata, canonical URLs, JSON-LD, queries
    pricing.ts       fare calculation
    email.ts         Resend transactional templates
  middleware.ts      route protection for /admin, /account, /corporate
scripts/
  schema.sql         full database schema — 26 tables
  create-admin.ts    bootstrap the first admin user
  seed-example.ts    clearly-marked sample content (unpublished drafts)
```

---

## Licence and responsibility

This repository is provided as a reusable website starting point. The recipient
is responsible for reviewing security, compliance, payment processing, privacy,
licensing, and production readiness before live deployment.

No warranty is given. Replace all placeholder content, supply your own imagery
and legal copy, and use your own accounts for every external service.
