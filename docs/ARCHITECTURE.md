# Arquitectura

## Decisiones del Hito 1

- **Next.js App Router y TypeScript estricto:** páginas y consultas sensibles se ejecutan en servidor; los componentes cliente se limitan a interacción local, como el tema.
- **Supabase SSR:** `@supabase/ssr` conserva sesiones en cookies. `src/proxy.ts` refresca el usuario y protege rutas, mientras cada página sensible vuelve a validar con `auth.getUser()`.
- **Seguridad en profundidad:** la UI y las rutas protegen la experiencia, pero la autorización definitiva vive en PostgreSQL mediante RLS.
- **Demo aislada:** `/demo` recibe datos literales sin escribir ni consultar Supabase. La aplicación real está en `/app`.
- **Integraciones por contrato:** las interfaces `DriveProvider`, `CalendarProvider` y `AiProvider` definen límites sin crear implementaciones falsas.
- **Webpack como compilador actual:** Next.js 16.4.6 presentó un fallo interno de Turbopack/PostCSS reproducible en el entorno Windows de desarrollo. Los scripts usan la alternativa soportada `--webpack`; se puede reevaluar Turbopack cuando el fallo esté corregido.

## Capas

1. `src/app`: composición de rutas y acciones HTTP/servidor.
2. `src/components`: componentes visuales sin acceso directo a secretos.
3. `src/lib`: tipos, configuración, acceso a Supabase y contratos de proveedores.
4. `supabase`: esquema, integridad, índices y autorización reproducibles.

## Modelo

`auth.users` posee un `profile` y muchos `contacts`. Un contacto posee muchas `contact_activities`. Las tres tablas públicas están protegidas por `owner_id` o por el identificador del perfil. La actividad conserva además `author_id`, preparando una futura autorización explícita sin compartir toda la cartera.

El Hito 3 añade `appointments` como fuente de verdad local. `appointment_participants` solo prepara el modelo futuro y no concede acceso ni envía invitaciones. Google Calendar permanece tras un adaptador de servidor; FreeBusy no se persiste y los tokens cifrados están en una tabla sin permisos de cliente.

El Hito 4 mantiene una conexión OAuth de Drive separada de Calendar, aunque comparte el cliente Google, PKCE y el cifrado. `contact_drive_folders` vincula un único expediente al ID interno del contacto; una reclamación atómica impide que doble clic y reintentos creen carpetas duplicadas. `contact_documents` solo conserva metadatos y el identificador remoto: los bytes se transmiten a Drive y no se persisten en Supabase. `source`, `source_email_id` y `source_reference` dejan preparado el origen futuro Gmail o generación interna sin conceder permisos de correo.
