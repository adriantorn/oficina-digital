# QA — Hito 3

Fecha: 19 de noviembre de 2026. Rama: `hito-3-agenda-calendar`.

## Implementado

- Agenda privada con vistas de día y semana, alta, consulta, edición, cancelación, contacto opcional, recordatorios y detección de solapamiento con confirmación explícita.
- Conversión de hora local `Europe/Madrid` a UTC, incluidos días de 23/25 horas y rechazo de horas inexistentes por cambio estacional.
- Resumen de agenda y próxima cita en el escritorio; navegación móvil activa.
- Tablas `appointments`, `appointment_participants` (preparación de modelo, sin invitaciones) y almacén cifrado para conexión Google.
- OAuth Authorization Code con `state`, PKCE, scopes mínimos, calendario secundario, FreeBusy personal sin detalles persistidos, IDs deterministas y desconexión no destructiva.

## Verificado realmente

- Migración `202611190001_hito_3_agenda.sql` aplicada al proyecto Supabase `nvrmatyniuiliqyyrmxw` mediante `supabase db push --remote --yes`.
- Dos usuarios ficticios se autenticaron; ambos perfiles existen y no son visibles entre sí.
- RLS remota: cada usuario creó, consultó, modificó y eliminó su propia cita; no pudo leer, modificar ni eliminar la cita ajena ni vincular una cita al contacto ajeno.
- La prueba eliminó los datos ficticios creados.
- `npm run lint`: correcto.
- `npm run typecheck`: correcto.
- `npm test`: 26/26 pruebas unitarias correctas.
- `npm run build`: compilación de producción correcta. El primer intento encontró un bloqueo `EPERM` de OneDrive en `.next`; tras eliminar solo esa salida generada, la compilación terminó correctamente.
- `npm run test:e2e`: 16/16 pruebas heredadas de autenticación, contactos, demo, teclado y responsive correctas en escritorio y móvil.
- Playwright de agenda: CRUD, edición, vista semanal y cancelación correctos tanto en escritorio como en móvil. Las capturas están en `docs/screenshots/hito-3/`.

## Requiere configuración externa o validación final

- Google Cloud OAuth no tiene credenciales locales configuradas: no se ha ejecutado una conexión real, creación de calendario, FreeBusy, sincronización, renovación ni desconexión. Seguir `docs/GOOGLE_CALENDAR_SETUP.md`.
- La interfaz consulta disponibilidad de Google solo cuando la conexión está configurada; ante fallo no presupone que el usuario esté libre.

No se usaron clientes reales, no se habilitaron servicios de pago y no se implementaron invitaciones ni roles avanzados.
