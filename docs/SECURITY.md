# Seguridad y privacidad

## Controles actuales

- Sesión Supabase en cookies mediante el cliente SSR; la clave publicable no es un secreto.
- Validación de usuario en proxy y de nuevo en páginas protegidas.
- RLS activa, permisos anónimos revocados y políticas separadas para leer, insertar, actualizar y borrar.
- `owner_id` indexado y comprobado también al crear actividades.
- Función de alta de perfil `security definer` con `search_path` vacío y sin permiso de ejecución público.
- Sin `service_role`, tokens o datos personales en el repositorio.
- Citas y participantes protegidos por RLS y validación de que el contacto pertenece al mismo propietario.
- Tokens OAuth cifrados con AES-256-GCM en una tabla sin permisos para clientes. `service_role` queda limitado al adaptador de integración del servidor.

## Protección de datos

Antes de producción deben definirse responsable y encargado del tratamiento, base jurídica, plazos de conservación, registro de consentimientos y proveedores/subencargados. El Hito 2 debe incluir exportación legible y eliminación de cuenta. La eliminación debe contemplar copias de seguridad y un periodo documentado, no prometer borrado instantáneo de backups.

Los logs no deben contener cuerpos de notas, teléfonos, correos ni tokens. Cualquier integración futura aplicará mínimo privilegio, revocación y auditoría. Compartir una oportunidad exigirá una entidad de autorización específica; nunca se añadirá un rol que permita leer toda la cartera de otro agente.

## Pendiente antes de producción

- Configurar políticas de contraseñas/MFA y URLs permitidas en Supabase.
- Revisar CSP, cabeceras de despliegue, correo transaccional y límites de abuso.
- Ejecutar `supabase test db` contra el entorno local y revisar las políticas tras cada migración.
- Realizar análisis de impacto de privacidad si el alcance de datos lo requiere.
