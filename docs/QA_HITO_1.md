# QA — Hito 1

Fecha: 16 de noviembre de 2026.

## Matriz

| Verificación | Comando | Estado inicial |
|---|---|---|
| ESLint | `npm run lint` | Superado, 0 errores |
| TypeScript estricto | `npm run typecheck` | Superado, 0 errores |
| Componentes/estados | `npm test` | Superado, 2 archivos / 4 tests |
| Compilación de producción | `npm run build` | Superada con Next.js 16.4.6 y Webpack |
| Móvil y escritorio | `npm run test:e2e` | Superado, 8/8 en Chromium (móvil y escritorio) |
| Aislamiento RLS | `npm run db:test` | No ejecutado: este equipo no dispone de Docker ni Supabase CLI |

No se considera verificada una fila hasta registrar una ejecución real. El informe se actualizará durante la implementación.

La autenticación contra un proyecto real no se ha ejecutado porque no se proporcionaron credenciales de Supabase. El flujo, las rutas y las migraciones están implementados; deben validarse al conectar el proyecto. Las capturas verificadas están en `docs/screenshots/inicio-desktop.png` y `docs/screenshots/inicio-mobile.png`.

## Cobertura funcional preparada

- Modo demo etiquetado y separado.
- Estado real sin cifras ficticias.
- Acciones futuras deshabilitadas con explicación.
- Login, cierre de sesión, persistencia SSR y ruta de perfil protegida.
- Políticas RLS y prueba con dos identidades.
- Navegación táctil y responsive con proyectos Playwright móvil/escritorio.
