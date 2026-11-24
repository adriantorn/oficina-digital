# Integraciones previstas

## Principio común

Los adaptadores implementarán contratos de `src/lib/types.ts`. Las credenciales se guardarán como secretos del servidor; nunca en `NEXT_PUBLIC_*`, localStorage o respuestas al navegador. Cada conexión tendrá consentimiento, scopes mínimos, estado, última sincronización y revocación.

## Google Drive

El adaptador de servidor usa autorización incremental y únicamente `drive.file`. Crea o reutiliza `Oficina Digital / Clientes / Nombre`, identifica el expediente por el UUID del contacto y almacena solo IDs y metadatos. La conexión, renovación y desconexión son independientes de Calendar. Desconectar o borrar un contacto no elimina contenido remoto. Las operaciones de apertura vuelven a comprobar propietario y conexión antes de pedir a Drive un enlace actual.

No se solicita acceso a Gmail. El modelo admite documentos `manual`, `gmail` o `generated` y múltiples correos por contacto para una fase futura, pero no lee correo ni clasifica adjuntos todavía.

## Google Calendar

La agenda local es la fuente de verdad. La conexión voluntaria usa OAuth Authorization Code, `state` y PKCE, un calendario secundario **Oficina Digital** y los scopes `calendar.freebusy` y `calendar.app.created`. La disponibilidad personal se consulta en vivo como intervalos ocupado/libre sin conservar detalles y se muestra como **Ocupado · Personal**. Los eventos usan un identificador determinista; las ediciones usan `PUT` con ETag y los conflictos se verifican antes de reemplazar. Al reconectar se reutiliza el calendario anterior si sigue autorizado. Los fallos temporales tienen reintentos acotados y los definitivos quedan visibles para reintento manual. Consulta `GOOGLE_CALENDAR_SETUP.md`.

## Inteligencia artificial

`AiProvider` permitirá comenzar con Gemini y sustituirlo sin afectar la UI. Las llamadas serán exclusivamente de servidor, con minimización/redacción de datos, límites de uso y registro sin contenido sensible. La interfaz distinguirá siempre contenido generado y exigirá revisión humana para documentos.
