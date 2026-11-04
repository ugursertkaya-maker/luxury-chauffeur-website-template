# Known Issues

> **This repository is provided as a reusable website starting point. The
> recipient is responsible for reviewing security, compliance, payment
> processing, privacy, licensing, and production readiness before live
> deployment.**

The defects below were found while preparing this template for distribution.
They are **inherited from the upstream project and left in place** — the scope
of that work was distribution preparation, not security hardening. They are
documented here so you can make your own decisions rather than discover them in
production.

Each item names the file and line so you can go straight to it. Severity is
this author's judgement; weigh it against your own risk.

Two exceptions were fixed, because the template could not be shipped otherwise:
the hardcoded secrets (§A) and the missing `admin_users.role` column (§B). Both
are described at the end.

---

## 🔴 Critical — fix before accepting real payments

### 1. The payment amount comes from the browser

**`src/app/api/create-payment-intent/route.ts:5,28`**

```ts
const { bookingId, amount, gratuity = 0 } = await request.json()
...
amount: Math.round(amount * 100),
```

The route loads the booking row from the database but never compares `amount`
against `booking.total_price`. Whatever the client sends is what Stripe
charges.

**Failure scenario.** A customer books a $500 airport transfer, opens dev
tools, and re-issues the `POST /api/create-payment-intent` request with
`"amount": 1`. Stripe takes $1. The webhook fires `payment_intent.succeeded`,
and the booking is marked `paid` and `confirmed` — because the webhook only
checks that *a* payment succeeded, not that it was the right amount. The trip
is now confirmed for $1.

**Fix.** Ignore the client's `amount` entirely. Recompute server-side from
`booking.total_price` plus any server-validated gratuity, and use that. As a
second layer, verify `paymentIntent.amount` against the booking total in the
webhook handler before marking it paid.

---

## 🟠 High

### 2. Password hashing is a single unsalted-per-user SHA-256

**`src/lib/password.ts`**, **`src/lib/customer-auth.ts`**,
**`src/lib/corporate-auth.ts`**, **`src/app/api/driver/route.ts`**

```ts
createHash('sha256').update(password + passwordSalt('admin')).digest('hex')
```

SHA-256 is a fast hash. A commodity GPU tries billions of candidates per
second. The salt is global per scope, not per user, so one precomputation
attacks every account at once, and identical passwords produce identical
hashes.

**Failure scenario.** Your database is exposed — a leaked service-role key, a
Supabase misconfiguration, a backup left readable. An attacker recovers most
passwords offline within hours, including admin accounts, and reuses them
against your customers' other services.

**Fix.** Move to `bcrypt`, `scrypt` or `argon2id` with a per-user salt. All four
call sites go through `passwordSalt()` in `src/lib/env.ts`, so the change is
contained. Plan a migration path: re-hash on next successful login, keeping a
column that records which scheme each row uses.

### 3. `/api/contact` is an unauthenticated, unthrottled public write

**`src/app/api/contact/route.ts`**

No authentication, no rate limit, no CAPTCHA, no size cap. It inserts straight
into `inbound_emails`. It also accepts a `to` field from the request body and
stores it as `to_email`:

```ts
const { name, email, subject, message, to } = await request.json()
...
to_email: to ?? brand.contact.emailInfo,
```

To be precise: **this route does not send email**, so it is not an open relay.
The risk is database abuse and a spoofable recipient label in your admin inbox.

**Failure scenario.** A script posts 100,000 rows overnight. Your admin inbox is
unusable, your Supabase row quota is consumed, and the `to_email` values are
attacker-chosen so inbox filtering by recipient cannot be trusted.

**Fix.** Drop `to` from the accepted payload — the UI only ever offers two
fixed addresses, so derive it server-side. Add rate limiting by IP, a length
cap on `message`, and a bot check.

### 4. The database has no indexes

**`scripts/schema.sql`**

26 tables, zero `create index` statements. Only primary keys and unique
constraints are indexed.

Every SEO page render runs `where slug = ? and is_published = true` — a
sequential scan. So does every booking lookup by `booking_number`, every
customer lookup by email, and the webhook's lookup by
`stripe_payment_intent_id`.

**Failure scenario.** Fine at 78 rows. At a few thousand SEO pages and tens of
thousands of bookings, page loads degrade steadily and the sitemap route starts
timing out. It will feel like "the site got slow" with no single cause.

**Fix.** Add indexes before you load real content:

