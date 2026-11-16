# Colaborar

## Flujo de trabajo

1. Parte de `main` actualizado y crea una rama corta: `feat/contactos`, `fix/sesion`, `docs/privacidad` o `chore/dependencias`.
2. Mantén cada rama centrada en un único cambio. No mezcles migraciones, refactors y funcionalidades sin relación.
3. Abre un pull request en borrador pronto y completa su descripción con objetivo, alcance, pruebas y riesgos de privacidad.
4. Exige CI verde y al menos una revisión antes de fusionar. Las migraciones o cambios de seguridad deben tener una revisión específica.
5. Fusiona mediante **squash merge** y elimina la rama. `main` permanece protegida y desplegable; no se empuja directamente.

Los forks externos siguen el mismo flujo y activan `Allow edits from maintainers`. No se ejecutarán flujos con secretos sobre código no revisado procedente de forks.

## Reglas técnicas

Mantén TypeScript estricto, la interfaz en español y los límites entre UI, negocio y datos. Antes de proponer cambios ejecuta `npm run check` y, si afecta a la experiencia, `npm run test:e2e`. Incluye migraciones y pruebas RLS cuando cambie el modelo de datos. Usa commits claros en imperativo y nunca subas secretos o datos personales.

La licencia está pendiente de decisión del propietario; contribuir no implica una licencia de redistribución hasta que se incorpore una.
