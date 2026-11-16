# QA — Hito 1

Última actualización: 16 de noviembre de 2026.

## Estado del cierre

### Implementado

- Aplicación Next.js responsive, tema persistente y modo demostración aislado.
- Cliente SSR de Supabase, login, cierre de sesión, perfil y rutas protegidas.
- Migración reproducible para perfiles, contactos y actividades.
- Políticas RLS separadas para `select`, `insert`, `update` y `delete`.
- Suite pgTAP de aislamiento con dos usuarios y 10 aserciones.
- Contratos independientes para Drive, Calendar e IA.

### Verificado

- Calidad estática, pruebas unitarias, build de producción y recorridos Playwright.
- Demo sin tráfico externo ni peticiones de escritura durante los recorridos.
- Navegación básica por teclado, landmarks y ausencia de desbordamiento horizontal.
- Historial Git sin secretos detectados por búsqueda de patrones comunes.
- Auditoría npm consultada el 16/11/2026: 0 vulnerabilidades conocidas.

### Requiere configuración externa

- Crear y conectar un proyecto Supabase de desarrollo.
- Aplicar la migración al proyecto alojado.
- Ejecutar `supabase test db` con Docker y Supabase CLI.
- Validar autenticación y aislamiento contra Supabase real con dos usuarios de prueba.
- Crear el repositorio público `adriantorn/oficina-digital` y hacer el primer push.

## Matriz

| Verificación | Comando | Estado inicial |
|---|---|---|
| ESLint | `npm run lint` | Superado, 0 errores |
| TypeScript estricto | `npm run typecheck` | Superado, 0 errores |
| Componentes/estados | `npm test` | Superado, 2 archivos / 4 tests |
| Compilación de producción | `npm run build` | Superada con Next.js 16.4.6 y Webpack |
| Móvil y escritorio | `npm run test:e2e` | Superado: 12/12 en Chromium, móvil y escritorio |
| Aislamiento RLS | `npm run db:test` | No ejecutado: este equipo no dispone de Docker ni Supabase CLI |
| Dependencias | `npm audit --json` | Superado: 0 vulnerabilidades conocidas |
| Historial Git | búsqueda de patrones sobre `git log -p --all` | Sin credenciales detectadas; coincidencias revisadas eran documentación/nombres de variables |

No se considera verificada una fila hasta registrar una ejecución real. El informe se actualizará durante la implementación.

La autenticación contra un proyecto real no se ha ejecutado porque no se proporcionaron credenciales de Supabase. El flujo, las rutas y las migraciones están implementados; deben validarse al conectar el proyecto. Las capturas verificadas están en `docs/screenshots/inicio-desktop.png` y `docs/screenshots/inicio-mobile.png`.

La publicación de GitHub tampoco se ha ejecutado. La cuenta conectada es `adriantorn`, pero el conector disponible no permite crear repositorios y GitHub CLI no está instalado. El propietario debe crear un repositorio público vacío llamado `oficina-digital`; después se podrá añadir `origin` y conservar el historial con un push normal.

## Cobertura funcional preparada

- Modo demo etiquetado y separado.
- Estado real sin cifras ficticias.
- Acciones futuras deshabilitadas con explicación.
- Login, cierre de sesión, persistencia SSR y ruta de perfil protegida.
- Políticas RLS y prueba con dos identidades.
- Navegación táctil y responsive con proyectos Playwright móvil/escritorio.

## Revisión estática de RLS

Las políticas impiden asignar contactos a otro propietario, mover actividades a contactos ajenos o atribuirlas a otro autor. La eliminación de un contacto propio elimina sus actividades por cascada. Esta revisión no sustituye `supabase test db`; su estado permanece pendiente hasta ejecutar PostgreSQL real.
