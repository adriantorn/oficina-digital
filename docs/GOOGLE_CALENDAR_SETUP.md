# Configuración de Google Calendar

La integración es opcional. Sin estas variables la agenda local funciona y la interfaz muestra la conexión como pendiente.

1. En Google Cloud crea o selecciona un proyecto, habilita **Google Calendar API** y configura la pantalla de consentimiento OAuth.
2. Crea un cliente OAuth de tipo **Aplicación web**.
3. Añade `http://localhost:3000/api/integrations/google/callback` como URI de redirección autorizada.
4. Si la aplicación está en modo *Testing*, añade las cuentas de prueba. Google puede caducar los refresh tokens de aplicaciones externas en pruebas a los 7 días.
5. Copia en `.env.local`, nunca en Git: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `SUPABASE_SERVICE_ROLE_KEY` y `GOOGLE_TOKEN_ENCRYPTION_KEY`.
6. Genera la clave de cifrado con 32 bytes aleatorios y codifícala en base64. No reutilices una contraseña.
7. Reinicia `npm run dev`, abre `/app/integrations/google` y concede solo los permisos solicitados.

## Permisos y comportamiento

- `calendar.freebusy`: consulta en vivo únicamente intervalos ocupado/libre del calendario principal. No se guardan títulos, asistentes, ubicaciones ni descripciones personales.
- `calendar.app.created`: crea el calendario secundario **Oficina Digital** y gestiona únicamente eventos creados por la aplicación.
- El `state` OAuth y el verificador PKCE se guardan temporalmente en cookies HttpOnly, SameSite=Lax.
- Los tokens se cifran con AES-256-GCM antes de almacenarse. La tabla de conexiones no concede acceso a `anon` ni `authenticated`.
- Desconectar elimina los tokens locales; no borra el calendario ni eventos remotos.

## Verificación pendiente del propietario

Tras configurar Google Cloud, verificar manualmente: conexión y retorno, creación del calendario secundario, bloques FreeBusy sin detalles, creación idempotente de una cita, renovación del token y desconexión. No se considera verificado hasta ejecutar esta matriz con una cuenta ficticia.
