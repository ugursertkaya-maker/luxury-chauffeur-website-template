-- ============================================================
-- Luxury Chauffeur Website Template — Full Schema
-- Run this once in your new Supabase SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- Core tables
-- ----------------------------------------------------------------

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  -- 'admin' has full access; 'dispatcher' is restricted by src/middleware.ts.
  role text not null default 'dispatcher' check (role in ('admin', 'dispatcher')),
  created_at timestamptz default now()
);

create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text,
  updated_at timestamptz default now()
);

create table if not exists vehicles (
  id text primary key,
  name text not null,
  slug text unique,
  category text,
  capacity_passengers int,
  capacity_bags int,
  base_price numeric(10,2),
  description text,
  features text[],
  image_url text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  vehicle_make text,
  vehicle_model text,
  vehicle_plate text,
  vehicle_year int,
  license_number text,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  phone text,
  password_hash text,
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists corporate_accounts (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_email text,
  billing_email text,
  phone text,
  address text,
  payment_terms int default 30,
  credit_limit numeric(10,2),
  discount_rate numeric(5,2) default 0,
  notes text,
  is_active boolean default true,
  portal_password text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text unique not null,
  service_type text not null,
  pickup_location text not null,
  dropoff_location text,
  pickup_date date not null,
  pickup_time time not null,
  hours numeric(4,1),
  passengers int,
  flight_number text,
  meet_greet boolean default false,
  name text not null,
  email text not null,
  phone text,
  notes text,
  estimated_miles numeric(8,2),
  vehicle_id text,
  total_price numeric(10,2) not null,
  price_base numeric(10,2),
  price_per_mile numeric(8,3),
  price_distance_charge numeric(10,2),
  price_time_charge numeric(10,2),
  price_surcharges jsonb,
  gratuity_amount numeric(10,2) default 0,
  discount_code text,
  discount_amount numeric(10,2) default 0,
  corporate_account_id uuid references corporate_accounts(id),
  invoice_status text,
  status text default 'pending',
  payment_status text default 'pending',
  stripe_payment_intent_id text,
  stripe_charge_id text,
  refunded boolean default false,
  refund_amount numeric(10,2),
  driver_id uuid references drivers(id),
  driver_name text,
  driver_phone text,
  vehicle_make text,
  vehicle_model text,
  vehicle_plate text,
  customer_id uuid references customers(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  corporate_account_id uuid references corporate_accounts(id),
  period_start date,
  period_end date,
  total_amount numeric(10,2),
  status text default 'sent',
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  source text,
  subscribed boolean default true,
  created_at timestamptz default now()
);

create table if not exists discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null,
  discount_value numeric(10,2) not null,
  max_uses int,
  uses_count int default 0,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists discount_code_uses (
  id uuid primary key default gen_random_uuid(),
  code_id uuid references discount_codes(id),
  code text,
  email text,
  booking_id uuid references bookings(id),
  discount_amount numeric(10,2),
  created_at timestamptz default now()
);

create table if not exists driver_ratings (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  driver_id uuid references drivers(id),
  rating int,
  comment text,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text,
  entity_type text,
  entity_id text,
  data jsonb,
  admin_username text,
  created_at timestamptz default now()
);

create table if not exists inbound_emails (
  id uuid primary key default gen_random_uuid(),
  from_email text,
  subject text,
  body text,
  received_at timestamptz,
  processed boolean default false,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- Pricing tables
-- ----------------------------------------------------------------

create table if not exists county_pricing (
  id uuid primary key default gen_random_uuid(),
  county text unique not null,
  sedan_base numeric(10,2),
  sedan_per_mile numeric(8,3),
  suv_base numeric(10,2),
  suv_per_mile numeric(8,3),
  min_fare numeric(10,2),
  sedan_hourly numeric(10,2),
  suv_hourly numeric(10,2),
  sedan_event numeric(10,2),
  suv_event numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists city_pricing (
  id uuid primary key default gen_random_uuid(),
  county text not null,
  city text not null,
  sedan_base numeric(10,2),
  sedan_per_mile numeric(8,3),
  suv_base numeric(10,2),
  suv_per_mile numeric(8,3),
  min_fare numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(county, city)
);

create table if not exists pricing_surcharges (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  amount numeric(10,2) not null,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- SEO content tables
-- ----------------------------------------------------------------

create table if not exists seo_locations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  state text,
  county text,
  lat numeric(9,6),
  lng numeric(9,6),
  meta_title text,
  meta_description text,
  h1 text,
  intro_html text,
  body_html text,
  faq_items jsonb default '[]',
  related_airports text[] default '{}',
  related_routes text[] default '{}',
  related_services text[] default '{}',
  is_published boolean default true,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists seo_airports (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  iata_code text,
  city text,
  state text,
  lat numeric(9,6),
  lng numeric(9,6),
  meta_title text,
  meta_description text,
  h1 text,
  intro_html text,
  body_html text,
  terminal_info text,
  faq_items jsonb default '[]',
  related_locations text[] default '{}',
  related_routes text[] default '{}',
  is_published boolean default true,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists seo_routes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  origin_name text not null,
  destination_name text not null,
  origin_location_slug text,
  destination_location_slug text,
  distance_miles numeric(8,2),
  duration_minutes int,
  meta_title text,
  meta_description text,
  h1 text,
  intro_html text,
  body_html text,
  faq_items jsonb default '[]',
  related_airports text[] default '{}',
  related_services text[] default '{}',
  is_published boolean default true,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists seo_hotels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  city text,
  state text,
  address text,
  lat numeric(9,6),
  lng numeric(9,6),
  star_rating int,
  meta_title text,
  meta_description text,
  h1 text,
  intro_html text,
  body_html text,
  faq_items jsonb default '[]',
  related_airports text[] default '{}',
  related_locations text[] default '{}',
  related_services text[] default '{}',
  is_published boolean default true,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists seo_cruise_ports (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  city text,
  state text,
  lat numeric(9,6),
  lng numeric(9,6),
  meta_title text,
  meta_description text,
  h1 text,
  intro_html text,
  body_html text,
  faq_items jsonb default '[]',
  related_airports text[] default '{}',
  related_locations text[] default '{}',
  related_routes text[] default '{}',
  is_published boolean default true,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists seo_attractions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  city text,
  state text,
  category text,
  lat numeric(9,6),
  lng numeric(9,6),
  meta_title text,
  meta_description text,
  h1 text,
  intro_html text,
  body_html text,
  faq_items jsonb default '[]',
  related_locations text[] default '{}',
  related_routes text[] default '{}',
  related_services text[] default '{}',
  is_published boolean default true,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists seo_destinations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  region text,
  meta_title text,
  meta_description text,
  h1 text,
  intro_html text,
  body_html text,
  faq_items jsonb default '[]',
  related_locations text[] default '{}',
  related_airports text[] default '{}',
  related_attractions text[] default '{}',
  is_published boolean default true,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists seo_services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  service_type text,
  price_from numeric(10,2),
  schema_service_type text,
  meta_title text,
  meta_description text,
  h1 text,
  intro_html text,
  body_html text,
  faq_items jsonb default '[]',
  related_locations text[] default '{}',
  related_routes text[] default '{}',
  is_published boolean default true,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists seo_blog (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  author text default 'Your Chauffeur Company',
  published_at timestamptz,
  meta_title text,
  meta_description text,
  h1 text,
  excerpt text,
  body_html text,
  faq_items jsonb default '[]',
  tags text[] default '{}',
  primary_tag text,
  reading_time_minutes int,
  related_routes text[] default '{}',
  related_services text[] default '{}',
  schema_article_type text default 'BlogPosting',
  is_published boolean default true,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- RPC helpers
-- ----------------------------------------------------------------

create or replace function increment_discount_uses(code_id uuid)
returns void language sql as $$
  update discount_codes set uses_count = uses_count + 1 where id = code_id;
$$;

-- ----------------------------------------------------------------
-- RLS: disable for service role (admin API uses service role key)
-- ----------------------------------------------------------------
alter table bookings enable row level security;
alter table customers enable row level security;
alter table corporate_accounts enable row level security;

-- Allow service role full access (used by Next.js API routes)
create policy "service_role_all" on bookings for all using (true);
create policy "service_role_all" on customers for all using (true);
create policy "service_role_all" on corporate_accounts for all using (true);
