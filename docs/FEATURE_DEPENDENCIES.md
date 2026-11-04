# Feature Dependencies

Which features need which external services, and what actually happens when a
service is not configured.

Everything below was derived by reading the source, not assumed. Where a
behaviour is surprising, the file and reason are named.

---

## The matrix

| Feature | Required service | Environment variables | Optional? |
|---|---|---|---|
| **Public pages, SEO pages, sitemap, robots** | Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` | **No** |
| **Address autocomplete** | Google Maps (browser) | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | **No** — booking is unusable without it |
| **Distance + fare quoting** | Google Maps (server) | `GOOGLE_MAPS_SERVER_KEY` | **No** — no quote can be produced |
| **Route map preview** | Google Maps (browser) | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes — map area is blank without it |
| **Booking creation** | Supabase **+ Resend** | Supabase trio, `RESEND_API_KEY` | **No** — see [note 1](#note-1-booking-creation-needs-resend) |
| **Online card payment** | Stripe | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` | Feature-dependent |
| **Booking marked paid / confirmation sent** | Stripe webhook | `STRIPE_WEBHOOK_SECRET` | **No, if taking payment** — see [note 2](#note-2-without-the-webhook-secret-nothing-is-ever-marked-paid) |
| **Transactional email** (confirm, modify, cancel, en-route) | Resend | `RESEND_API_KEY` | Feature-dependent |
| **Newsletter signup** | Resend audience | `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` | Yes — returns `503 Newsletter not configured` |
| **Admin dashboard + all 16 admin pages** | Supabase + auth secrets | Supabase trio, `JWT_SECRET`, `PASSWORD_SALT` | **No** |
| **Customer accounts** | Supabase + auth secrets | Supabase trio, `JWT_SECRET`, `PASSWORD_SALT` | Feature-dependent |
| **Corporate portal** | Supabase + auth secrets | Supabase trio, `JWT_SECRET`, `PASSWORD_SALT` | Feature-dependent |
| **Corporate PDF invoices** | Supabase + Resend | Supabase trio, `RESEND_API_KEY` | Feature-dependent |
| **Driver portal** | Supabase + `PASSWORD_SALT` | Supabase trio, `PASSWORD_SALT` | Feature-dependent |
| **Driver credential email** | Resend | `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL` | Feature-dependent |
| **Day-before reminders** | Cron + Resend (+ Twilio for SMS) | `CRON_SECRET`, `RESEND_API_KEY`, `TWILIO_*` | Yes |
| **Monthly corporate statements** | Cron + Resend | `CRON_SECRET`, `RESEND_API_KEY` | Yes |
| **Monthly corporate invoices** | Cron + Resend | `CRON_SECRET`, `RESEND_API_KEY` | Yes |
| **Admin inbox — contact form messages** | Supabase | Supabase trio | **No** (always on) |
| **Admin inbox — inbound email** | Forwarding provider | `INBOUND_EMAIL_SECRET` + `MX` records | Yes |
| **Admin inbox — Gmail sync** | Gmail API (OAuth) | `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REDIRECT_URI` | Yes |
| **Admin replies from inbox** | Resend | `RESEND_API_KEY` | Yes |
| **Flight status in admin** | AviationStack / FlightAware | `AVIATIONSTACK_API_KEY`, `FLIGHTAWARE_API_KEY` | Yes |
| **SMS reminders / driver + rating alerts** | Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `ADMIN_PHONE` | Yes — silently skipped when unset |
| **Analytics** | Google Analytics 4 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Yes — no script injected when unset |
| **Instagram feed** | Instagram Graph API | `NEXT_PUBLIC_INSTAGRAM_HANDLE`, `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` | Yes |
| **Post-trip review prompt** | Google Business Profile | `NEXT_PUBLIC_GOOGLE_REVIEW_URL` | Yes |
| **Homepage Google rating badge** | Google Business Profile **+ brand config** | `NEXT_PUBLIC_GOOGLE_REVIEW_URL` **and** `brand.aggregateRating` | Yes — hidden unless both are set |
| **Homepage / SEO-page reviews** | none — brand config only | `brand.testimonials` in `src/config/brand.ts` | Yes — hidden while the array is empty |
| **Structured data (JSON-LD)** | none | `NEXT_PUBLIC_SITE_URL` + brand config | **No** (always on) |
| **Open Graph images** | none | `NEXT_PUBLIC_SITE_URL` | **No** (generated at request time) |

"Feature-dependent" means the feature itself is optional, but if you want it,
the listed service is mandatory.

---

## The absolute minimum

To get the site running at all:

```env
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
PASSWORD_SALT=
```

That gives you public pages, SEO pages, the sitemap, structured data, and a
working admin panel. No bookings, no payment, no email.

To take a booking you additionally need both Google Maps keys and
`RESEND_API_KEY`. To charge for it you need the three Stripe values.

---

## What breaks, specifically

### Note 1 — booking creation needs Resend

`src/app/api/bookings/route.ts` inserts the booking row and then calls
`await resend.emails.send(...)` **without a surrounding try/catch**. With no
valid `RESEND_API_KEY` that call rejects, so the route returns a `500` even
though the booking row was already written.

The customer sees a failure. The booking exists in the database.

Separately, `RESEND_API_KEY` is also required **at build time** — the Resend
SDK throws on construction, which fails Next's page-data collection step. Any
non-empty string satisfies the build.

So in practice **Resend is required for the booking funnel and for building at
all**, despite being conceptually a notification concern. If you want bookings without email, wrap
that call in `.catch(() => {})` the way the later sends in the same file
already are.

### Note 2 — without the webhook secret, nothing is ever marked paid

`src/app/api/webhooks/route.ts` calls `stripe.webhooks.constructEvent(...)` and
returns `400` when the signature does not verify. A missing or wrong
`STRIPE_WEBHOOK_SECRET` therefore means:

- the customer's card is charged
- the booking stays `pending` / `unpaid`
- no confirmation email is sent

This fails in the worst direction — money moves, the record does not. Verify
the webhook in Stripe's **Developers → Events** tab before launch.

### Note 3 — Google Maps has two independent keys

They are not interchangeable and the failures look different:

- Missing **browser** key → the address field never shows suggestions. The
  booking form is effectively dead.
- Missing **server** key → addresses autocomplete fine, then the quote step
  fails. More confusing, because the form looks like it is working.

### Note 4 — SMS fails silently, by design

All three Twilio call sites check for the credentials first and skip when they
are absent. No error, no log, no SMS. If you expected SMS and are not getting
it, check the variables before debugging anything else.

### Note 5 — the contact form never sends email

`/api/contact` writes a row into `inbound_emails` and nothing more. It does not
notify you. Messages only appear in `/admin/emails`, so someone has to look.
Wire up a notification if you need one.

### Note 6 — two URL variables, one meaning

`NEXT_PUBLIC_SITE_URL` is the real one, used almost everywhere.
`NEXT_PUBLIC_BASE_URL` is read in exactly one place — the corporate portal
invite email in `src/app/api/admin/corporate/route.ts`. Set both to the same
value. If you only set the first, corporate invite links point at
`https://example.com`.

### Note 7 — `/destinations` and `/attractions`

The upstream project shipped these two hub pages with no content at all, so
both rendered empty. `scripts/seed-example.ts` now seeds both, but as
unpublished drafts. Until you write real rows and publish them, both hubs will
be empty — remove them from the navigation and footer if you are not going to
use them.

---

## Features unavailable until configured

Launching with only the minimum, these stay off:

- Taking payment (Stripe)
- Any outbound email, which also blocks booking creation (Resend)
- Newsletter signup (Resend audience)
- Day-before reminders, monthly statements, monthly invoices (cron)
- Inbound email and Gmail sync (forwarding provider, Gmail OAuth)
- Flight status lookup (AviationStack / FlightAware)
- SMS of any kind (Twilio)
- Analytics (GA4)
- Instagram feed
- Review prompt and rating badge (Google Business Profile + brand config)
- Customer reviews on the homepage and SEO pages (brand config)

None of these block a deploy. All of them are additive.
