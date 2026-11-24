# QA — Hito 4

Fecha de trabajo: 24 de noviembre de 2026.

## Implementado

- OAuth individual de Drive, PKCE, `state`, tokens cifrados y desconexión independiente de Calendar.
- Scope único `drive.file` y creación/reutilización de `Oficina Digital / Clientes`.
- Expediente único por UUID de contacto, con reclamación atómica, reintentos seguros y soporte de nombres repetidos.
- Subida de PDF, fotografías y documentos habituales hasta 15 MB, listado y apertura desde la ficha.
- Contenido conservado exclusivamente en Drive; Supabase almacena metadatos, procedencia y referencias.
- Modelo preparado para múltiples correos y orígenes `manual`, `gmail` o `generated`, sin implementar Gmail ni solicitar sus permisos.
- RLS de solo lectura por propietario para expedientes/documentos; conexiones y mutaciones reservadas al servidor.

## Verificado

- TypeScript: superado.
- ESLint: superado.
- Pruebas unitarias: 43/43. Incluyen jerarquía, reconexión, idempotencia, contactos homónimos, reintento de subida y validación de tipos/tamaño.
- Build de producción: superado; incluye las rutas protegidas de OAuth, subida y apertura.
- Auditoría npm: 0 vulnerabilidades conocidas.
- Compatibilidad con Calendar: las pruebas unitarias previas de sincronización y disponibilidad permanecen incluidas en las 43/43 y pasan sin cambios.
- Simulación de migración remota: detecta únicamente `202611240001_hito_4_google_drive.sql` contra el proyecto `nvrmatyniuiliqyyrmxw`.

## Pendiente de configuración o ejecución externa

- Aplicar la migración remota: pendiente de confirmación explícita porque la CLI etiqueta el destino vinculado como `production`, aunque se llama `oficina-digital-dev`.
- Habilitar Google Drive API y declarar `drive.file` en el proyecto Google Cloud del propietario.
- Ejecutar conexión real, creación de carpeta, subida y apertura con una cuenta autorizada. No se marca como verificado todavía.
- Ejecutar aislamiento remoto con dos usuarios tras aplicar la migración.
- Ejecutar Playwright escritorio/móvil, capturas finales y GitHub Actions tras disponer del esquema remoto.
- PR independiente: #3, abierta como borrador y sin fusión automática.

## Garantías de alcance

- Calendar permanece funcional y conserva su conexión propia.
- No se han solicitado permisos de Gmail ni leído correos.
- No se borran carpetas o archivos de Drive en ninguna operación.
- No se han incluido credenciales ni datos reales en Git.
