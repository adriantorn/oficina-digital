# Conectar Supabase de desarrollo

Este procedimiento debe realizarlo el propietario de la cuenta. No compartas contraseñas de base de datos, tokens de acceso ni claves `service_role` por chat, commits o capturas.

## 1. Crear el proyecto

1. Crea un proyecto **de desarrollo**, separado de producción, en Supabase.
2. En Authentication > URL Configuration configura `http://localhost:3000` como Site URL y redirect URL durante el desarrollo.
3. Conserva el correo y contraseña de la base de datos en un gestor de contraseñas.

## 2. Configurar la aplicación

Copia `.env.example` como `.env.local` y completa únicamente:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

La clave publishable está diseñada para el cliente y queda limitada por RLS. No añadas `service_role` a esta aplicación.

## 3. Aplicar migraciones

Instala Supabase CLI según su documentación oficial. Autentícate directamente en tu terminal y enlaza el proyecto sin copiar el token al repositorio:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

Comprueba después en Database > Migrations que figura `202611160001_hito_1_foundation.sql`.

## 4. Ejecutar pruebas RLS locales

Esta comprobación requiere Docker en ejecución:

```bash
supabase start
npm run db:test
```

La suite `supabase/tests/rls_isolation_test.sql` crea dos identidades transitorias y verifica lectura, creación, modificación y eliminación. Los datos se revierten al terminar.

## 5. Validación funcional alojada

1. Crea dos usuarios de prueba sin datos personales reales.
2. Inicia sesión con cada uno y confirma que se crea su perfil.
3. Verifica `/app`, `/app/profile`, persistencia tras recarga y cierre de sesión.
4. Ejecuta las operaciones de aislamiento contra contactos y actividades. No marques esta fase como superada hasta registrar resultados reales en `docs/QA_HITO_1.md`.

## Limpieza

Elimina los usuarios de prueba cuando termine la validación y revisa que `.env.local` continúe ignorado por Git con `git status --ignored`.
