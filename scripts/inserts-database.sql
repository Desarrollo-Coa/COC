SET FOREIGN_KEY_CHECKS = 0;
-- Limpiar tablas antes de insertar datos
TRUNCATE TABLE puestos;
TRUNCATE TABLE unidades_negocio;
TRUNCATE TABLE negocios;

INSERT INTO negocios (nombre_negocio) VALUES
('GLOBAL OFFICE'),
('VATIA S.A E.S.P'),
('GLOBENET'),
('QUIMPAC'),
('PRODUVARIO S.A'),
('FUNDACION LVR'),
('COMUNIDAD FRANCISCANA PROVINCIA DE LA SANTA FÉ'),
('LCI FUNDACION TECNOLOGIA'),
('CONSTRUCCIONES SIERRA PEREZ  S.A.S (CONSIPE)'),
('INGECOST'),
('NEGRATIN'),
('POLLOS BUCANEROS'),
('INGREDION'),
('PUERTO PINZA'),
('CELSIA COLOMBIA SA'),
('CARTON COLOMBIA SA'),
('C.C. PANORAMA'),
('PARQUE ARAUCO'),
('COOPIDROGAS'),
('ALKOSTO'),
('PEPSICO'),
('C.C. UNICO'),
('DOLLARCITY'),
('FORTOX'),
('COLTABACO');





-- GLOBAL OFFICE
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('BARRANQUILLA', 1);

-- VATIA S.A E.S.P
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('PARQUE SOLAR JUMI', 2);

-- GLOBENET
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('PTO COLOMBIA', 3);

-- QUIMPAC
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('MALAMBO', 4);

-- PRODUVARIO S.A
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('BARRANQUILLA', 5);

-- FUNDACION LVR
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('BARRANQUILLA', 6);

-- COMUNIDAD FRANCISCANA PROVINCIA DE LA SANTA FÉ
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('PTO COLOMBIA', 7);

-- LCI FUNDACION TECNOLOGIA
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('BARRANQUILLA', 8);

-- CONSTRUCCIONES SIERRA PEREZ  S.A.S (CONSIPE)
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('ARROYO DE PIEDRA', 9);
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('GALAPA', 9);

-- INGECOST
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('ARROYO PIEDRA', 10);

-- NEGRATIN
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('GUAYEPO', 11);
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('PENDIENTE', 11);

-- POLLOS BUCANEROS
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('MALAMBO', 12);

-- INGREDION
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('MALAMBO', 13);
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('SABANAGRANDE', 13);

-- PUERTO PINZA
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('MALAMBO', 14);

-- CELCIA COLOMBIA SA
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('JUAN DE ACOSTA', 15);
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('BARRANQUILLA', 15);
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('SABANAGRANDE', 15);
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('CESAR', 15);

-- CARTON COLOMBIA SA
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('BARRANQUILLA', 16);

-- C.C. PANORAMA
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('BARRANQUILLA', 17);

-- PARQUE ARAUCO
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('BARRANQUILLA', 18);

-- COOPIDROGAS
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('BARRANQUILLA', 19);
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('GALAPA', 19);

-- ALKOSTO
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('BARRANQUILLA', 20);

-- PEPSICO
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('BARRANQUILLA', 21);

-- C.C. UNICO
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('BARRANQUILLA', 22);

-- DOLLARCITY
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('GALAPA', 23);
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('SOLEDAD', 23);
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('BARRANQUILLA', 23);
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('SABANAGRANDE', 23);

-- FORTOX
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('BARRANQUILLA', 24);

-- COLTABACO
INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES ('BARRANQUILLA', 25);

-- PUESTOS (SERVICIOS POR UNIDAD DE NEGOCIO)

-- GLOBAL OFFICE, BARRANQUILLA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('PORTERIA PRINCIPAL', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'BARRANQUILLA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'GLOBAL OFFICE')), '2025-01-01', TRUE);

-- VATIA S.A E.S.P, PARQUE SOLAR JUMI
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('PARQUE SOLAR JUMI', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'PARQUE SOLAR JUMI' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'VATIA S.A E.S.P')), '2025-01-01', TRUE);

