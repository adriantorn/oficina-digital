create type public.appointment_type as enum ('visit', 'valuation', 'call', 'meeting', 'other');
create type public.appointment_status as enum ('scheduled', 'cancelled', 'completed');
create type public.appointment_sync_status as enum ('local', 'pending', 'synced', 'error');
create type public.appointment_participant_role as enum ('manager', 'guest');
create type public.appointment_invitation_status as enum ('pending', 'accepted', 'declined');

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  contact_id uuid references public.contacts(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text check (description is null or char_length(description) <= 5000),
  appointment_type public.appointment_type not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  time_zone text not null default 'Europe/Madrid' check (char_length(time_zone) between 1 and 64),
  location text check (location is null or char_length(location) <= 500),
  status public.appointment_status not null default 'scheduled',
  reminder_minutes smallint check (reminder_minutes is null or reminder_minutes in (15, 30, 60)),
  google_event_id text,
  google_event_etag text,
  google_sync_status public.appointment_sync_status not null default 'local',
  google_sync_error text check (google_sync_error is null or char_length(google_sync_error) <= 500),
  google_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_valid_interval check (ends_at > starts_at)
);

create table public.appointment_participants (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  participant_user_id uuid references auth.users(id) on delete cascade,
  role public.appointment_participant_role not null default 'guest',
  invitation_status public.appointment_invitation_status not null default 'pending',
  details_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, participant_user_id)
);

create table public.google_calendar_connections (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_access_token text,
  encrypted_refresh_token text,
  token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  granted_scopes text[] not null default '{}',
  calendar_id text,
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  last_error text check (last_error is null or char_length(last_error) <= 500),
  connected_at timestamptz,
  disconnected_at timestamptz,
  updated_at timestamptz not null default now()
);

create index appointments_owner_starts_idx on public.appointments(owner_id, starts_at);
create index appointments_owner_status_starts_idx on public.appointments(owner_id, status, starts_at);
create index appointments_contact_starts_idx on public.appointments(contact_id, starts_at desc);
create index appointment_participants_owner_idx on public.appointment_participants(owner_id);
create unique index appointments_google_event_unique_idx on public.appointments(owner_id, google_event_id) where google_event_id is not null;

create or replace function public.validate_appointment_contact_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.contact_id is not null and not exists (
    select 1 from public.contacts c where c.id = new.contact_id and c.owner_id = new.owner_id
  ) then
    raise exception 'appointment contact must belong to owner' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_appointment_contact_owner() from public, anon, authenticated;

create or replace function public.validate_appointment_participant_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.appointments a where a.id = new.appointment_id and a.owner_id = new.owner_id
  ) then
    raise exception 'participant appointment must belong to owner' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_appointment_participant_owner() from public, anon, authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_updated_at() from public, anon, authenticated;

create trigger appointments_validate_contact before insert or update of contact_id, owner_id on public.appointments
for each row execute procedure public.validate_appointment_contact_owner();
create trigger participants_validate_appointment before insert or update of appointment_id, owner_id on public.appointment_participants
for each row execute procedure public.validate_appointment_participant_owner();
create trigger appointments_set_updated_at before update on public.appointments
for each row execute procedure public.set_updated_at();
create trigger participants_set_updated_at before update on public.appointment_participants
for each row execute procedure public.set_updated_at();
create trigger google_connections_set_updated_at before update on public.google_calendar_connections
for each row execute procedure public.set_updated_at();

alter table public.appointments enable row level security;
alter table public.appointment_participants enable row level security;
alter table public.google_calendar_connections enable row level security;

revoke all on table public.appointments, public.appointment_participants, public.google_calendar_connections from anon, authenticated;
grant select, insert, update, delete on table public.appointments, public.appointment_participants to authenticated;

create policy appointments_select_own on public.appointments for select to authenticated
using ((select auth.uid()) = owner_id);
create policy appointments_insert_own on public.appointments for insert to authenticated
with check (
  (select auth.uid()) = owner_id and
  (contact_id is null or exists (select 1 from public.contacts c where c.id = contact_id and c.owner_id = (select auth.uid())))
);
create policy appointments_update_own on public.appointments for update to authenticated
using ((select auth.uid()) = owner_id)
with check (
  (select auth.uid()) = owner_id and
  (contact_id is null or exists (select 1 from public.contacts c where c.id = contact_id and c.owner_id = (select auth.uid())))
);
create policy appointments_delete_own on public.appointments for delete to authenticated
using ((select auth.uid()) = owner_id);

create policy participants_select_own on public.appointment_participants for select to authenticated
using ((select auth.uid()) = owner_id);
create policy participants_insert_own on public.appointment_participants for insert to authenticated
with check (
  (select auth.uid()) = owner_id and
  exists (select 1 from public.appointments a where a.id = appointment_id and a.owner_id = (select auth.uid()))
);
create policy participants_update_own on public.appointment_participants for update to authenticated
using ((select auth.uid()) = owner_id)
with check (
  (select auth.uid()) = owner_id and
  exists (select 1 from public.appointments a where a.id = appointment_id and a.owner_id = (select auth.uid()))
);
create policy participants_delete_own on public.appointment_participants for delete to authenticated
using ((select auth.uid()) = owner_id);

comment on table public.appointment_participants is 'Estructura reservada para invitaciones futuras; Hito 3 no envía invitaciones ni comparte fichas.';
comment on table public.google_calendar_connections is 'Solo accesible mediante el adaptador de servidor privilegiado; nunca se concede acceso a anon/authenticated.';
