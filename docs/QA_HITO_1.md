# QA — Hito 1

Última actualización: 17 de noviembre de 2026.

## Estado del cierre

### Implementado

- Aplicación Next.js responsive, tema persistente y modo demostración aislado.
- Autenticación SSR con Supabase, login, cierre de sesión, perfil y rutas protegidas.
- Migración reproducible para perfiles, contactos y actividades.
- Políticas RLS separadas para `select`, `insert`, `update` y `delete`.
- Suite pgTAP local y verificador remoto con dos usuarios autenticados normales.
- Contratos desacoplados para Drive, Calendar e IA.

### Verificado

- Proyecto Supabase `nvrmatyniuiliqyyrmxw` vinculado mediante CLI.
- Migración `202611160001_hito_1_foundation.sql` aplicada y registrada en remoto.
- Site URL y redirect URL de Auth configuradas como `http://localhost:3000`.
- Autenticación real de dos usuarios ficticios diferentes.
- Creación automática y privacidad de ambos perfiles.
- CRUD propio de contactos para ambos usuarios.
- Denegación cruzada de lectura, creación atribuida, modificación y eliminación.
- Privacidad de actividades y denegación de anotaciones sobre contactos ajenos.
- Persistencia de sesión, perfil y logout reales en móvil y escritorio.
- Demo sin tráfico externo ni solicitudes de escritura.
- Navegación básica por teclado, landmarks y ausencia de desbordamiento horizontal.
- Historial Git sin archivos locales ni credenciales versionadas.

### Pendiente externo

- `supabase test db --remote` no pudo ejecutar pgTAP porque Supabase CLI requiere Docker o Podman para `pg_prove`. La misma política RLS sí quedó verificada contra el proyecto alojado mediante `npm run test:supabase` y sesiones reales.
- Confirmar la rotación de las claves legacy/JWT. Supabase CLI 3.2.0 mostró una clave legacy `service_role` completa al ejecutar `projects api-keys` sin `--reveal`. La clave no se usó ni se escribió en archivos, pero debe considerarse expuesta.

## Matriz de resultados

| Verificación | Comando | Resultado |
|---|---|---|
| Enlace del proyecto | `npx supabase link --project-ref nvrmatyniuiliqyyrmxw` | Superado |
| Simulación de migraciones | `npx supabase db push --remote --dry-run` | Superado; una migración prevista |
| Aplicación de migraciones | `npx supabase db push --remote --yes` | Superado |
| Estado de migraciones | `npx supabase migration list --remote` | Local y remoto: `202611160001` |
| Configuración Auth | `npx supabase config diff/push --remote` | Site URL y redirect URL verificadas |
| RLS remoto | `npm run test:supabase` | Superado con dos usuarios y limpieza final |
| ESLint | `npm run lint` | Superado, 0 errores |
| TypeScript estricto | `npm run typecheck` | Superado, 0 errores |
| Componentes/estados | `npm test` | Superado, 2 archivos / 4 tests |
| Compilación de producción | `npm run build` | Superada con `.env.local` y Next.js 16.4.6 |
| Navegador móvil/escritorio | `npm run test:e2e` | Superado: 14/14 en Chromium |
| pgTAP remoto | `npx supabase test db --remote` | No ejecutado: requiere Docker/Podman |
| Dependencias | `npm audit --json` | 0 vulnerabilidades conocidas en la última consulta |

## Cobertura RLS ejecutada

El verificador remoto usa exclusivamente la Publishable key y las sesiones de los dos usuarios ficticios; no usa `service_role`.

1. Ambos usuarios inician sesión y solo leen su propio perfil.
2. A crea, consulta, modifica y elimina un contacto propio.
3. B crea, consulta, modifica y elimina un contacto propio.
4. A no puede leer el contacto de B y B no puede leer el de A.
5. B no puede modificar ni eliminar el contacto de A.
6. B no puede crear un contacto atribuido a A.
7. A crea una actividad propia; B no puede leerla ni añadir actividades al contacto de A.
8. Los contactos ficticios se eliminan al finalizar, incluso ante fallo.

## Seguridad de archivos locales

`.env.local`, `.env.test.local` y `supabase/.temp/` están ignorados por Git. Las pruebas de seguimiento confirmaron que ninguno está versionado. `.env.test.example` contiene solo marcadores y puede publicarse.

Las capturas de referencia permanecen en `docs/screenshots/`. Las capturas generadas por Playwright se escriben en `test-results/`, que también está ignorado, para no ensuciar el repositorio.

## Incidencias resueltas

- Los usuarios iniciales devolvieron `invalid_credentials`; se recrearon como usuarios ficticios confirmados y la repetición pasó.
- Una prueba antigua esperaba redirección a demo sin configuración. Ahora comprueba `/login` cuando Supabase está configurado y mantiene la expectativa de demo cuando no lo está.
- Turbopack presentó un fallo interno PostCSS en Windows; los scripts mantienen Webpack, cuya compilación está verificada localmente y en GitHub Actions.