-- GLOBENET, PTO COLOMBIA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('PORTERIA PRINCIPAL', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'PTO COLOMBIA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'GLOBENET')), '2025-01-01', TRUE),
       ('INGRESO VEHICULOS DE CARGA', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'PTO COLOMBIA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'GLOBENET')), '2025-01-01', TRUE),
       ('INGRESO VEHÍCULAR Y PEATONAL', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'PTO COLOMBIA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'GLOBENET')), '2025-01-01', TRUE);

-- QUIMPAC, MALAMBO
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('PORTERIA PRINCIPAL (MALAMBO)', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'MALAMBO' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'QUIMPAC')), '2025-01-01', TRUE);

-- PRODUVARIO S.A, BARRANQUILLA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('PORTERÍA', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'BARRANQUILLA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'PRODUVARIO S.A')), '2025-01-01', TRUE);

-- FUNDACION LVR, BARRANQUILLA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('ENTRADA KIDS DE LA IGLESIA', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'BARRANQUILLA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'FUNDACION LVR')), '2025-01-01', TRUE),
       ('ENTRADA PRINCIPAL DE LA IGLESIA', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'BARRANQUILLA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'FUNDACION LVR')), '2025-01-01', TRUE);

-- COMUNIDAD FRANCISCANA PROVINCIA DE LA SANTA FÉ, PTO COLOMBIA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('GARITA ENTRADA', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'PTO COLOMBIA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'COMUNIDAD FRANCISCANA PROVINCIA DE LA SANTA FÉ')), '2025-01-01', TRUE),
       ('RECORREDOR', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'PTO COLOMBIA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'COMUNIDAD FRANCISCANA PROVINCIA DE LA SANTA FÉ')), '2025-01-01', TRUE);

-- LCI FUNDACION TECNOLOGIA, BARRANQUILLA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('PORTERÍA PRINCIPAL', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'BARRANQUILLA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'LCI FUNDACION TECNOLOGIA')), '2025-01-01', TRUE);

-- CONSTRUCCIONES SIERRA PEREZ  S.A.S (CONSIPE), ARROYO DE PIEDRA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('INGRESO PRINCIPAL', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'ARROYO DE PIEDRA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'CONSTRUCCIONES SIERRA PEREZ  S.A.S (CONSIPE)')), '2025-01-01', TRUE);

-- CONSTRUCCIONES SIERRA PEREZ  S.A.S (CONSIPE), GALAPA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('INGRESO PRINCIPAL', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'GALAPA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'CONSTRUCCIONES SIERRA PEREZ  S.A.S (CONSIPE)')), '2025-01-01', TRUE),
       ('APOYO NOCT OFICINA PRINCIPAL', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'GALAPA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'CONSTRUCCIONES SIERRA PEREZ  S.A.S (CONSIPE)')), '2025-01-01', TRUE);

-- INGECOST, ARROYO PIEDRA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('PORT PLANTA', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'ARROYO PIEDRA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'INGECOST')), '2025-01-01', TRUE),
       ('REFUERZO TEMPORADA CANTERA NISPERO', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'ARROYO PIEDRA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'INGECOST')), '2025-01-01', TRUE),
       ('PORTERIA PLANTA NISPERO CANTERA', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'ARROYO PIEDRA' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'INGECOST')), '2025-01-01', TRUE);

-- NEGRATIN, GUAYEPO
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('SUBESTACION ELEVADORA', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'GUAYEPO' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'NEGRATIN')), '2025-01-01', TRUE),
       ('GUARDA ALMACEN GUAYEPO', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'GUAYEPO' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'NEGRATIN')), '2025-01-01', TRUE),
       ('SUPERVISOR VEHÍCULAR GUAYEPO', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'GUAYEPO' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'NEGRATIN')), '2025-01-01', TRUE),
       ('GUARDA ENTRADA GARITA 1 GUAYEPO', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'GUAYEPO' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'NEGRATIN')), '2025-01-01', TRUE),
       ('RONDERO 2 GUAYEPO', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'GUAYEPO' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'NEGRATIN')), '2025-01-01', TRUE),
       ('RONDERO 1 GUAYEPO', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'GUAYEPO' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'NEGRATIN')), '2025-01-01', TRUE);

-- NEGRATIN, PENDIENTE
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('SUBESTACION ELEVADORA', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'PENDIENTE' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'NEGRATIN')), '2025-01-01', TRUE),
       ('GUARDA ALMACEN GUAYEPO', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'PENDIENTE' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'NEGRATIN')), '2025-01-01', TRUE),
       ('SUPERVISOR VEHÍCULAR GUAYEPO', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'PENDIENTE' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'NEGRATIN')), '2025-01-01', TRUE),
       ('GUARDA ENTRADA GARITA 1 GUAYEPO', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'PENDIENTE' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'NEGRATIN')), '2025-01-01', TRUE),
       ('RONDERO 2 GUAYEPO', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'PENDIENTE' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'NEGRATIN')), '2025-01-01', TRUE),
       ('RONDERO 1 GUAYEPO', (SELECT id_unidad FROM unidades_negocio WHERE nombre_unidad = 'PENDIENTE' AND id_negocio = (SELECT id_negocio FROM negocios WHERE nombre_negocio = 'NEGRATIN')), '2025-01-01', TRUE);