```sql
create index if not exists idx_seo_locations_slug    on seo_locations(slug) where is_published;
create index if not exists idx_seo_airports_slug     on seo_airports(slug) where is_published;
create index if not exists idx_seo_routes_slug       on seo_routes(slug) where is_published;
create index if not exists idx_seo_hotels_slug       on seo_hotels(slug) where is_published;
create index if not exists idx_seo_cruise_ports_slug on seo_cruise_ports(slug) where is_published;
create index if not exists idx_seo_attractions_slug  on seo_attractions(slug) where is_published;
create index if not exists idx_seo_destinations_slug on seo_destinations(slug) where is_published;
create index if not exists idx_seo_services_slug     on seo_services(slug) where is_published;
create index if not exists idx_seo_blog_slug         on seo_blog(slug) where is_published;

create index if not exists idx_bookings_number    on bookings(booking_number);
create index if not exists idx_bookings_email     on bookings(email);
create index if not exists idx_bookings_date      on bookings(pickup_date);
create index if not exists idx_bookings_pi        on bookings(stripe_payment_intent_id);
create index if not exists idx_inbound_received   on inbound_emails(received_at desc);
create index if not exists idx_customers_email    on customers(email);
```

### 5. Row-level security is enabled but fully permissive

**`scripts/schema.sql`** (near the end)

```sql
alter table bookings enable row level security;
create policy "service_role_all" on bookings for all using (true);
```

RLS is enabled on three tables, then a policy allows everything. 23 tables have
no RLS at all.

In this architecture that is *survivable*, because every query goes through
server-side routes using the service-role key, which bypasses RLS anyway. But it
means the database has no defence of its own.

**Failure scenario.** The `anon` key is public by design. If any table is ever
exposed through the Data API without RLS, that key can read it directly from a
browser — customer names, emails, phone numbers, trip addresses.

**Fix.** Confirm in the Supabase dashboard which tables are exposed through the
Data API, and disable API exposure for everything this app does not need
client-side. Treat the permissive policies as placeholders.

### 6. Cron secrets travel in the query string

**`src/app/api/cron/reminders/route.ts:6`** and the other two cron routes

```ts
if (searchParams.get('secret') !== process.env.CRON_SECRET)
```

Query strings are written to nginx access logs, proxy logs, and any
intermediate logging. The secret will end up in plain text on disk.

Comparison is also non-constant-time, though that is a minor concern over a
network.

**Fix.** Read the secret from an `Authorization` header instead, and compare
with a timing-safe equality function.

---

## 🟡 Medium

### 7. A failed confirmation email makes a successful booking look failed

**`src/app/api/bookings/route.ts:114`**

The booking row is inserted, then `await resend.emails.send(...)` runs with no
error handling. Later sends in the same file use `.catch(() => {})`; this one
does not.

**Failure scenario.** Resend has a brief outage. The customer sees an error and
books again — or phones you. You now have duplicate bookings, or a booking the
customer believes failed. The row is in the database either way.

**Fix.** Wrap it, log the failure, and still return success. Email is not
part of the booking transaction.

### 8. `/privacy` and `/terms` are missing from the sitemap

**`src/app/sitemap.ts`**

The `staticPages` array lists 14 routes and omits both legal pages, while
`/cancellation-policy` is included.

**Fix.** Add them.

### 9. The homepage and the public layout have different footers

**`src/app/page.tsx`** (its own ~90-line footer) vs
**`src/app/(public)/layout.tsx`**

The homepage is at the route root, outside the `(public)` group, so it renders a
separate footer. The two disagree: the homepage footer shows the phone number,
the public one does not. Neither links to `/privacy` or `/terms`.

**Fix.** Extract one `<Footer />` component and use it in both places.

### 10. Hover states that do not change anything

Throughout `Navbar.tsx`, both footers, and several pages:

```tsx
className="text-white hover:text-white"
```

The hover colour equals the base colour, so links give no feedback. This looks
like collateral damage from an incomplete palette change upstream.

**Fix.** Pick a real hover colour, or use opacity.

### 11. The palette is half-migrated

`globals.css` still defines `--gold`, `--gold-light`, `--gold-dark`, and
`#D4A017` appears in roughly 160 places — mostly as `border-[#D4A017]/10`
hairlines — even though the upstream project's last UI pass was meant to remove
gold.

The result is a dark theme with faint gold borders and a slate-and-gold email
and PDF template that do not match each other.

**Fix.** Decide your palette deliberately in `brand.colors`, then sweep the
hardcoded hex values. Worth doing early; it gets more expensive later.

### 12. `NEXT_PUBLIC_BASE_URL` duplicates `NEXT_PUBLIC_SITE_URL`

