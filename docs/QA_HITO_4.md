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
- Migración remota: aplicada y registrada como `202611240001` en `nvrmatyniuiliqyyrmxw` con autorización expresa del propietario.
- Aislamiento remoto: superado con dos usuarios ficticios. Cada agente solo lee sus expedientes/documentos; las mutaciones directas y la lectura de conexiones quedan bloqueadas al navegador.
- Playwright real: 24/24 en escritorio y móvil, incluyendo autenticación, Contactos, Agenda y la nueva interfaz documental.
- Capturas responsive: cuatro imágenes revisadas visualmente para ficha e Integraciones, en escritorio y móvil.
- GitHub Actions: ejecución `45370673060` superada en la PR #3 (lint, TypeScript, unitarias, build y Playwright).

## Pendiente de configuración o ejecución externa

- El propietario confirmó la conexión real, creación y apertura de una carpeta, subida y apertura de archivos y ausencia de carpetas duplicadas al activar el expediente.
- Sigue pendiente el ensayo comparativo con archivos externos de la sección siguiente.
- PR independiente: #3, abierta como borrador y sin fusión automática.

## Garantías de alcance

- Calendar permanece funcional y conserva su conexión propia.
- No se han solicitado permisos de Gmail ni leído correos.
- No se borran carpetas o archivos de Drive en ninguna operación.
- No se han incluido credenciales ni datos reales en Git.

## Listado documental en vivo

La ficha consulta `files.list` en cada carga para los hijos directos del expediente autenticado. Recorre todas las páginas, elimina repeticiones por ID y usa el nombre, fecha y enlace actuales de Drive. Si una página falla, la ficha muestra un error. La consulta no descarga contenido ni cambia datos de Drive o Supabase. Las referencias existentes siguen registrando las subidas de la aplicación.

Validación del cambio: lint, TypeScript y build superados, 48/48 pruebas unitarias y 12/12 pruebas de Playwright de demo en escritorio y móvil. Los 12 escenarios de Playwright que requieren cuentas de Supabase se omitieron en la copia temporal sin credenciales. Las pruebas del adaptador simulan respuestas de Drive y no sustituyen el ensayo con la API real.

### Alcance de los permisos

| Archivo en la carpeta | Visibilidad esperada con `drive.file` |
| --- | --- |
| Creado desde Oficina Digital | Visible mientras esté en la carpeta, el usuario conserve acceso y el archivo siga autorizado para la app. |
| Añadido directamente en Drive por el agente | Solo visible si ese archivo ya está autorizado individualmente para la app. |
| Añadido directamente por manager o coordinación | Misma condición por archivo. Los permisos que hereda el usuario en Drive no equivalen a autorización de la app. |

La matriz refleja el modelo de autorización documentado por Google. El ensayo comparativo de los tres orígenes con la API real queda pendiente. Fuentes: [permisos por archivo y clasificación de scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth), [paginación de files.list](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list).

### Opción para la sincronización completa

Si el propietario lo autoriza, añadir `drive.metadata.readonly` únicamente a la conexión Drive y conservar `drive.file` para crear carpetas y subir archivos. Solicitar el nuevo consentimiento y comprobar los permisos concedidos antes de anunciar cobertura completa. Reutilizar el listado con filtro por padre y permitir solo los campos mínimos. El permiso por sí mismo permite leer metadatos del Drive accesible al usuario, más allá de la carpeta que Oficina Digital efectivamente consulta. No habilita leer contenido. Los enlaces de Google abren con la sesión de Google del usuario y sus permisos.

Google clasifica este permiso como restringido. Para comercializar una aplicación externa, hay que revisar elegibilidad, completar la verificación correspondiente y prever una evaluación de seguridad si el servidor transmite o almacena los datos cubiertos, según los requisitos aplicables. Los nombres de archivos también pueden contener datos personales. Como alternativa, evaluar una identidad dedicada de integración con acceso de solo lectura concedido de forma explícita a carpetas de trabajo. Limita los recursos accesibles a esa identidad, pero exige gestionar permisos y bajas por carpeta, depende de las reglas de compartición de cada organización y requiere verificar por separado que cada agente conserve acceso. El alcance OAuth actual sigue siendo `drive.file`. [Política de datos de Google Workspace](https://developers.google.com/workspace/workspace-api-user-data-developer-policy).

### Ensayo con Drive real

1. En un expediente ficticio, sube `prueba-app.pdf` desde la ficha. Comprueba que aparece y se abre.
2. Añade `prueba-agente.pdf` directamente desde la cuenta del agente en Drive. Pide a un colaborador con acceso previo que añada `prueba-colaborador.pdf`. Usa archivos sin datos reales.
3. Comprueba los tres nombres en la carpeta de Drive. Pulsa **Actualizar documentos** en la ficha. El listado usa la API real y solo devuelve lo autorizado por el token. Registra por separado qué archivos aparecen y si se abren. Tras una posible ampliación autorizada, el criterio de aceptación es que aparezcan y se abran los tres, sujeto a los permisos de Google del agente.
4. Renombra el PDF subido desde la app, actualiza y comprueba que aparece una sola vez con el nuevo nombre. Muévelo fuera de la carpeta y vuelve a actualizar para comprobar que desaparece. Si pruebas eliminación, usa exclusivamente archivos ficticios y la papelera de Drive.
5. Comprueba que abrir o actualizar repetidamente la ficha conserva la misma carpeta y que el listado no duplica archivos. Repite el renombrado y movimiento para cada archivo externo que sea visible.
