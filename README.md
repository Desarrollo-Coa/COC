# COC (Central de Operaciones Costa)

Sistema de gestión y control operativo para la Central de Operaciones Costa.

## Instalación

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/Desarrollo-Coa/coc-central-operaciones-costa.git
   cd coc-central-operaciones-costa
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura la base de datos:**
   - Crea una base de datos MySQL/MariaDB.
   - Ejecuta el script `scripts/init-database.sql` para crear las tablas y datos iniciales.
   - Configura las variables de entorno para la conexión a la base de datos (por ejemplo, en un archivo `.env.local`):

     ```
     DB_HOST=localhost
     DB_USER=tu_usuario
     DB_PASSWORD=tu_contraseña
     DB_NAME=coc_costa
     NEXT_PUBLIC_DASHBOARD_TITLE="COC - CENTRAL DE OPERACIONES COSTA"
     ```

4. **Inicia la aplicación:**
   ```bash
   npm run dev
   ```

5. **Accede a la plataforma:**
   - Abre tu navegador en [http://localhost:3000](http://localhost:3000)

## Uso

- Ingresa con un usuario administrador (por defecto: `admin@central.com` / contraseña definida en el script SQL).
- Explora los módulos de gestión de colaboradores, turnos, cumplidos, reportes y configuración.
- Administra negocios, unidades de negocio y puestos desde el panel de configuración.
- Revisa y aprueba solicitudes de cuenta desde el módulo correspondiente.

## Tecnologías utilizadas

- **Frontend & Backend:** Next.js, React, TypeScript
- **Estilos:** Tailwind CSS
- **Base de datos:** MySQL/MariaDB
- **ORM/DB Utils:** (Personalizado o a definir según implementación)
- **Autenticación:** JWT, bcrypt

## Créditos

Desarrollado por CARLOS MUÑOZ Y JOSE FLOREZ.

---