-- POLLOS BUCANEROS, MALAMBO
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('BODEGA CARGILL REFREIGERACION  PUERTO PINZA (NOCT)', 13, CURRENT_DATE, TRUE),
       ('BODEGA CARGILL PORTERIA PRINCIPAL', 13, CURRENT_DATE, TRUE);

-- INGREDION, MALAMBO
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('ARÉA LAMINAS FILTRANTES', 14, CURRENT_DATE, TRUE),
       ('RECORREDOR PLANTA INTERNO', 14, CURRENT_DATE, TRUE),
       ('PORTERÍA', 14, CURRENT_DATE, TRUE);

-- INGREDION, SABANAGRANDE
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('PORTERIA', 15, CURRENT_DATE, TRUE),
       ('RECORREDOR PLANTA INTERNO', 15, CURRENT_DATE, TRUE);

-- PUERTO PINZA, MALAMBO
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('PORTERIA PRINCIPAL', 16, CURRENT_DATE, TRUE);

-- CELCIA COLOMBIA SA, JUAN DE ACOSTA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('PORTERIA PRINCIPAL VEHÍCULAR PEATONAL', 17, CURRENT_DATE, TRUE),
       ('MOVIL 2', 17, CURRENT_DATE, TRUE),
       ('RECORREDOR MOTORIZADO', 17, CURRENT_DATE, TRUE);

-- CELCIA COLOMBIA SA, BARRANQUILLA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('SUBESTACION NORTE', 18, CURRENT_DATE, TRUE),
       ('SUBESTACION CARACOLÍ', 18, CURRENT_DATE, TRUE);

-- CELCIA COLOMBIA SA, SABANAGRANDE
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('OCASIONAL SABANAGRANDE - POLONUEVO', 19, CURRENT_DATE, TRUE);

-- CELCIA COLOMBIA SA, CESAR
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('RECORREDOR CUESTECITA', 20, CURRENT_DATE, TRUE);

-- CARTON COLOMBIA SA, BARRANQUILLA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('RECEPCIONISTA CORRUGADO', 21, CURRENT_DATE, TRUE),
       ('GUARDA LIDER CORRUGADO', 21, CURRENT_DATE, TRUE),
       ('GUADA MOVIL CORRUGADO', 21, CURRENT_DATE, TRUE),
       ('GUARDA RECEPCION MOLINO 5', 21, CURRENT_DATE, TRUE),
       ('GUARDA CAMPO BRIGADA MOLINO 5', 21, CURRENT_DATE, TRUE),
       ('SUPERVISOR MOLINO 5', 21, CURRENT_DATE, TRUE),
       ('GUARDA GARITA CEMENTO MOLINO 5', 21, CURRENT_DATE, TRUE),
       ('GUARDA PLANTA PULPA MOLINO 5', 21, CURRENT_DATE, TRUE),
       ('GUARDA PUERTA CONTRATISTA MOLINO 5', 21, CURRENT_DATE, TRUE),
       ('GUARDA MONITOREO', 21, CURRENT_DATE, TRUE);

-- C.C. PANORAMA, BARRANQUILLA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('PUERTA INGRESO PEATONAL CRA 8', 22, CURRENT_DATE, TRUE),
       ('PORTERIA 1', 22, CURRENT_DATE, TRUE),
       ('PORTERIA 2', 22, CURRENT_DATE, TRUE),
       ('RECORREDOR', 22, CURRENT_DATE, TRUE);

-- PARQUE ARAUCO, BARRANQUILLA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('LOTE ARAUCO', 23, CURRENT_DATE, TRUE);

-- COOPIDROGAS, BARRANQUILLA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('PORTERIA METROPARQUE', 24, CURRENT_DATE, TRUE),
       ('APOYO 1 METROPARQUE', 24, CURRENT_DATE, TRUE),
       ('APOYO 2 METROPARQUE', 24, CURRENT_DATE, TRUE);

