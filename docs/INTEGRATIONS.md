# Integraciones previstas

## Principio común

Los adaptadores implementarán contratos de `src/lib/types.ts`. Las credenciales se guardarán como secretos del servidor; nunca en `NEXT_PUBLIC_*`, localStorage o respuestas al navegador. Cada conexión tendrá consentimiento, scopes mínimos, estado, última sincronización y revocación.

## Google Drive

Un adaptador de servidor creará o vinculará una carpeta por contacto y almacenará únicamente identificadores externos y metadatos necesarios. Los permisos se comprobarán antes de cada operación. No se implementa hasta decidir OAuth, estructura y política de eliminación.

## Google Calendar

La agenda local es la fuente de verdad. La conexión voluntaria usa OAuth Authorization Code, `state` y PKCE, un calendario secundario **Oficina Digital** y los scopes `calendar.freebusy` y `calendar.app.created`. La disponibilidad personal se consulta en vivo como intervalos ocupado/libre sin conservar detalles. Los eventos usan un identificador determinista para evitar duplicados. Consulta `GOOGLE_CALENDAR_SETUP.md`.

## Inteligencia artificial

`AiProvider` permitirá comenzar con Gemini y sustituirlo sin afectar la UI. Las llamadas serán exclusivamente de servidor, con minimización/redacción de datos, límites de uso y registro sin contenido sensible. La interfaz distinguirá siempre contenido generado y exigirá revisión humana para documentos.
