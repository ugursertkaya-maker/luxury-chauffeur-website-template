# Setup Checklist

Work top to bottom. Each step assumes the ones above it are done.

Steps marked **[Required]** must be completed for the site to function.
Steps marked **[Optional]** switch on one feature and can be skipped or done
later.

Credential details for every external service are in
[`API_SETUP.md`](API_SETUP.md). This document is the *order* to do things in.

---

## Part 1 — Get it running locally

### 1. Prerequisites **[Required]**

- [ ] **Node.js 20 or newer** — `node --version`. The Docker image is built on
      `node:20-alpine`, so 20 is the reference version.
- [ ] **npm 10+** — ships with Node 20.
- [ ] **Git**.
- [ ] A code editor.

### 2. Get the code **[Required]**

```bash
git clone <this-repository-url> my-chauffeur-site
cd my-chauffeur-site
npm ci
```

Use `npm ci`, not `npm install` — it installs the exact versions in
`package-lock.json`.

> You will also want `tsx` to run the setup scripts. `npx tsx` fetches it on
> demand, so no separate install is needed.

### 3. Create the environment file **[Required]**

```bash
cp .env.example .env.local
```

Open `.env.local`. Everything in it is a placeholder; you will fill it in as you
go. For local development set:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Generate the auth secrets **[Required]**

```bash
openssl rand -hex 48    # -> JWT_SECRET
openssl rand -hex 32    # -> PASSWORD_SALT
```

Paste both into `.env.local`.

- [ ] `JWT_SECRET` set
- [ ] `PASSWORD_SALT` set

> ⚠️ Decide `PASSWORD_SALT` now and never change it. Changing it later
> invalidates every password in the database.

### 5. Set up the database **[Required]**

