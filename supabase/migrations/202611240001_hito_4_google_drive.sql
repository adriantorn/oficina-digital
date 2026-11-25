create type public.document_source as enum ('manual', 'gmail', 'generated');
create type public.drive_resource_status as enum ('creating', 'ready', 'error');

create table public.google_drive_connections (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_access_token text,
  encrypted_refresh_token text,
  token_expires_at timestamptz,
  granted_scopes text[] not null default '{}',
  root_folder_id text,
  clients_folder_id text,
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  last_error text check (last_error is null or char_length(last_error) <= 500),
  connected_at timestamptz,
  disconnected_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.contact_drive_folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  drive_folder_id text,
  folder_name text not null check (char_length(trim(folder_name)) between 1 and 280),
  status public.drive_resource_status not null default 'creating',
  last_error text check (last_error is null or char_length(last_error) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contact_id),
  unique (owner_id, drive_folder_id)
);

create table public.contact_email_addresses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  email text not null check (char_length(trim(email)) between 3 and 320),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (contact_id, email)
);

create table public.contact_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  folder_id uuid not null references public.contact_drive_folders(id) on delete cascade,
  drive_file_id text,
  name text not null check (char_length(trim(name)) between 1 and 280),
  mime_type text not null check (char_length(mime_type) between 1 and 160),
  size_bytes bigint not null check (size_bytes between 0 and 15728640),
  source public.document_source not null default 'manual',
  source_email_id uuid references public.contact_email_addresses(id) on delete set null,
  source_reference text check (source_reference is null or char_length(source_reference) <= 500),
  operation_reference text check (operation_reference is null or char_length(operation_reference) <= 160),
  status public.drive_resource_status not null default 'creating',
  last_error text check (last_error is null or char_length(last_error) <= 500),
  uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, drive_file_id),
  unique (owner_id, operation_reference)
);

create index contact_drive_folders_owner_idx on public.contact_drive_folders(owner_id);
create index contact_documents_contact_created_idx on public.contact_documents(contact_id, created_at desc);
create index contact_documents_owner_idx on public.contact_documents(owner_id);
create index contact_emails_owner_contact_idx on public.contact_email_addresses(owner_id, contact_id);

create or replace function public.validate_contact_drive_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.contacts c where c.id = new.contact_id and c.owner_id = new.owner_id) then
    raise exception 'drive resource contact must belong to owner' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_contact_drive_owner() from public, anon, authenticated;

create or replace function public.validate_contact_document_links()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.contacts c where c.id = new.contact_id and c.owner_id = new.owner_id) then
    raise exception 'document contact must belong to owner' using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.contact_drive_folders f
    where f.id = new.folder_id and f.contact_id = new.contact_id and f.owner_id = new.owner_id
  ) then
    raise exception 'document folder must belong to contact owner' using errcode = '23514';
  end if;
  if new.source_email_id is not null and not exists (
    select 1 from public.contact_email_addresses e
    where e.id = new.source_email_id and e.contact_id = new.contact_id and e.owner_id = new.owner_id
  ) then
    raise exception 'document email must belong to contact owner' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_contact_document_links() from public, anon, authenticated;

create or replace function public.claim_contact_drive_folder(p_owner_id uuid, p_contact_id uuid, p_folder_name text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  claimed boolean;
begin
  if not exists (select 1 from public.contacts c where c.id = p_contact_id and c.owner_id = p_owner_id) then
    raise exception 'contact not found' using errcode = '42501';
  end if;
  insert into public.contact_drive_folders (owner_id, contact_id, folder_name, status, last_error)
  values (p_owner_id, p_contact_id, p_folder_name, 'creating', null)
  on conflict (contact_id) do update
    set folder_name = excluded.folder_name, status = 'creating', last_error = null, updated_at = now()
    where public.contact_drive_folders.status = 'error'
       or (public.contact_drive_folders.status = 'creating' and public.contact_drive_folders.updated_at < now() - interval '2 minutes');
  claimed := found;
  return claimed;
end;
$$;
revoke all on function public.claim_contact_drive_folder(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.claim_contact_drive_folder(uuid, uuid, text) to service_role;

create trigger drive_folders_validate_owner before insert or update of owner_id, contact_id on public.contact_drive_folders
for each row execute procedure public.validate_contact_drive_owner();
create trigger contact_emails_validate_owner before insert or update of owner_id, contact_id on public.contact_email_addresses
for each row execute procedure public.validate_contact_drive_owner();
create trigger contact_documents_validate_owner before insert or update of owner_id, contact_id, folder_id, source_email_id on public.contact_documents
for each row execute procedure public.validate_contact_document_links();
create trigger drive_connections_set_updated_at before update on public.google_drive_connections
for each row execute procedure public.set_updated_at();
create trigger drive_folders_set_updated_at before update on public.contact_drive_folders
for each row execute procedure public.set_updated_at();
create trigger contact_documents_set_updated_at before update on public.contact_documents
for each row execute procedure public.set_updated_at();

alter table public.google_drive_connections enable row level security;
alter table public.contact_drive_folders enable row level security;
alter table public.contact_email_addresses enable row level security;
alter table public.contact_documents enable row level security;

revoke all on table public.google_drive_connections, public.contact_drive_folders, public.contact_email_addresses, public.contact_documents from anon, authenticated;
grant select on table public.contact_drive_folders, public.contact_email_addresses, public.contact_documents to authenticated;

create policy drive_folders_select_own on public.contact_drive_folders for select to authenticated
using ((select auth.uid()) = owner_id);
create policy contact_emails_select_own on public.contact_email_addresses for select to authenticated
using ((select auth.uid()) = owner_id);
create policy contact_documents_select_own on public.contact_documents for select to authenticated
using ((select auth.uid()) = owner_id);

comment on table public.google_drive_connections is 'Tokens cifrados de Drive, solo accesibles desde el adaptador privilegiado de servidor.';
comment on table public.contact_documents is 'Referencias y metadatos; el contenido permanece exclusivamente en Google Drive.';
comment on column public.contact_documents.source is 'Preparado para subida manual, Gmail futuro o generación desde Oficina Digital.';
