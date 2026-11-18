# Oficina Digital

Aplicación personal para agentes inmobiliarios. El Hito 2 incorpora un escritorio operativo y la gestión privada de contactos y conversaciones sobre la base autenticada y protegida del Hito 1. La filosofía del producto es sencilla: menos tareas repetitivas y más control sobre la cartera propia.

## Requisitos

- Node.js 20.9 o posterior (recomendado: Node 22 LTS).
- npm.
- Opcional para el modo real: proyecto Supabase y Supabase CLI.

## Arranque rápido

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. Sin variables de Supabase se abre automáticamente `/demo`, con datos ficticios claramente identificados y sin persistencia.

## Configuración real

1. Copia `.env.example` como `.env.local`.
2. En Supabase, toma la URL del proyecto y la clave **publishable**; nunca uses una clave `service_role` en el navegador.
3. Completa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Aplica `supabase/migrations/202611160001_hito_1_foundation.sql` con `supabase db push` o enlazando el proyecto desde la CLI.
5. Crea un usuario desde el panel de Auth de Supabase y abre `/login`.

La app conserva la sesión en cookies, protege `/app` y permite cerrar sesión desde el perfil. Tras iniciar sesión, abre `/app` para ver el escritorio o `/app/contacts` para crear, buscar, filtrar, editar y eliminar contactos y registrar anotaciones. El modo real no muestra cifras ficticias: la agenda continúa identificada como futura.

## Comprobaciones

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:supabase
```

Las pruebas RLS requieren Docker y Supabase CLI:

```bash
supabase start
npm run db:test
```

La comprobación alojada sin Docker usa dos usuarios ficticios configurados únicamente en `.env.test.local` y ejecuta `npm run test:supabase`. Consulta [SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

## Estructura

- `src/app`: rutas, escritorio protegido, contactos, login y acciones de servidor.
- `src/components`: interfaz reutilizable y accesible.
- `src/lib`: configuración, tipos y clientes Supabase.
- `supabase/migrations`: esquema versionado, índices y políticas RLS.
- `supabase/tests`: aislamiento real de dos usuarios con pgTAP.
- `e2e`: recorridos responsive con Playwright.
- `docs`: arquitectura, seguridad, integraciones, hoja de ruta y QA.

La conexión del entorno real está descrita paso a paso en [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md).

## Repositorio y colaboración

El repositorio público es `adriantorn/oficina-digital`. No se ha elegido licencia; el propietario debe decidirla. Consulta [CONTRIBUTING.md](CONTRIBUTING.md). No añadas datos reales de clientes ni secretos al repositorio.

Protege `main`: pull request obligatorio, al menos una aprobación, conversación resuelta y verificación `quality` de GitHub Actions superada. El flujo de ramas está definido en [CONTRIBUTING.md](CONTRIBUTING.md).