- [ ] Create a Supabase project ([API_SETUP §1](API_SETUP.md#1-supabase))
- [ ] Copy the three Supabase values into `.env.local`
- [ ] Open the Supabase **SQL Editor**, paste all of `scripts/schema.sql`, run it
- [ ] Confirm 26 tables exist under **Table Editor**

### 6. Create your admin login **[Required]**

```bash
npx tsx scripts/create-admin.ts owner 'a-long-random-password'
```

- [ ] Script printed `✓ Admin user ... created`

Use a long, unique, randomly generated password. Password hashing in this
project is weak — see [`KNOWN_ISSUES.md`](KNOWN_ISSUES.md).

### 7. Add Google Maps **[Required for booking]**

- [ ] Google Cloud project created with billing enabled
- [ ] Maps JavaScript, Places, Geocoding and Distance Matrix APIs enabled
- [ ] Browser key created and restricted → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] Server key created and restricted → `GOOGLE_MAPS_SERVER_KEY`

([API_SETUP §3](API_SETUP.md#3-google-maps-platform))

### 8. First run **[Required]**

```bash
npm run dev
```

- [ ] <http://localhost:3000> loads the homepage
- [ ] <http://localhost:3000/admin/login> accepts your admin credentials
- [ ] Typing an address on `/book` produces autocomplete suggestions

At this point you have a working site with placeholder branding and no content.

### 9. Load the sample content **[Optional but recommended]**

```bash
npx tsx scripts/seed-example.ts
```

This inserts two vehicles, a default pricing row, surcharges, and one or two
obviously-fake rows for each of the nine SEO content types.

- [ ] Script completed with `✓` lines and no `✖`

Every SEO row is created with `is_published = false`, so none of it reaches your
sitemap or search engines. It exists so you can see the page layouts before
writing real content.

> ⚠️ Do not publish the sample content. It names places that do not exist and
> the prices are arbitrary.

---

## Part 2 — Make it your business

### 10. Brand configuration **[Required]**

Open **`src/config/brand.ts`** — this is the single most important file.

- [ ] `company.legalName` — your registered entity, used on invoices
- [ ] `company.displayName` — customer-facing name
- [ ] `company.shortName` — for tight spaces
- [ ] `company.tagline` and `company.description`
- [ ] `contact.phone` — display format, e.g. `(555) 123-4567`
- [ ] `contact.phoneE164` — e.g. `+15551234567`
- [ ] `contact.emailInfo` and `contact.emailReservations`
- [ ] `address.*` — street, locality, region, regionName, postalCode, country
- [ ] `site.name`
- [ ] `social.facebook` / `instagram` / `linkedin` — real URLs, or leave `null`
- [ ] `service.areaServed` and `service.areaServedType`
- [ ] `service.serviceAreas` — footer city links (each needs a matching
      `seo_locations` row)
- [ ] `service.currency`, `priceRange`
- [ ] `service.salesTaxRate` / `surtaxRate` — your jurisdiction's rates, as
      decimals, or `0`

Leave `testimonials` and `aggregateRating` alone for now — see step 17.

Reload the site. The header, footer, homepage, metadata and email templates
should all show your details. 60 files read from this one file.

### 11. Logos and images **[Required]**

Replace the placeholders in `public/`:

- [ ] `public/logo-nav.svg` — header lockup, roughly 200×44
- [ ] `public/logo.svg` — square/stacked lockup, roughly 120×49
- [ ] `public/logo.png` — raster version for PDF invoices
      (`@react-pdf` cannot render SVG; this one **must** be a real PNG)
- [ ] `src/app/icon.svg` — favicon
- [ ] `public/vehicles/placeholder-suv.svg` → your own SUV photography
- [ ] `public/vehicles/placeholder-sedan.svg` → your own sedan photography
- [ ] `public/vehicles/capacity/*.svg` → your own seating and luggage diagrams

If you change filenames rather than replacing in place, update
`brand.assets.*` and the references in `src/app/vehicles/[id]/page.tsx`,
`src/app/page.tsx` and `src/app/book/page.tsx`.

> Use imagery you own or have licensed. The originals were removed from this
> template precisely because their licensing could not be established.

### 12. Fleet **[Required]**

In `/admin/vehicles`:

- [ ] Add each vehicle — name, category (`sedan` / `suv`), passenger and bag
      capacity, base price, description, features, image URL
- [ ] Deactivate or delete the two sample vehicles

Then update the richer detail pages in `src/app/vehicles/[id]/page.tsx`:

- [ ] `model` — your actual make and model
- [ ] `available` — how many you operate
- [ ] slide captions, luggage and seating counts

### 13. Pricing **[Required]**

In `/admin/pricing`:

- [ ] Set the **Default Rate (all areas)** row — base fares, per-mile rates,
      minimum fare, hourly and event rates for both sedan and SUV
- [ ] Review the surcharges (night, weekend, airport meet & greet)
- [ ] Use the built-in **rate tester** to price a few real routes and sanity
      check the output

The site ships with a single flat-rate policy. To price per region, add rows to
`county_pricing` and re-enable geocoding in
`src/app/api/pricing/lookup/route.ts` — the geocoder is still there, just
bypassed.

### 14. Email **[Required for notifications]**

- [ ] Resend account created
- [ ] Sending domain added and **Verified** (DNS: SPF + DKIM)
- [ ] `RESEND_API_KEY` set
- [ ] `brand.contact.emailReservations` is on the verified domain
- [ ] Sent yourself a test email from `/admin` and it arrived
- [ ] *(Optional)* `RESEND_AUDIENCE_ID` for the newsletter form

([API_SETUP §5](API_SETUP.md#5-resend))

### 15. Payments **[Required to take money]**

- [ ] Stripe account created, **in test mode**
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` set
      (`pk_test_…` / `sk_test_…`)
- [ ] Webhook endpoint created → `STRIPE_WEBHOOK_SECRET` set
- [ ] Completed a full test booking with card `4242 4242 4242 4242`
- [ ] Booking shows `confirmed` / `paid` in `/admin`
- [ ] Confirmation email received

🔴 **Before switching to live keys, read
[`KNOWN_ISSUES.md`](KNOWN_ISSUES.md#1-the-payment-amount-comes-from-the-browser).**
The payment amount is currently supplied by the browser.

### 16. SEO content **[Required for search traffic]**

The nine content types are database-driven, so this is content entry, not code.

For each type you want to use:

- [ ] Write real rows into the `seo_*` table (Supabase Table Editor, or adapt
      `scripts/seed-example.ts`)
- [ ] Fill `meta_title` (≈50–60 chars) and `meta_description` (≈150–160 chars)
- [ ] Write genuinely useful `intro_html` and `body_html`
- [ ] Add `faq_items` — these generate `FAQPage` structured data
- [ ] Cross-link via the `related_*` array columns
- [ ] Set `is_published = true` **only** on rows you have rewritten
- [ ] Delete every `SAMPLE —` row

Then:

- [ ] Check `/sitemap.xml` lists only your real pages
- [ ] Check `/robots.txt` is correct for your domain

### 17. Reviews **[Optional]**

Both review features ship switched off, deliberately.

- [ ] Add real reviews to `brand.testimonials` — only ones you have permission
      to publish. The homepage and SEO-page review bands stay hidden while the
      array is empty.
- [ ] Set `brand.aggregateRating` **only** to figures matching your public
      Google profile. This is emitted as structured data; invented ratings are
      treated as spam by search engines.

### 18. Legal pages **[Required]**

These contain placeholder text written for a different business and a different
jurisdiction. They are not legal advice and must be rewritten.

- [ ] `src/app/terms/page.tsx` — including the SMS consent section
- [ ] `src/app/privacy/page.tsx`
- [ ] `src/app/cancellation-policy/page.tsx` — must match what the refund logic
      in `src/lib/cancellation.ts` actually does
- [ ] `src/app/about/page.tsx` — the story, the stats band, and the insurance
      and licensing copy

> Only state licences, insurance and permits you actually hold.

### 19. Optional integrations **[Optional]**

- [ ] Inbound email webhook → admin inbox ([§6](API_SETUP.md#6-inbound-email-webhook))
- [ ] Gmail OAuth → inbox sync ([§7](API_SETUP.md#7-gmail-oauth))
- [ ] Cron jobs → reminders, statements, invoices ([§8](API_SETUP.md#8-cron-scheduled-jobs))
- [ ] Flight tracking ([§9](API_SETUP.md#9-flight-tracking))
- [ ] Twilio SMS ([§10](API_SETUP.md#10-twilio-sms)) — note A2P 10DLC in US/CA
- [ ] Google Analytics ([§11](API_SETUP.md#11-google-analytics-4)) — add a
      consent banner if you serve the EU/UK
- [ ] Instagram feed ([§12](API_SETUP.md#12-instagram-feed))
- [ ] Google review link ([§13](API_SETUP.md#13-google-reviews-link))

---

## Part 3 — Go live

### 20. Pre-flight **[Required]**

- [ ] `npx tsc --noEmit` — clean
- [ ] `npm run lint` — clean
- [ ] `npm run build` — succeeds (needs `RESEND_API_KEY` set; the Resend SDK
      throws at build time without it)
- [ ] No `SAMPLE —` content published
- [ ] No placeholder text left: search the repo for
      `Your Chauffeur Company`, `example.com`, `555) 000-0000`, `TODO`
- [ ] Read [`KNOWN_ISSUES.md`](KNOWN_ISSUES.md) in full

### 21. Domain, SSL and deploy **[Required]**

Follow [`DEPLOYMENT.md`](DEPLOYMENT.md). In summary:

- [ ] Domain registered, `A` record pointed at your server
- [ ] Production `.env` on the server with **production** values
- [ ] `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_BASE_URL` = your real `https://` origin
- [ ] Docker image built and running
- [ ] Reverse proxy forwarding to port 3000
- [ ] SSL certificate issued and auto-renewing

### 22. Repoint the external services **[Required]**

Everything configured against `localhost` now needs the real domain:

- [ ] Stripe: live keys, **new** live webhook endpoint, new signing secret
- [ ] Google Maps: add the production domain to the browser key's referrers;
      add the server IP to the server key
- [ ] Gmail OAuth: add the production redirect URI
- [ ] Resend: confirm the sending domain is still verified
- [ ] Cron: schedule against the production URL

### 23. Post-deployment checks **[Required]**

- [ ] Homepage loads over HTTPS with no mixed-content warnings
- [ ] `https://your-domain.com/sitemap.xml` returns your real pages
- [ ] `https://your-domain.com/robots.txt` shows your domain in the sitemap line
- [ ] Open Graph preview is correct (test with a real social share debugger)
- [ ] A complete booking succeeds, with a **live** card, for a small amount
- [ ] That booking shows `paid` in `/admin` and the Stripe webhook shows `200`
- [ ] Confirmation email arrives and is not in spam
- [ ] PDF invoice generates and shows your logo
- [ ] Admin, customer and corporate logins all work
- [ ] Mobile layout checked on a real phone
- [ ] Google Rich Results Test passes on the homepage and one SEO page
- [ ] Submit the sitemap in Google Search Console
- [ ] Refund your live test booking
