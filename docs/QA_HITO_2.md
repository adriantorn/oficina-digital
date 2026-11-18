# QA — Hito 2

Última actualización: 18 de noviembre de 2026.

## Estado

El Hito 2 está implementado y verificado en la rama `hito-2-contactos`. Queda pendiente la revisión de la pull request antes de incorporarlo a `main`.

### Funcionalidades implementadas

- Escritorio autenticado con saludo, fecha, nombre del agente, número real de contactos y contactos recientes.
- Accesos funcionales para crear, buscar y anotar contactos; agenda y secciones futuras claramente deshabilitadas.
- Listado responsive ordenado por actividad reciente, búsqueda por nombre, apellidos, correo o teléfono y filtros de comprador/vendedor.
- Los contactos de tipo `both` aparecen en ambos filtros sin duplicarse en la base de datos.
- Alta, edición y eliminación con confirmación, validación HTML y validación independiente en servidor.
- Ficha privada con datos básicos, última anotación, historial y creación de nuevas anotaciones.
- Sección de documentación futura sin conexión con Google Drive ni contenido simulado.
- Estados vacíos, carga, error, éxito y navegación móvil.
- Demo sin escritura ni acceso a datos reales.

### Funcionalidades verificadas

- Login, persistencia de sesión, perfil y cierre de sesión en escritorio y móvil.
- CRUD completo de contactos mediante la interfaz real de Supabase.
- Búsqueda, filtros y comportamiento del tipo comprador y vendedor.
- Creación y recuperación de anotaciones en `contact_activities`.
- Rechazo de acceso por URL a una ficha ajena mediante identidad de usuario y RLS.
- Aislamiento bidireccional de lectura, creación atribuida, modificación y eliminación entre dos usuarios ficticios.
- Aislamiento bidireccional de actividades, incluido intento de lectura, modificación, eliminación y creación sobre un contacto ajeno.
- Limpieza automática de los contactos ficticios creados por Playwright, incluso si una prueba falla.
- Experiencia responsive, navegación por teclado, zonas táctiles y ausencia de desbordamiento horizontal en las comprobaciones automatizadas.
- Cinco capturas revisadas visualmente con datos exclusivamente ficticios.

### Configuración externa

- La aplicación requiere `.env.local` con la URL y clave publishable del proyecto Supabase; estos archivos permanecen ignorados por Git.
- Las verificaciones reales requieren dos cuentas ficticias definidas solo en `.env.test.local`.
- Calendar, Google Drive e IA no están conectados y permanecen fuera de alcance.
- La revisión y el merge de la pull request requieren aprobación del propietario.

## Resultados reales

| Verificación | Resultado |
|---|---|
| ESLint | Superado, 0 errores |
| TypeScript estricto | Superado, 0 errores |
| Pruebas unitarias | Superado, 3 archivos / 12 tests |
| Build de producción | Superado con Next.js 16.4.6 y Webpack |
| Playwright | Superado, 16/16 en Chromium, escritorio y móvil |
| Supabase remoto | Superado con dos usuarios autenticados normales |
| Dependencias | `npm audit`: 0 vulnerabilidades conocidas |
| Capturas | 5/5 generadas y revisadas |

## Cobertura del recorrido de contactos

1. Inicio de sesión y apertura del escritorio personal.
2. Creación de un contacto ficticio clasificado como comprador y vendedor.
3. Apertura automática de su ficha y confirmación visible.
4. Creación de una anotación y recuperación en el historial y en el resumen de última conversación.
5. Edición del teléfono y comprobación del cambio.
6. Búsqueda por texto y comprobación en los filtros de vendedores y compradores.
7. Eliminación con confirmación y aviso de éxito.
8. Repetición completa en escritorio y móvil, con limpieza final.

## Seguridad y arquitectura

- Todas las lecturas y mutaciones se realizan con el cliente SSR y la sesión del usuario; no se utiliza `service_role`.
- Las acciones de servidor vuelven a validar identidad, UUID, longitudes, correo y clasificación.
- Las consultas incluyen `owner_id` además de depender de las políticas RLS.
- Las fichas inexistentes o ajenas responden como no encontradas y no revelan datos técnicos.
- Las interfaces de Drive, Calendar e IA del Hito 1 se conservan sin acoplarlas al CRUD.
- No fue necesaria ninguna migración nueva: el Hito 2 reutiliza `contacts`, `contact_activities` y las políticas de `202611160001_hito_1_foundation.sql`, ya aplicada en remoto.

## Capturas

- `docs/screenshots/hito-2/escritorio-inicio.png`
- `docs/screenshots/hito-2/movil-inicio.png`
- `docs/screenshots/hito-2/movil-contactos.png`
- `docs/screenshots/hito-2/contacto-historial.png`
- `docs/screenshots/hito-2/nuevo-contacto.png`

## Arranque local autenticado

1. Instala dependencias con `npm install`.
2. Copia `.env.example` a `.env.local` e introduce la URL y la clave publishable de Supabase.
3. Ejecuta `npm run dev`.
4. Abre `http://localhost:3000/login` e inicia sesión con una cuenta de desarrollo confirmada.
5. El escritorio está en `/app` y la gestión de contactos en `/app/contacts`.

## Limitaciones conocidas

- No hay paginación todavía; el listado está pensado para la escala inicial del producto.
- El historial admite anotaciones manuales, pero no tareas, seguimientos programados ni automatización de llamadas.
- Agenda, Drive e IA se muestran únicamente como capacidades futuras, sin conexión activa.
- En este equipo, OneDrive bloqueó de forma intermitente carpetas generadas dentro de `.next`; la compilación limpia final sí fue superada. No afecta al código ni a GitHub Actions.
