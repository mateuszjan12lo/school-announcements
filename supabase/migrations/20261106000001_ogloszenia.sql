-- SchoolPulse: proste ogłoszenia szkolne. Schemat produkcyjny – NIE zawiera żadnych danych ani kont.
-- Administratora tworzy się ręcznie (Supabase Auth + wpis w tabeli admins) – patrz DEPLOYMENT.md.

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);
create unique index classes_name_key on public.classes (lower(name));

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 120),
  body text not null default '' check (char_length(body) <= 2000),   -- zwykły tekst, escapowany przy wyświetlaniu
  class_id uuid references public.classes(id) on delete restrict,   -- null = cała szkoła; klasy w użyciu nie da się usunąć
  pinned boolean not null default false,
  deadline_at timestamptz,                                           -- termin (trafia do kalendarza)
  expires_at timestamptz,                                            -- po tej dacie znika z listy publicznej
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or deadline_at is null or expires_at >= deadline_at)
);
-- Lista publiczna: przypięte, potem najnowsze; filtr po klasie i wygaśnięciu.
create index announcements_feed_idx on public.announcements (pinned desc, created_at desc);
create index announcements_expires_idx on public.announcements (expires_at) where expires_at is not null;
create index announcements_class_idx on public.announcements (class_id);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger announcements_touch before update on public.announcements for each row execute function public.touch_updated_at();

-- Lista administratorów: kto jest w tej tabeli, ten może zarządzać. Rola NIGDY nie pochodzi z przeglądarki ani z user_metadata.
create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid()) $$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.classes enable row level security;
alter table public.announcements enable row level security;
alter table public.admins enable row level security;

-- Publiczny odczyt: tylko niewygasłe ogłoszenia (administrator widzi wszystkie).
create policy classes_read on public.classes for select using (true);
create policy announcements_read on public.announcements for select using (expires_at is null or expires_at > now() or public.is_admin());
-- Zapis: wyłącznie administrator.
create policy classes_write on public.classes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy announcements_write on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Administrator widzi tylko własny wpis (do sprawdzenia roli); nikt nie zapisuje do admins przez API (tylko service_role / SQL).
create policy admins_self on public.admins for select to authenticated using (user_id = auth.uid());

-- Dane wyłącznie przez RLS: anon nie ma uprawnień zapisu na poziomie GRANT.
revoke insert, update, delete, truncate on public.classes, public.announcements, public.admins from anon;
revoke all on public.admins from anon;
