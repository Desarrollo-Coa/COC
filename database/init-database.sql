-- Eliminar tablas si existen (en orden inverso de dependencias)
DROP TABLE IF EXISTS destinatarios_envio;
DROP TABLE IF EXISTS historial_envios;
DROP TABLE IF EXISTS imagenes_novedades;
DROP TABLE IF EXISTS novedades;
DROP TABLE IF EXISTS tipos_evento;
DROP TABLE IF EXISTS tipos_reporte;
DROP TABLE IF EXISTS configuracion_reportes_comunicacion;
DROP TABLE IF EXISTS reporte_comunicacion;
DROP TABLE IF EXISTS notas_cumplidos;
DROP TABLE IF EXISTS cumplidos;
DROP TABLE IF EXISTS colaboradores;
DROP TABLE IF EXISTS tipos_turno;
DROP TABLE IF EXISTS puestos;
DROP TABLE IF EXISTS unidades_negocio;
DROP TABLE IF EXISTS negocios;
DROP TABLE IF EXISTS usuarios_modulos;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS solicitudes_cuenta;
DROP TABLE IF EXISTS modulos;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- Comandos de base de datos (descomentar si se requiere crear/eliminar la base de datos)
-- DROP DATABASE IF EXISTS central_ops_bq;
-- CREATE DATABASE IF NOT EXISTS central_ops_bq;
-- USE central_ops_bq;

-- Tabla de roles
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (id, nombre) VALUES
(1, 'Administrador');

-- Tabla de usuarios
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  apellido VARCHAR(50) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT DEFAULT NULL,
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

INSERT INTO users (id, nombre, apellido, username, email, password, role_id, activo, fecha_creacion) VALUES
(3, 'CENTRAL', 'BARRANQUILLA', 'admin', 'admin@central.com', '$2b$10$vKbcoASLfDE.DrnPQ6s/leK0GkvI0dj0dz.2r2MbcFx88aYEyjrA.', 1, 1, '2025-07-02 19:51:27');

-- Tabla de módulos
CREATE TABLE modulos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  ruta VARCHAR(255) NOT NULL,
  icono VARCHAR(50),
  activo TINYINT(1) DEFAULT 1,
  acepta_subrutas TINYINT(1) DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de solicitudes de cuenta
CREATE TABLE solicitudes_cuenta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  apellido VARCHAR(50) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  raw_password VARCHAR(255) NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  comentario TEXT,
  estado ENUM('pendiente','aprobado','rechazado') DEFAULT 'pendiente',
  fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sesiones de usuario
CREATE TABLE user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
 

-- Tabla de relación usuarios-módulos
CREATE TABLE usuarios_modulos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  modulo_id INT NOT NULL,
  permitido TINYINT(1) DEFAULT 1,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_modulo (user_id, modulo_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (modulo_id) REFERENCES modulos(id) ON DELETE CASCADE
);

-- Tabla de Negocios
CREATE TABLE negocios (
    id_negocio INT AUTO_INCREMENT PRIMARY KEY,
    nombre_negocio VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Unidades de Negocio
CREATE TABLE unidades_negocio (
    id_unidad INT AUTO_INCREMENT PRIMARY KEY,
    nombre_unidad VARCHAR(255) NOT NULL,
    id_negocio INT NOT NULL,
    FOREIGN KEY (id_negocio) REFERENCES negocios(id_negocio)
);

-- Tabla de Puestos
CREATE TABLE puestos (
    id_puesto INT AUTO_INCREMENT PRIMARY KEY,
    nombre_puesto VARCHAR(255) NOT NULL,
    id_unidad INT NOT NULL,
    fecha_inicial DATE NOT NULL DEFAULT (CURRENT_DATE),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_unidad) REFERENCES unidades_negocio(id_unidad)
);

-- Tabla de Tipos de Turno
CREATE TABLE tipos_turno (
    id_tipo_turno INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tipo_turno VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO tipos_turno (id_tipo_turno, nombre_tipo_turno) VALUES
(1, 'Diurno')
ON DUPLICATE KEY UPDATE nombre_tipo_turno = 'Diurno';

INSERT INTO tipos_turno (id_tipo_turno, nombre_tipo_turno) VALUES
(2, 'Nocturno')
ON DUPLICATE KEY UPDATE nombre_tipo_turno = 'Nocturno';

-- Tabla de Colaboradores
CREATE TABLE colaboradores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    cedula VARCHAR(50) NOT NULL UNIQUE,
    placa VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    foto_url VARCHAR(255) NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Cumplidos
CREATE TABLE cumplidos (
    id_cumplido INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    id_puesto INT NOT NULL,
    id_tipo_turno INT NOT NULL,
    id_colaborador INT UNSIGNED,
    FOREIGN KEY (id_puesto) REFERENCES puestos(id_puesto),
    FOREIGN KEY (id_tipo_turno) REFERENCES tipos_turno(id_tipo_turno),
    FOREIGN KEY (id_colaborador) REFERENCES colaboradores(id),
    INDEX idx_fecha (fecha)
);

-- Tabla de Notas de Cumplidos
CREATE TABLE notas_cumplidos (
    id_nota INT AUTO_INCREMENT PRIMARY KEY,
    id_cumplido INT UNSIGNED NOT NULL,
    nota TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cumplido) REFERENCES cumplidos(id_cumplido) ON DELETE CASCADE
);

