create extension if not exists pgcrypto;

create type public.contact_kind as enum ('seller', 'buyer', 'both');
create type public.activity_kind as enum ('note', 'call', 'visit', 'event');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 120),
  avatar_url text,
  locale text not null default 'es' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  kind public.contact_kind not null,
  first_name text not null check (char_length(trim(first_name)) between 1 and 120),
  last_name text not null default '' check (char_length(last_name) <= 160),
  email text check (email is null or char_length(email) <= 320),
  phone text check (phone is null or char_length(phone) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  author_id uuid not null references auth.users(id) on delete restrict default auth.uid(),
  kind public.activity_kind not null,
  body text not null check (char_length(trim(body)) between 1 and 10000),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index contacts_owner_id_idx on public.contacts(owner_id);
create index contacts_owner_name_idx on public.contacts(owner_id, last_name, first_name);
create index contact_activities_owner_id_idx on public.contact_activities(owner_id);
create index contact_activities_contact_occurred_idx on public.contact_activities(contact_id, occurred_at desc);

alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_activities enable row level security;

revoke all on table public.profiles, public.contacts, public.contact_activities from anon, authenticated;
grant select, insert, update, delete on table public.profiles, public.contacts, public.contact_activities to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_delete_own on public.profiles for delete to authenticated using ((select auth.uid()) = id);

create policy contacts_select_own on public.contacts for select to authenticated using ((select auth.uid()) = owner_id);
create policy contacts_insert_own on public.contacts for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy contacts_update_own on public.contacts for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy contacts_delete_own on public.contacts for delete to authenticated using ((select auth.uid()) = owner_id);

create policy activities_select_own on public.contact_activities for select to authenticated using ((select auth.uid()) = owner_id);
create policy activities_insert_own on public.contact_activities for insert to authenticated with check (
  (select auth.uid()) = owner_id and (select auth.uid()) = author_id and
  exists (select 1 from public.contacts c where c.id = contact_id and c.owner_id = (select auth.uid()))
);
create policy activities_update_own on public.contact_activities for update to authenticated using ((select auth.uid()) = owner_id) with check (
  (select auth.uid()) = owner_id and (select auth.uid()) = author_id and
  exists (select 1 from public.contacts c where c.id = contact_id and c.owner_id = (select auth.uid()))
);
create policy activities_delete_own on public.contact_activities for delete to authenticated using ((select auth.uid()) = owner_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
