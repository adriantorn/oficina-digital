# Configuración de Google Drive

Drive reutiliza el cliente OAuth, el callback, PKCE y la clave de cifrado ya configurados para Calendar. Sus tokens y estado son independientes: conectar o desconectar un servicio no modifica el otro.

## Acción del propietario en Google Cloud

1. Abre el mismo proyecto de Google Cloud usado por Oficina Digital.
2. En **APIs y servicios → Biblioteca**, habilita **Google Drive API**.
3. En **Pantalla de consentimiento OAuth → Acceso a datos**, añade `https://www.googleapis.com/auth/drive.file` si Google exige declararlo. No añadas `drive`, `drive.readonly` ni permisos de Gmail.
4. Mantén `http://localhost:3000/api/integrations/google/callback` como URI de redirección del cliente web existente. No hace falta crear otro secreto.
5. Si la aplicación sigue en modo de pruebas, confirma que la cuenta que usarás figura como usuario de prueba.
6. No compartas el ID de cliente, secreto, tokens ni la clave de cifrado. Deben permanecer en `.env.local`.

## Primera comprobación real

1. Aplica la migración `202611240001_hito_4_google_drive.sql` al proyecto Supabase de desarrollo.
2. Reinicia la aplicación y entra en **Mi perfil → Integraciones de Google**.
3. Pulsa **Conectar Google Drive** y acepta únicamente el acceso a archivos creados por Oficina Digital.
4. Abre un contacto ficticio y pulsa **Activar expediente**.
5. Comprueba en Drive la ruta `Oficina Digital / Clientes / Nombre del contacto`.
6. Adjunta un PDF ficticio de menos de 15 MB y ábrelo desde la ficha.
7. Repite **Activar expediente** o la conexión: no debe aparecer una segunda carpeta.

## Comportamiento de seguridad

- `drive.file` limita la aplicación a los archivos que crea o que el usuario abre expresamente con ella.
- Los tokens se cifran con AES-256-GCM y nunca llegan al navegador.
- Desconectar Drive borra los tokens locales, pero nunca carpetas o documentos.
- Borrar un contacto elimina referencias locales por cascada, no contenido remoto.
- Gmail no está habilitado y no se solicita ningún permiso de correo.
