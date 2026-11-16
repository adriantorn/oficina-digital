begin;
select plan(10);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'uno@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'dos@example.test');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$insert into public.contacts (id, owner_id, kind, first_name) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'seller', 'Contacto uno') returning id$$,
  $$values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid)$$,
  'el agente crea su contacto'
);
select throws_ok($$insert into public.contacts (owner_id, kind, first_name) values ('22222222-2222-2222-2222-222222222222', 'buyer', 'Ajeno')$$, '42501', null, 'no puede crear para otro agente');
select results_eq($$select count(*)::bigint from public.contacts$$, array[1::bigint], 'solo ve su contacto');
select results_eq(
  $$insert into public.contact_activities (contact_id, owner_id, author_id, kind, body) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'note', 'Privada') returning contact_id$$,
  $$values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid)$$,
  'crea una actividad propia'
);
select results_eq($$select count(*)::bigint from public.contact_activities$$, array[1::bigint], 've su actividad');

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select results_eq($$select count(*)::bigint from public.contacts$$, array[0::bigint], 'el segundo agente no ve el contacto');
select results_eq($$select count(*)::bigint from public.contact_activities$$, array[0::bigint], 'el segundo agente no ve la actividad');
select is_empty($$update public.contacts set first_name = 'Robado' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' returning id$$, 'no puede modificar el contacto');
select is_empty($$delete from public.contacts where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' returning id$$, 'no puede borrar el contacto');
select throws_ok($$insert into public.contact_activities (contact_id, owner_id, author_id, kind, body) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'note', 'Intrusión')$$, '42501', null, 'no puede añadir actividad a contacto ajeno');

select * from finish();
rollback;
