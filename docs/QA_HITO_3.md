# QA — Hito 3

Fecha: 19 de noviembre de 2026. Rama: `hito-3-agenda-calendar`.

## Implementado

- Agenda privada con vistas de día y semana, alta, consulta, edición, cancelación, contacto opcional, recordatorios y detección de solapamiento con confirmación explícita.
- Conversión de hora local `Europe/Madrid` a UTC, incluidos días de 23/25 horas y rechazo de horas inexistentes por cambio estacional.
- Resumen de agenda y próxima cita en el escritorio; navegación móvil activa.
- Tablas `appointments`, `appointment_participants` (preparación de modelo, sin invitaciones) y almacén cifrado para conexión Google.
- OAuth Authorization Code con `state`, PKCE, scopes mínimos, calendario secundario, FreeBusy personal sin detalles persistidos, IDs deterministas y desconexión no destructiva.
- Edición remota real mediante `PUT` e `If-Match`; un `409` obliga a verificar la identidad del evento y reemplazarlo, nunca se considera por sí solo una actualización correcta.
- Los bloques personales aparecen como **Ocupado · Personal** y participan en la comprobación previa de solapamientos. Si FreeBusy falla, guardar exige confirmación expresa.
- La reconexión comprueba y reutiliza el calendario laboral anterior cuando sigue accesible. Solo crea otro si Google confirma que el anterior ya no está disponible.
- Errores temporales de Google se reintentan de forma acotada. Los fallos definitivos, incluida una cancelación remota fallida, quedan guardados y ofrecen reintento manual sin revertir la cita local.
- El formulario mantiene un borrador controlado completo. Las respuestas de validación, solapamiento local/personal y fallo FreeBusy devuelven y rehidratan fecha, horas, título, contacto, tipo, ubicación, recordatorio y descripción antes de confirmar.

## Verificado realmente

- Migración `202611190001_hito_3_agenda.sql` aplicada al proyecto Supabase `nvrmatyniuiliqyyrmxw` mediante `supabase db push --remote --yes`.
- Dos usuarios ficticios se autenticaron; ambos perfiles existen y no son visibles entre sí.
- RLS remota: cada usuario creó, consultó, modificó y eliminó su propia cita; no pudo leer, modificar ni eliminar la cita ajena ni vincular una cita al contacto ajeno.
- La matriz RLS remota se repitió después de las correcciones de Google con el mismo resultado correcto.
- La prueba eliminó los datos ficticios creados.
- `npm run lint`: correcto.
- `npm run typecheck`: correcto.
- `npm test`: 36/36 pruebas unitarias correctas. Incluyen el borrador íntegro y respuestas Google simuladas para actualización con ETag, conflicto 409, errores internos de FreeBusy, reutilización del calendario y reintentos/fallos de cancelación.
- `npm run build`: compilación de producción correcta. El primer intento encontró un bloqueo `EPERM` de OneDrive en `.next`; tras eliminar solo esa salida generada, la compilación terminó correctamente.
- `npm run test:e2e`: 22/22 pruebas correctas en escritorio y móvil: autenticación, contactos, demo, teclado, responsive y seis recorridos de Agenda.
- Playwright de agenda: CRUD, edición, vista semanal y cancelación correctos tanto en escritorio como en móvil. Las capturas están en `docs/screenshots/hito-3/`.
- Tras las correcciones de revisión, Playwright de agenda volvió a pasar: 2/2 proyectos (escritorio y móvil); se actualizaron las capturas correspondientes.
- Regresión del 23/11/2026: editar a otra fecha/hora solapada, recibir el aviso, confirmar y guardar conserva exactamente el borrador y persiste los nuevos valores en Supabase. También se verifica que un error de validación conserva todos los campos. Ambos recorridos pasan en escritorio y móvil.
- El adaptador Google simulado verifica que una edición sincronizada realiza un único `PUT` con ETag y ninguna creación `POST`, evitando duplicados.
- GitHub Actions `quality` #44523484715 completó correctamente sobre `91d234b`. Solo emitió un aviso no bloqueante: `actions/checkout@v4` y `actions/setup-node@v4` declaran Node 20 y el runner los fuerza a Node 24.

## Requiere configuración externa o validación final

- Las variables OAuth locales están configuradas, pero la matriz real completa de conexión, FreeBusy, actualización, renovación y desconexión con una cuenta autorizada sigue pendiente de aprobación manual. Seguir `docs/GOOGLE_CALENDAR_SETUP.md`.
- La interfaz consulta disponibilidad de Google solo cuando la conexión está configurada; ante fallo no presupone que el usuario esté libre.
- Las pruebas con API simulada verifican la lógica y los errores esperados, pero no sustituyen la prueba OAuth con una cuenta autorizada.

No se usaron clientes reales, no se habilitaron servicios de pago y no se implementaron invitaciones ni roles avanzados.
