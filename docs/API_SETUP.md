# API & External Service Setup

Every external service this site talks to, what it powers, and exactly how to
get the credentials.

Work through the **Required** section first — the site will not start without
it. Then add the feature services you actually want.

Pricing and free-tier terms change constantly. Where billing is mentioned below
it is a *warning that billing may apply*, not a quote. Check the provider's
current pricing page before you rely on any tier.

**Contents**

| Service | Status | Powers |
|---|---|---|
| [Supabase](#1-supabase) | **Required** | The entire database |
| [Auth secrets](#2-authentication-secrets) | **Required** | All three login systems |
| [Google Maps](#3-google-maps-platform) | **Required for booking** | Address autocomplete, distance, quoting |
| [Stripe](#4-stripe) | Feature | Card payment |
| [Resend](#5-resend) | Feature | All outbound email |
| [Inbound email](#6-inbound-email-webhook) | Feature | Admin inbox |
| [Gmail OAuth](#7-gmail-oauth) | Feature | Gmail inbox sync |
| [Cron](#8-cron-scheduled-jobs) | Feature | Reminders, invoices, statements |
| [AviationStack / FlightAware](#9-flight-tracking) | Optional | Flight status |
| [Twilio](#10-twilio-sms) | Optional | SMS notifications |
| [Google Analytics](#11-google-analytics-4) | Optional | Traffic analytics |
| [Instagram](#12-instagram-feed) | Optional | Homepage photo feed |
| [Google Reviews](#13-google-reviews-link) | Optional | Review prompt + rating badge |

---

## 1. Supabase

**What it is.** Hosted PostgreSQL with an auto-generated REST API. This project
uses it purely as a database — Supabase Auth is *not* used, because the site
implements its own JWT sessions.

**Powers.** Everything. Bookings, customers, drivers, vehicles, pricing,
discounts, corporate accounts, invoices, SEO content, the email inbox, the
audit log. All 26 tables.

**Required?** Yes. Nothing works without it.

### Steps

1. Sign up at <https://supabase.com> and create a new project.
2. Choose a region close to your customers — every page render queries it.
3. Save the database password it generates; you will need it for direct SQL
   access, though not for this app.
4. Go to **Project Settings → API Keys** (newer projects: **Data API** +
   **API Keys**) and copy three values:

| Dashboard label | Environment variable | Exposure |
|---|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | Public — safe in the browser |
| `anon` / publishable key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public — safe in the browser |
| `service_role` / secret key | `SUPABASE_SERVICE_ROLE_KEY` | **Secret — server only** |

> ⚠️ The service-role key bypasses row-level security entirely. Never prefix it
> with `NEXT_PUBLIC_`, never reference it from a client component, and never
> paste it into a browser console. Every API route in this project runs
> server-side and uses it deliberately.

### Create the schema

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste the entire contents of `scripts/schema.sql` and run it.
3. It creates 26 tables, two extensions (`pgcrypto`, `uuid-ossp`), one function
   and three RLS policies. It is idempotent (`create table if not exists`), so
   re-running it is safe.

> **Note:** the schema creates **no indexes**. For a small site this is fine.
> As your SEO content grows, add indexes on the `slug` columns and the busy
> `bookings` columns — see `docs/KNOWN_ISSUES.md`.

### Create your admin user

The admin panel has no public sign-up. Set `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` and `PASSWORD_SALT` in `.env.local` first, then:

```bash
npx tsx scripts/create-admin.ts owner 'a-long-random-password'
```

This creates a user with the `admin` role. Log in at `/admin/login`.

The other role is `dispatcher`, which `src/middleware.ts` blocks from the
sensitive admin pages. Create additional users from `/admin/users`.

### Verify

- `scripts/create-admin.ts` prints `✓ Admin user ... created`.
- You can log in at `/admin/login` and reach `/admin`.
- If login fails with "Invalid credentials" immediately, re-check that you ran
  the current `schema.sql` — it must include the `admin_users.role` column.

---

## 2. Authentication secrets

**What they are.** Two random strings you generate yourself. No account needed.

**Powers.** `JWT_SECRET` signs the session cookies for all three login systems
(admin, customer, corporate). `PASSWORD_SALT` is mixed into stored password
hashes.

**Required?** Yes, both. The app throws a clear error on the first request that
needs them if they are missing — there are deliberately no fallback values.

### Steps

```bash
openssl rand -hex 48    # -> JWT_SECRET
openssl rand -hex 32    # -> PASSWORD_SALT
```

Use two *different* values.

```env
JWT_SECRET=<first value>
PASSWORD_SALT=<second value>
```

> ⚠️ **Set `PASSWORD_SALT` once, before creating any user, then never change
> it.** Changing it invalidates every stored password, including your admin
> login, and there is no recovery path other than re-running
> `scripts/create-admin.ts`.

> Rotating `JWT_SECRET` is safe — it just logs everyone out.

### Verify

Start the app and load `/admin/login`. If a secret is missing you will get an
explicit `Missing required environment variable ...` error rather than a silent
insecure default.

---

## 3. Google Maps Platform

**What it is.** Google's mapping APIs.

**Powers.** Pickup/drop-off address autocomplete on every booking form, the
route map, trip distance and duration (which drives the fare), and the optional
city lookup in `/admin/pricing`.

**Required?** Effectively yes — without it customers cannot enter an address or
receive a quote.

**Billing.** Google Maps Platform requires a billing account with a card on
file, even within the monthly free allowance. Set budget alerts and API quotas
before going live.

### Steps

1. Create a project at <https://console.cloud.google.com>.
2. Enable billing on the project.
3. **APIs & Services → Library** — enable all four:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Distance Matrix API
4. **APIs & Services → Credentials → Create credentials → API key.** Create
   **two** keys:

| Key | Variable | Restriction |
|---|---|---|
| Browser key | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | **Application restriction:** HTTP referrers → `https://your-domain.com/*` (add `http://localhost:3000/*` for development). **API restriction:** Maps JavaScript API, Places API. |
| Server key | `GOOGLE_MAPS_SERVER_KEY` | **Application restriction:** IP addresses → your server's public IP. **API restriction:** Geocoding API, Distance Matrix API, Places API. |

> The browser key is visible in your page source — that is normal and
> unavoidable. The referrer restriction is what protects it. Restrict both keys
> before launch, or you will eventually pay for someone else's traffic.

### Verify

- On `/book`, typing in the pickup field shows an address dropdown (browser key
  + Places API).
- Selecting both addresses produces a price (server key + Distance Matrix).
- Check **APIs & Services → Metrics** in Google Cloud for successful calls and
  no `REQUEST_DENIED` errors.

---

## 4. Stripe

**What it is.** Card payment processing.

**Powers.** The payment step of the booking funnel (`/book/payment`), saved
cards for repeat customers, and the webhook that marks a booking paid and
triggers the confirmation email.

**Required?** Only for taking payment online. Without it, the rest of the site
works and bookings can be created, but the payment step will fail.

**Billing.** Stripe charges per successful transaction. Test mode is free and
moves no money.

### Steps

1. Create an account at <https://stripe.com>.
2. **Stay in TEST mode** until the whole flow works end to end. The toggle is
   in the dashboard header.
3. **Developers → API keys** — copy:

| Dashboard label | Variable |
|---|---|
| Publishable key (`pk_test_…`) | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Secret key (`sk_test_…`) | `STRIPE_SECRET_KEY` |

4. **Developers → Webhooks → Add endpoint:**
   - **URL:** `https://your-domain.com/api/webhooks`
   - **Events:** `payment_intent.succeeded`, and
     `charge.refunded` if you intend to process refunds
   - After creating it, reveal the **Signing secret** (`whsec_…`) →
     `STRIPE_WEBHOOK_SECRET`

> The webhook handler verifies the signature and rejects unsigned requests, so
> the secret must be correct or no payment will ever be marked paid.

### Going live

Switch the dashboard to live mode, regenerate all three values (`pk_live_…`,
`sk_live_…`, and a new webhook + signing secret for the live endpoint), and
replace them in your production environment.

> 🔴 **Read `docs/KNOWN_ISSUES.md` before accepting live payments.** The payment
> intent is currently created from an amount supplied by the browser, which a
> modified client can change. Fix that first.

### Verify

1. In test mode, complete a booking with card `4242 4242 4242 4242`, any future
   expiry, any CVC.
2. **Developers → Events** shows `payment_intent.succeeded` delivered with a
   `200` response.
3. The booking appears in `/admin` with status `confirmed` and payment `paid`.
4. Local webhook testing: `stripe listen --forward-to localhost:3000/api/webhooks`
   (gives you a temporary signing secret to use in `.env.local`).

---

## 5. Resend

**What it is.** Transactional email delivery.

**Powers.** Booking confirmations, modification and cancellation notices,
"chauffeur on the way", corporate invoices and monthly statements, driver
credential emails, admin replies from the inbox, and newsletter sends.

**Required?** Only for email. Without `RESEND_API_KEY`, bookings still succeed
but no one is notified — which in practice you will want to fix before launch.

### Steps

1. Create an account at <https://resend.com>.
2. **Domains → Add domain** — enter your sending domain.
3. Add the DNS records Resend gives you at your DNS provider. These are
   typically:
   - `TXT` for SPF
   - `CNAME` or `TXT` records for DKIM
   - optionally a `TXT` for DMARC
4. Wait for the dashboard to show **Verified**. This can take minutes to hours
   depending on DNS propagation.
5. **API Keys → Create API key** → `RESEND_API_KEY`.
6. *(Optional)* **Audiences → Create audience**, copy its ID →
   `RESEND_AUDIENCE_ID`. Leave blank to disable the newsletter signup form.

### Sender address

The From address is **not** an environment variable. It comes from
`brand.contact.emailReservations` in `src/config/brand.ts`:

```ts
contact: {
  emailReservations: 'reservations@yourdomain.com',
}
```

It must be on the domain you verified in step 4, or Resend will reject the
send.

### Verify

1. Set `RESEND_API_KEY`, log in to `/admin`, and use the **test email** action
   (`/api/admin/test-email`) to send yourself a sample confirmation.
2. Check the Resend dashboard **Logs** for a `delivered` status.
3. Confirm the email shows your brand name, your phone number and your domain
   in the footer — if it still says "Your Chauffeur Company", you have not
   edited `src/config/brand.ts`.

---

## 6. Inbound email webhook

**What it is.** A mail-forwarding service that POSTs incoming email to your
site as JSON, so customer replies appear in `/admin/emails`.

**Powers.** The admin inbox. The route is `/api/webhooks/inbound-email`, plus a
provider-specific variant at `/api/webhooks/forwardemail`.

**Required?** No. Without it the inbox only shows messages submitted through
your own contact form.

### Steps

Any provider that can POST JSON will work. The upstream project used
[ForwardEmail](https://forwardemail.net):

1. Add your domain to the provider.
2. Point your domain's `MX` records at the provider (they will give you the
   exact hostnames and priorities).
3. Create an alias — e.g. `info@yourdomain.com` — and configure it to **both**
   forward to a mailbox you read **and** POST to:
   `https://your-domain.com/api/webhooks/inbound-email`
4. Generate a shared secret and set it on both sides:

```bash
openssl rand -hex 24   # -> INBOUND_EMAIL_SECRET
```

The route rejects any POST that does not present this secret.

> ⚠️ `MX` records for a domain are exclusive. If you already receive mail at
> this domain through another provider, changing `MX` will break it. Use a
> subdomain, or route through your existing provider's webhook feature instead.

### Verify

Send an email to the alias. It should arrive in your forwarding mailbox *and*
appear as a new row in `/admin/emails` within a minute.

---

## 7. Gmail OAuth

**What it is.** Read access to a Gmail mailbox via the Gmail API, so the admin
inbox can sync messages already sitting in Gmail.

**Powers.** The **Sync** button in `/admin/emails`. Independent of §6 — this
pulls from Gmail rather than receiving pushes.

**Required?** No.

### Steps

1. In the **same Google Cloud project** as your Maps keys (or a new one),
   enable the **Gmail API** under **APIs & Services → Library**.
2. **APIs & Services → OAuth consent screen:**
   - User type: **External**
   - Fill in app name, support email, developer contact
   - **Scopes:** add `https://www.googleapis.com/auth/gmail.readonly`
     (add `gmail.send` only if you later want to send *through* Gmail)
   - While the app is in **Testing**, add the Gmail address you want to sync as
     a **Test user**. Refresh tokens for apps in Testing expire after 7 days —
     publish the app if you need a long-lived connection.
3. **Credentials → Create credentials → OAuth client ID:**
   - Type: **Web application**
   - **Authorised redirect URI:**
     `https://your-domain.com/api/auth/gmail/callback`
     (add `http://localhost:3000/api/auth/gmail/callback` for development)

```env
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-google-oauth-client-secret
GMAIL_REDIRECT_URI=https://your-domain.com/api/auth/gmail/callback
```

> The redirect URI must match **character for character** — scheme, host, port,
> path, no trailing slash. A mismatch gives `redirect_uri_mismatch`.

Tokens are stored in the `app_settings` table under the key `gmail_tokens` and
refreshed automatically.

### Verify

Visit `/api/auth/gmail` while logged in as admin, complete the Google consent
screen, and confirm you are returned to the site. `/api/admin/gmail/status`
should then report a connected account, and **Sync** in `/admin/emails` should
import messages.

---

## 8. Cron (scheduled jobs)

**What it is.** Three HTTP endpoints that need to be called on a schedule by
something outside the app.

**Powers.**

| Endpoint | Suggested schedule | What it does |
|---|---|---|
| `/api/cron/reminders` | daily | Day-before reminder to each customer |
| `/api/cron/monthly-statement` | monthly | Corporate statement for review |
| `/api/cron/monthly-invoice` | monthly | Corporate PDF invoice |

**Required?** No, but reminders and corporate billing simply never happen
without it.

### Steps

1. Generate the shared secret:

```bash
openssl rand -hex 24   # -> CRON_SECRET
```

2. Schedule the calls. With system cron on your server:

```cron
# daily at 09:00 — day-before reminders
0 9 * * * curl -fsS "https://your-domain.com/api/cron/reminders?secret=$CRON_SECRET"

# 1st of the month at 02:00 — corporate statements
0 2 1 * * curl -fsS "https://your-domain.com/api/cron/monthly-statement?secret=$CRON_SECRET"

# 2nd of the month at 02:00 — corporate invoices
0 2 2 * * curl -fsS "https://your-domain.com/api/cron/monthly-invoice?secret=$CRON_SECRET"
```

Any scheduler works — GitHub Actions, a managed cron service, or your host's
built-in scheduler.

> Reminders and invoices send real email to real customers. Verify against test
> data first.

### Verify

Call an endpoint manually with the correct secret and confirm a `200` and a
sensible JSON body (e.g. `{"sent":0}` when there is nothing due). Call it with
a wrong or missing `secret` parameter and confirm it is rejected.

---

## 9. Flight tracking

**What it is.** Live flight status lookup by flight number.

**Powers.** The flight-status panel in the admin booking drawer, so dispatch can
see whether an inbound flight is delayed.

**Required?** No.

### Steps

Two providers are supported. **FlightAware is tried first when its key is set**,
with AviationStack as the fallback.

| Provider | Sign up | Variable |
|---|---|---|
| AviationStack | <https://aviationstack.com> | `AVIATIONSTACK_API_KEY` |
| FlightAware AeroAPI | <https://flightaware.com/aeroapi/> | `FLIGHTAWARE_API_KEY` |

Set either, both, or neither. AviationStack has a free tier with a low monthly
call cap; AeroAPI is paid but more accurate. Check current terms with each
provider.

### Verify

Open a booking with a flight number in `/admin` and confirm the flight status
panel populates rather than showing an error.

---

## 10. Twilio (SMS)

**What it is.** Programmable SMS.

**Powers.** Three live code paths:

- `/api/cron/reminders` — day-before SMS to the customer
- `/api/bookings/[id]` — driver assignment notice, plus "on the way" and
  "arrived" updates to the customer
- `/api/rate` — new-rating alert to `ADMIN_PHONE`

**Required?** No. Every call site is guarded and silently skips when the
variables are unset, so the site runs fine without SMS.

### Steps

1. Create an account at <https://twilio.com>.
2. Buy a phone number with SMS capability in your country.
3. **Console dashboard** — copy the Account SID and Auth Token.

```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15550000000      # E.164 format
ADMIN_PHONE=+15550000001              # where rating alerts go
```

> **US and Canada:** A2P 10DLC registration is mandatory for application-to-
> person SMS. Unregistered traffic is filtered or blocked. Register your brand
> and campaign in the Twilio console before relying on SMS.
>
> Transactional SMS is also subject to consent rules (TCPA in the US and
> equivalents elsewhere). The `/terms` page contains SMS consent language you
> must review and adapt — it is placeholder text, not legal advice.

### Verify

Trigger a driver assignment on a test booking with your own mobile number and
confirm the message arrives. Check **Monitor → Logs → Messaging** in Twilio for
delivery status.

---

## 11. Google Analytics 4

**What it is.** Web analytics.

**Powers.** Pageview tracking, injected in `src/app/layout.tsx`. The gtag
script is only added when the variable is set, so leaving it blank ships no
tracking code at all.

**Required?** No.

### Steps

1. Create a property at <https://analytics.google.com>.
2. **Admin → Data streams → Web** — add your domain.
3. Copy the **Measurement ID** (format `G-XXXXXXXXXX`).

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

> If you serve EU/UK visitors, pageview analytics generally requires a consent
> mechanism under GDPR/PECR. This template does **not** include a consent
> banner. Adding one is your responsibility.

### Verify

Load the site, then check **Reports → Realtime** in GA4 for your own visit.
Confirm the `gtag/js` request appears in your browser's network tab.

---

## 12. Instagram feed

**What it is.** The Instagram Graph API, showing recent posts on the homepage.

**Powers.** The `InstagramFeed` component. Responses are cached for an hour and
the token is auto-refreshed when within 7 days of expiry.

**Required?** No.

### Steps

Requires an Instagram **Business** or **Creator** account linked to a Facebook
Page.

1. Create an app at <https://developers.facebook.com>.
2. Add the **Instagram** product and complete the business login flow.
3. Generate a long-lived access token for the account.

```env
NEXT_PUBLIC_INSTAGRAM_HANDLE=yourhandle
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
```

> Meta changes this flow and its product names frequently. Follow the current
> Instagram Platform documentation rather than any older walkthrough.

### Verify

Load the homepage and confirm recent posts render. Check `/api/instagram`
directly for the raw response if they do not.

---

## 13. Google Reviews link

**What it is.** A direct "write a review" URL for your Google Business Profile.

**Powers.** Two things: the review prompt shown after a customer leaves a
5-star rating, and the Google rating badge on the homepage.

**Required?** No.

### Steps

1. Claim your Google Business Profile at
   <https://business.google.com>.
2. Get the short review link from the profile's **Ask for reviews** action, or
   build it as
   `https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID`.

```env
NEXT_PUBLIC_GOOGLE_REVIEW_URL=https://g.page/r/.../review
```

### The rating badge needs a second step

The homepage badge stays hidden until you **also** set a real rating in
`src/config/brand.ts`:

```ts
aggregateRating: { ratingValue: '4.9', ratingCount: '63' },
```

> ⚠️ This value is also emitted as schema.org `AggregateRating` structured
> data. Only enter figures that match what is publicly visible on your profile.
> Fabricated review markup is treated as spam and can get your site's rich
> results suppressed or the site penalised.

### Verify

Leave a 5-star rating through a test `/rate/[token]` link and confirm the
review prompt appears. Once `aggregateRating` is set, confirm the homepage
badge renders and that Google's Rich Results Test accepts the markup.

---

## Where each variable is used

| Variable | Used in |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `src/config/brand.ts`, Gmail callback, bulk email, driver credentials |
| `NEXT_PUBLIC_BASE_URL` | Corporate portal invite email only |
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/supabase.ts`, both scripts |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `src/lib/supabase.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/supabase.ts`, both scripts |
| `JWT_SECRET` | `src/lib/env.ts` → auth, middleware, corporate-auth, customer-auth |
| `PASSWORD_SALT` | `src/lib/env.ts` → password hashing, `scripts/create-admin.ts` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `/book/payment`, `/manage` |
| `STRIPE_SECRET_KEY` | `src/lib/stripe.ts` |
| `STRIPE_WEBHOOK_SECRET` | `/api/webhooks` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Booking forms, admin booking drawer, route map |
| `GOOGLE_MAPS_SERVER_KEY` | `/api/distance`, `/api/pricing/lookup`, `/api/admin/route-info`, county-cities |
| `RESEND_API_KEY` | `src/lib/email.ts` and 9 other routes |
| `RESEND_AUDIENCE_ID` | `/api/newsletter` |
| `INBOUND_EMAIL_SECRET` | `/api/webhooks/inbound-email` |
| `GMAIL_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | `/api/auth/gmail`, callback, `/api/admin/gmail/sync` |
| `CRON_SECRET` | all three `/api/cron/*` routes |
| `AVIATIONSTACK_API_KEY`, `FLIGHTAWARE_API_KEY` | `/api/admin/flight-status` |
| `TWILIO_*`, `ADMIN_PHONE` | `/api/cron/reminders`, `/api/bookings/[id]`, `/api/rate` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `src/app/layout.tsx` |
| `NEXT_PUBLIC_INSTAGRAM_HANDLE`, `INSTAGRAM_*` | `/api/instagram`, `InstagramFeed` |
| `NEXT_PUBLIC_GOOGLE_REVIEW_URL` | `/rate/[token]`, `src/config/brand.ts` |
