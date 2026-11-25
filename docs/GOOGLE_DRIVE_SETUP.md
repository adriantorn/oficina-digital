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

## Prueba del BUG #002 en desarrollo

Usa un contacto ficticio y una única carpeta de expediente. Con la conexión actual de Drive, sube el archivo A desde la ficha. Añade el archivo B desde Drive con la cuenta del agente y pide a un colaborador que ya tenga acceso a la carpeta que añada el archivo C desde su propia cuenta. Usa nombres distintos y archivos sin datos reales.

El expediente **QA BUG 002 Expediente ficticio** ya contiene `A-oficina-digital.txt`. Puedes continuar con `B-agente.txt` y `C-colaborador.txt` en esa misma carpeta.

Comprueba que los tres archivos están en la carpeta de Drive. En Oficina Digital, pulsa **Actualizar documentos** y registra por separado qué devuelve `files.list`, qué aparece en la ficha y qué se abre desde ella. Un archivo puede ser visible para el agente en Drive y quedar fuera de la autorización de la aplicación.

### Google Cloud para el ensayo posterior

Después de registrar la línea base y cuando la aplicación disponga del flujo experimental, usa un proyecto OAuth de **desarrollo**. En **Google Auth Platform → Audience**, confirma que las cuentas participantes están autorizadas en modo de prueba si el proyecto es externo. En **Data Access**, declara `https://www.googleapis.com/auth/drive.metadata.readonly` junto a `drive.file`. Comprueba que el cliente web de desarrollo conserva el URI exacto del callback local y vuelve a autorizar Drive desde Oficina Digital. Si Google no concede ambos permisos, la prueba con acceso ampliado sigue pendiente. No es necesario volver a autorizar Calendar. [Configuración OAuth para pruebas](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview)

El permiso experimental cubre metadatos de los archivos accesibles para la cuenta de Google. Es más amplio que la consulta de Oficina Digital, que se limita a los hijos directos del expediente vinculado. Google lo clasifica como restringido y, antes de una publicación comercial, deben evaluarse la verificación OAuth y los requisitos de seguridad aplicables. [Clasificación de permisos de Drive](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)

Para separar el ensayo de producción, el diseño propuesto combina un cliente OAuth de desarrollo, una activación explícita en ejecución local y almacenamiento de conexiones separado de producción. Usa la misma aplicación OAuth de desarrollo que creó el expediente ficticio en ambas fases: Drive mantiene las propiedades privadas de la carpeta por aplicación. Se debe verificar el alcance concedido en el intercambio OAuth y al renovar el token. La aplicación debe rechazar un token con alcance experimental cuando la activación esté deshabilitada, incluso si esa conexión ya existía.
