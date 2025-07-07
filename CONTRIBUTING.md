# Guía de Contribución y Normas del Proyecto

¡Gracias por tu interés en contribuir a este proyecto! Para mantener la calidad y coherencia del código, por favor sigue las siguientes normas y recomendaciones.

## 1. Estructura del Proyecto

- **`src/`**: Código fuente principal (componentes, hooks, librerías, páginas, API, etc.).
- **`public/`**: Archivos estáticos (imágenes, logos, etc.).
- **`database/`**: Scripts y archivos relacionados con la base de datos.
- **`lib/`**: Librerías y utilidades compartidas.

## 2. Estilo y Formato de Código

- Usa **TypeScript** para todos los archivos `.ts` y `.tsx`.
- Sigue las reglas de ESLint y Prettier (si están configuradas).
- Nombra los archivos y carpetas en **minúsculas** y usa guiones o camelCase según convención del proyecto.
- Los componentes React deben estar en PascalCase (`MiComponente.tsx`).
- Utiliza funciones flecha para componentes y hooks.

## 3. Convenciones de Nombres

- Variables y funciones: `camelCase`.
- Clases y componentes: `PascalCase`.
- Archivos y carpetas: `kebab-case` o `camelCase` (mantener consistencia).

## 4. Documentación

- **Comenta** el código cuando la lógica no sea evidente.
- Usa comentarios JSDoc para funciones y métodos complejos:
  ```ts
  /**
   * Explica qué hace la función.
   * @param param Descripción del parámetro
   * @returns Descripción del valor de retorno
   */
  ```
- Documenta los endpoints de la API con ejemplos de request/response si es posible.
- Mantén actualizado este archivo y el `README.md`.

## 5. Commits y Pull Requests

- Escribe mensajes de commit claros y descriptivos, preferiblemente en español.
- Usa el formato:
  - `feat: descripción` para nuevas funcionalidades
  - `fix: descripción` para correcciones
  - `docs: descripción` para cambios en la documentación
  - `refactor: descripción` para mejoras internas
- Relaciona los cambios con issues o tareas si aplica.

## 6. Buenas Prácticas

- Antes de subir cambios, asegúrate de que el proyecto compila y pasa los tests (si existen).
- No subas archivos innecesarios o credenciales.
- Usa variables de entorno para información sensible.
- Mantén el código DRY (Don't Repeat Yourself).

## 7. Revisión de Código

- Todo cambio debe ser revisado por al menos una persona antes de ser fusionado a la rama principal.
- Responde a los comentarios de revisión y realiza los cambios necesarios.

## 8. Recursos

- [Documentación oficial de Next.js](https://nextjs.org/docs)
- [Guía de TypeScript](https://www.typescriptlang.org/docs/)
- [Guía de ESLint](https://eslint.org/docs/latest/)

---

Si tienes dudas, contacta con el responsable del repositorio o abre un issue. 