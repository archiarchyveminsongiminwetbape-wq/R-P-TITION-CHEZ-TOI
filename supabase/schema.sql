-- Supabase schema for "Répétition chez toi" MVP
-- Safe to run in the SQL Editor. Assumes default 'auth' and 'public' schemas.

-- 1) Extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- 2) Enums
create type public.user_role as enum ('parent', 'teacher', 'admin');
create type public.level as enum ('college', 'lycee');

-- 3) Core tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'parent',
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.neighborhoods (
  id serial primary key,
  name text not null unique -- e.g., "Akwa", "Bonapriso", "Deido", "Bonamoussadi"
);

create table if not exists public.subjects (
  id serial primary key,
  name text not null unique -- e.g., "Maths", "Physique", "SVT", "Français", "Anglais"
);

create table if not exists public.teacher_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  hourly_rate numeric(10,2) check (hourly_rate >= 0),
  levels public.level[] default '{college,lycee}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_subjects (
  teacher_id uuid references public.teacher_profiles(user_id) on delete cascade,
  subject_id int references public.subjects(id) on delete cascade,
  primary key (teacher_id, subject_id)
);

-- link teachers to neighborhoods (many-to-many)
create table if not exists public.teacher_neighborhoods (
  teacher_id uuid references public.teacher_profiles(user_id) on delete cascade,
  neighborhood_id int references public.neighborhoods(id) on delete cascade,
  primary key (teacher_id, neighborhood_id)
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.profiles(id) on delete cascade,
  full_name text not null,
  level public.level not null,
  created_at timestamptz not null default now()
);

create table if not exists public.availabilities (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.teacher_profiles(user_id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = dimanche
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint chk_time_range check (end_time > start_time)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.profiles(id) on delete cascade,
  teacher_id uuid references public.teacher_profiles(user_id) on delete cascade,
  child_id uuid references public.children(id) on delete set null,
  subject_id int references public.subjects(id) on delete set null,
  neighborhood_id int references public.neighborhoods(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_booking_time check (ends_at > starts_at)
);

-- Link bookings to multiple subjects (many-to-many)
create table if not exists public.booking_subjects (
  booking_id uuid references public.bookings(id) on delete cascade,
  subject_id int references public.subjects(id) on delete restrict,
  primary key (booking_id, subject_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique references public.bookings(id) on delete cascade,
  parent_id uuid references public.profiles(id) on delete cascade,
  teacher_id uuid references public.teacher_profiles(user_id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- 4) Triggers for updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger trg_teacher_profiles_updated
before update on public.teacher_profiles
for each row execute function public.set_updated_at();

create trigger trg_bookings_updated
before update on public.bookings
for each row execute function public.set_updated_at();

-- 5) Helper security function
create or replace function public.current_user_id()
returns uuid language sql stable as $$ select auth.uid() $$;

-- 6) RLS
alter table public.profiles enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.teacher_subjects enable row level security;
alter table public.teacher_neighborhoods enable row level security;
alter table public.children enable row level security;
alter table public.availabilities enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_subjects enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- Profiles policies
create policy "profiles_select_self_or_public" on public.profiles
  for select using (true);
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

-- Teacher profiles
create policy "teacher_profiles_select_all" on public.teacher_profiles
  for select using (true);
create policy "teacher_profiles_upsert_self" on public.teacher_profiles
  for insert with check (user_id = auth.uid());
create policy "teacher_profiles_update_self" on public.teacher_profiles
  for update using (user_id = auth.uid());

-- Teacher subjects
create policy "teacher_subjects_read" on public.teacher_subjects
  for select using (true);
create policy "teacher_subjects_manage_self" on public.teacher_subjects
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- Teacher neighborhoods
create policy "teacher_neighborhoods_read" on public.teacher_neighborhoods
  for select using (true);
create policy "teacher_neighborhoods_manage_self" on public.teacher_neighborhoods
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- Children (parents only)
create policy "children_read_own" on public.children
  for select using (parent_id = auth.uid());
create policy "children_manage_own" on public.children
  for all using (parent_id = auth.uid()) with check (parent_id = auth.uid());

-- Availabilities (teachers only)
create policy "availabilities_read_all" on public.availabilities
  for select using (true);
create policy "availabilities_manage_self" on public.availabilities
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- Bookings
create policy "bookings_read_participants" on public.bookings
  for select using (parent_id = auth.uid() or teacher_id = auth.uid());
create policy "bookings_parent_create" on public.bookings
  for insert with check (parent_id = auth.uid());
create policy "bookings_parent_update_own" on public.bookings
  for update using (parent_id = auth.uid());
create policy "bookings_teacher_update_own" on public.bookings
  for update using (teacher_id = auth.uid());

-- Booking subjects (participants only)
create policy "booking_subjects_read_participants" on public.booking_subjects
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.parent_id = auth.uid() or b.teacher_id = auth.uid())
    )
  );
create policy "booking_subjects_insert_parent" on public.booking_subjects
  for insert with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.parent_id = auth.uid()
    )
  );

-- Messages (only participants of the booking)
create policy "messages_read_participants" on public.messages
  for select using (exists (select 1 from public.bookings b where b.id = booking_id and (b.parent_id = auth.uid() or b.teacher_id = auth.uid())));
create policy "messages_insert_participants" on public.messages
  for insert with check (exists (select 1 from public.bookings b where b.id = booking_id and (b.parent_id = auth.uid() or b.teacher_id = auth.uid())));

-- Reviews (only parent from a completed booking)
create policy "reviews_read_all" on public.reviews
  for select using (true);
create policy "reviews_insert_parent" on public.reviews
  for insert with check (
    parent_id = auth.uid() and
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.parent_id = auth.uid()
        and b.status = 'completed'
    )
  );

-- 7) Public read-only refs
create index if not exists idx_teacher_subjects_subject on public.teacher_subjects(subject_id);
create index if not exists idx_teacher_profiles_levels on public.teacher_profiles using gin(levels);
create index if not exists idx_teacher_neighborhoods_teacher on public.teacher_neighborhoods(teacher_id);
create index if not exists idx_teacher_neighborhoods_neighborhood on public.teacher_neighborhoods(neighborhood_id);
create index if not exists idx_bookings_teacher on public.bookings(teacher_id);
create index if not exists idx_bookings_parent on public.bookings(parent_id);
create index if not exists idx_booking_subjects_booking on public.booking_subjects(booking_id);

-- 8) Storage (avatars)
insert into storage.buckets (id, name, public) values ('avatars','avatars', true)
  on conflict (id) do nothing;

create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars authenticated upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars');
create policy "avatars owner update" on storage.objects
  for update to authenticated using (bucket_id = 'avatars' and owner = auth.uid());
create policy "avatars owner delete" on storage.objects
  for delete to authenticated using (bucket_id = 'avatars' and owner = auth.uid());

-- 9) Seed minimal neighborhoods/subjects (optional)
insert into public.neighborhoods(name) values
  ('Akwa'),('Bonapriso'),('Bonamoussadi'),('Deido')
on conflict do nothing;

insert into public.subjects(name) values
  ('Maths'),('Physique'),('SVT'),('Français'),('Anglais')
on conflict do nothing;