Read in one place only — the corporate invite email. Forget it and corporate
invite links point at `https://example.com`.

**Fix.** Delete it and use `brand.site.url`.

### 13. Service claims are hardcoded, not configured

`src/components/seo/SeoPageTemplate.tsx` asserts "60 Min Free Wait",
"Meet & Greet", "Fixed Pricing" on every SEO page.
`src/app/vehicles/[id]/page.tsx` asserts "60 min wait (airport) · 30 min (all
other)" and "Free to cancel up to 1 hour before".

That last one contradicts `src/lib/cancellation.ts` and the
`/cancellation-policy` page, which describe a 24-hour / 2-hour tiered refund.

**Failure scenario.** A customer cancels 90 minutes out, citing the vehicle page
promising free cancellation up to 1 hour. The refund logic gives them nothing.
That is a chargeback you will lose.

**Fix.** Move these to `brand.service` and make them consistent with
`cancellation.ts`. Check them against each other before launch.

### 14. Unused Twilio UI remnants

`src/middleware.ts` still lists `/admin/sms` in `ADMIN_ONLY` although the page
was removed upstream. Harmless, but misleading when reading the route guards.

---

## 🔵 Low

### 15. `README.md` described Vercel

Fixed in this template, but worth knowing: upstream shipped the untouched
`create-next-app` README while actually deploying via Docker and nginx.

### 16. Legal pages are placeholder text

`/terms`, `/privacy` and `/cancellation-policy` were written for a different
company in a different jurisdiction, then genericised here. The SMS consent
language in `/terms` in particular is boilerplate.

**This is not legal advice.** Have these reviewed for your jurisdiction,
especially if you serve the EU/UK (GDPR), California (CCPA), or send SMS in the
US/Canada (TCPA, A2P 10DLC).

### 17. No tests, no CI

No test runner, no test files, no pipeline. Verification is manual — see the
checklist at the end of `CLIENT_SETUP_CHECKLIST.md`.

### 18. No analytics consent mechanism

GA4 loads as soon as `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set, with no consent
banner. Adding one is on you if you serve the EU/UK.

---

## Fixed during template preparation

These two were changed because the template could not be distributed or used
otherwise.

### A. Hardcoded secrets removed *(was: secrets committed to source)*

The upstream source contained, as literals:

- a JWT fallback signing secret, in three files
- four password salts
- and in `src/lib/auth.ts`, a *different* JWT fallback from the one in
  `src/middleware.ts` — so with `JWT_SECRET` unset, admin tokens were signed
  with one key and customer/corporate sessions verified with another

These were real values from live systems and could not be published. They are
now replaced by `src/lib/env.ts`, which reads `JWT_SECRET` and `PASSWORD_SALT`
and **throws if either is missing** — no fallbacks. Accessors are lazy, so
`next build` still works without them; the error surfaces on the first request
that needs a secret.

The underlying weakness of the hashing scheme itself is *not* fixed — see §2.

### B. `admin_users.role` added to the schema

`scripts/schema.sql` created `admin_users` without a `role` column, but
`/api/admin/login` selects it, `/api/admin/users` selects and inserts it, and
`src/middleware.ts` gates pages on it.

On any database built from that schema, the login query errored, `data` came
back null, and **every admin login failed with "Invalid credentials"** — the
admin panel was unreachable on a fresh install. The upstream production
database evidently had the column added out of band.

The column is now in the schema:

```sql
role text not null default 'dispatcher' check (role in ('admin', 'dispatcher'))
```

`scripts/create-admin.ts` creates the first user with the `admin` role.

---

## Also worth knowing

Not defects, but things that surprised the person preparing this template:

- **All original imagery was removed.** The logos, vehicle photographs and
  capacity diagrams (about 19 MB) had no verifiable licensing, so they were
  replaced with obvious placeholders. Supply your own.
- **`brand.testimonials` and `brand.aggregateRating` ship empty on purpose.**
  The upstream project hardcoded six named reviews and a "5.0 on Google" badge.
  Those were invented. Publishing fabricated review markup is a search-engine
  policy violation, so both features now hide themselves until you provide real
  data.
- **The pricing engine has a region-aware path that is switched off.**
  `/api/pricing/lookup` still contains a working geocoder, but always resolves
  the single `__default__` rate row. Re-enable it if you need per-region
  pricing.
- **`/api/admin/pricing/county-cities` has an empty static map.** It was a
  hardcoded list of one US state's counties. The Google Places fallback still
  works for any region; fill the map in to avoid the API calls.