-- COOPIDROGAS, GALAPA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('APOYO NOCTURNO GREEN PARK', 25, CURRENT_DATE, TRUE),
       ('OBRA  GREEN PARK', 25, CURRENT_DATE, TRUE),
       ('LOTE PARQUE INDUSTRIAL  GREEN PARK', 25, CURRENT_DATE, TRUE),
       ('MOVIL 2 GREEN PARK', 25, CURRENT_DATE, TRUE);

-- ALKOSTO, BARRANQUILLA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('OCASIONAL CORBETA', 26, CURRENT_DATE, TRUE),
       ('RECORREDOR PARQUEADERO', 26, CURRENT_DATE, TRUE),
       ('OCASIONAL ALKOSTO', 26, CURRENT_DATE, TRUE),
       ('OCASIONAL RECEPCION', 26, CURRENT_DATE, TRUE);

-- PEPSICO, BARRANQUILLA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('PORTERÍA PRINCIPAL', 27, CURRENT_DATE, TRUE),
       ('RECORREDOR MUELLE CARGUE (NOCT)', 27, CURRENT_DATE, TRUE),
       ('RECORREDOR 2 (NOCT)', 27, CURRENT_DATE, TRUE),
       ('ESCOLTA MOTORIZADO 1 OCASIONAL', 27, CURRENT_DATE, TRUE),
       ('ESCOLTA MOTORIZADO 2 OCASIONAL', 27, CURRENT_DATE, TRUE);

-- C.C. UNICO, BARRANQUILLA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('MOTORIZADO', 28, CURRENT_DATE, TRUE),
       ('ZONA BANCARIA', 28, CURRENT_DATE, TRUE),
       ('PORTERIA VEHICULAR 1', 28, CURRENT_DATE, TRUE),
       ('PORTERIA VEHICULAR 2', 28, CURRENT_DATE, TRUE);

-- DOLLARCITY, GALAPA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('BODEGA DOLLARCITY', 29, CURRENT_DATE, TRUE),
       ('MOVIL BODEGA', 29, CURRENT_DATE, TRUE),
       ('GALAPA', 29, CURRENT_DATE, TRUE);

-- DOLLARCITY, SOLEDAD
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('LOS CUSULES', 30, CURRENT_DATE, TRUE),
       ('SAN ANTONIO', 30, CURRENT_DATE, TRUE),
       ('GRAN PLAZA DEL SOL', 30, CURRENT_DATE, TRUE),
       ('NUESTRO ATLANTICO', 30, CURRENT_DATE, TRUE);

-- DOLLARCITY, BARRANQUILLA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('CONCEPCION', 31, CURRENT_DATE, TRUE),
       ('ALEGRA', 31, CURRENT_DATE, TRUE),
       ('CIUDAD JARDIN', 31, CURRENT_DATE, TRUE),
       ('PLAZA DORADA', 31, CURRENT_DATE, TRUE),
       ('SAN BLAS', 31, CURRENT_DATE, TRUE),
       ('PUERTA DE ORO', 31, CURRENT_DATE, TRUE),
       ('MACARENA', 31, CURRENT_DATE, TRUE),
       ('METROPOLITANO', 31, CURRENT_DATE, TRUE),
       ('LAS NIEVES', 31, CURRENT_DATE, TRUE),
       ('CORDIALIDAD', 31, CURRENT_DATE, TRUE),
       ('VILLA CAMPESTRE', 31, CURRENT_DATE, TRUE),
       ('CARIBE VERDE', 31, CURRENT_DATE, TRUE),
       ('20 DE JULIO', 31, CURRENT_DATE, TRUE),
       ('METROCENTRO', 31, CURRENT_DATE, TRUE),
       ('ALTO PRADO', 31, CURRENT_DATE, TRUE),
       ('CALLE 72', 31, CURRENT_DATE, TRUE),
       ('SAN FRANCISCO', 31, CURRENT_DATE, TRUE);

-- DOLLARCITY, SABANAGRANDE
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('SABANAGRANDE', 32, CURRENT_DATE, TRUE);

-- FORTOX, BARRANQUILLA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('JEFE DE TURNO', 33, CURRENT_DATE, TRUE),
       ('SUPERVISOR ZONA NORTE', 33, CURRENT_DATE, TRUE),
       ('SUPERVISOR ZONA SUR', 33, CURRENT_DATE, TRUE);

-- COLTABACO, BARRANQUILLA
INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial, activo)
VALUES ('ESCOLTA MOTORIZADO', 34, CURRENT_DATE, TRUE);

SET FOREIGN_KEY_CHECKS = 1;