-- Tabla de Reportes de Comunicación
CREATE TABLE reporte_comunicacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cumplido INT UNSIGNED NOT NULL,
    calificaciones JSON NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cumplido) REFERENCES cumplidos(id_cumplido) ON DELETE CASCADE
);

-- Tabla de configuración de reportes de comunicación
CREATE TABLE configuracion_reportes_comunicacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_inicial DATE NOT NULL,
    id_negocio INT NOT NULL,
    cantidad_diurno INT NOT NULL DEFAULT 0,
    cantidad_nocturno INT NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_negocio) REFERENCES negocios(id_negocio),
    UNIQUE KEY unique_fecha_negocio (fecha_inicial, id_negocio)
);



-- Tipos de Reporte
CREATE TABLE tipos_reporte (
    id_tipo_reporte INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tipo_reporte VARCHAR(100) NOT NULL UNIQUE
);

-- Inserts de tipos de reporte
INSERT INTO tipos_reporte (nombre_tipo_reporte) VALUES 
('SEGURIDAD FISICA'),
('ASEGURAMIENTO DE LA OPERACION'),
('SEGURIDAD ELECTRONICA'),
('INCUMPLIMIENTO A LOS PROCEDIMIENTOS PR');

-- Tipos de Evento
CREATE TABLE tipos_evento (
    id_tipo_evento INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tipo_evento VARCHAR(100) NOT NULL,
    id_tipo_reporte INT NOT NULL,
    FOREIGN KEY (id_tipo_reporte) REFERENCES tipos_reporte(id_tipo_reporte),
    UNIQUE KEY unique_tipo_evento (nombre_tipo_evento, id_tipo_reporte)
);

-- Inserts de tipos de evento
INSERT INTO tipos_evento (nombre_tipo_evento, id_tipo_reporte) VALUES 
('PERTURBACION DE PREDIOS', 1),
('INFRAESTRUCTURA', 1),
('ELEMENTOS SIN ASEGURAR', 1),
('FALLAS ELÉCTRICAS', 2),
('LOGISTICA', 2),
('PODA', 2),
('EXTERNOS', 3),
('INTERNOS', 3);


-- Tabla de novedades
CREATE TABLE novedades (
    id_novedad INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_puesto INT NOT NULL,
    consecutivo INT NOT NULL,
    fecha_hora_novedad DATETIME NOT NULL,
    id_tipo_evento INT NOT NULL,
    descripcion TEXT,
    gestion TEXT,
    evento_critico BOOLEAN DEFAULT FALSE,
    fecha_hora_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (consecutivo),
    FOREIGN KEY (id_usuario) REFERENCES users(id),
    FOREIGN KEY (id_puesto) REFERENCES puestos(id_puesto),
    FOREIGN KEY (id_tipo_evento) REFERENCES tipos_evento(id_tipo_evento)
);
-- Tabla de imágenes de novedades
CREATE TABLE imagenes_novedades (
    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
    id_novedad INT NOT NULL,
    url_imagen VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_novedad) REFERENCES novedades(id_novedad) ON DELETE CASCADE
);
-- Tabla para Historial de Envíos
CREATE TABLE historial_envios (
    id_envio INT AUTO_INCREMENT PRIMARY KEY,
    id_novedad INT NOT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    operador_id INT NOT NULL,
    destinatarios JSON NOT NULL,
    estado ENUM('enviado', 'error') NOT NULL,
    mensaje_error TEXT,
    FOREIGN KEY (id_novedad) REFERENCES novedades(id_novedad),
    FOREIGN KEY (operador_id) REFERENCES users(id)
);

-- Tabla para Destinatarios de Envío (abierta para cualquier cliente)
CREATE TABLE destinatarios_envio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_historial INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    estado ENUM('enviado', 'error') NOT NULL,
    error TEXT,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_historial) REFERENCES historial_envios(id_envio) ON DELETE CASCADE
);
