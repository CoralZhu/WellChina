-- WellChina 初始化 Migration
-- 运行：supabase db push

-- 启用 UUID 扩展
create extension if not exists "uuid-ossp";

-- ── users ────────────────────────────────────────────────
create table public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  name                text,
  email               text,
  phone               text,
  country_code        text,
  preferred_language  text default 'en',
  age                 int,
  health_conditions   text[],
  is_guest            boolean default false,
  tier                text default 'guest' check (tier in ('guest','basic','vip')),
  referral_code       text unique,
  created_at          timestamptz default now()
);

alter table public.users enable row level security;
create policy "Users can read own data" on public.users for select using (auth.uid() = id);
create policy "Users can update own data" on public.users for update using (auth.uid() = id);

-- ── institutions ─────────────────────────────────────────
create table public.institutions (
  id                    uuid primary key default uuid_generate_v4(),
  name_zh               text not null,
  name_en               text,
  city                  text,
  type                  text check (type in ('tcm','western','wellness')),
  lat                   float8,
  lng                   float8,
  rating                float4 default 0,
  review_count          int default 0,
  languages_supported   text[],
  price_per_day_usd     int,
  certifications        text[],
  images                text[],
  description_zh        text,
  description_en        text,
  description_ru        text,
  is_active             boolean default true,
  created_at            timestamptz default now()
);

alter table public.institutions enable row level security;
create policy "Anyone can read active institutions"
  on public.institutions for select using (is_active = true);

-- ── services ─────────────────────────────────────────────
create table public.services (
  id              uuid primary key default uuid_generate_v4(),
  institution_id  uuid references public.institutions(id) on delete cascade,
  name_zh         text not null,
  name_en         text,
  type            text,
  price_usd       int,
  duration_days   int,
  includes        text[],
  is_active       boolean default true
);

alter table public.services enable row level security;
create policy "Anyone can read active services"
  on public.services for select using (is_active = true);

-- ── bookings ─────────────────────────────────────────────
create table public.bookings (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid references public.users(id),
  institution_id        uuid references public.institutions(id),
  service_id            uuid references public.services(id),
  status                text default 'pending'
                          check (status in ('pending','confirmed','in_progress','completed','cancelled')),
  start_date            date,
  end_date              date,
  total_usd             int,
  tier                  text check (tier in ('tier1_full','tier2_basic')),
  add_ons               jsonb default '{}',
  payment_status        text default 'unpaid' check (payment_status in ('unpaid','deposit','paid')),
  stripe_payment_intent text,
  companion_name        text,
  companion_phone       text,
  created_at            timestamptz default now()
);

alter table public.bookings enable row level security;
create policy "Users can read own bookings"
  on public.bookings for select using (auth.uid() = user_id);
create policy "Users can create bookings"
  on public.bookings for insert with check (auth.uid() = user_id);

-- ── reviews ──────────────────────────────────────────────
create table public.reviews (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.users(id),
  institution_id  uuid references public.institutions(id),
  rating          int check (rating between 1 and 5),
  content         text,
  language        text,
  created_at      timestamptz default now()
);

alter table public.reviews enable row level security;
create policy "Anyone can read reviews" on public.reviews for select using (true);
create policy "Users can create reviews" on public.reviews for insert with check (auth.uid() = user_id);

-- ── health_records ───────────────────────────────────────
create table public.health_records (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.users(id),
  booking_id   uuid references public.bookings(id),
  type         text check (type in ('report','prescription','note','summary')),
  file_url     text,
  summary_text text,
  created_at   timestamptz default now()
);

alter table public.health_records enable row level security;
create policy "Users can read own health records"
  on public.health_records for select using (auth.uid() = user_id);

-- ── messages ─────────────────────────────────────────────
create table public.messages (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid references public.bookings(id),
  sender_role text check (sender_role in ('user','staff','ai')),
  content     text,
  language    text,
  created_at  timestamptz default now()
);

alter table public.messages enable row level security;
create policy "Users can read messages for own bookings"
  on public.messages for select
  using (exists (
    select 1 from public.bookings b
    where b.id = booking_id and b.user_id = auth.uid()
  ));
