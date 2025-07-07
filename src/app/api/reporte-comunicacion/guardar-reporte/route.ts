import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { id_cumplido, calificaciones } = await request.json();
    console.log('--- DEPURACIÓN REPORTE DE COMUNICACIÓN ---');
    console.log('Recibido:', { id_cumplido, calificaciones });
    // Mostrar cómo se procesan las calificaciones
    Object.entries(calificaciones).forEach(([rKey, horas]) => {
      console.log(`Reporte ${rKey}:`);
      if (horas && typeof horas === 'object' && !Array.isArray(horas)) {
        Object.entries(horas).forEach(([hora, valor]) => {
          if (
            typeof valor === 'object' &&
            valor !== null &&
            'valor' in valor &&
            'nota' in valor
          ) {
            console.log(`  Hora ${hora}: valor=${(valor as any).valor}, nota=${(valor as any).nota}`);
          } else {
            console.log(`  Hora ${hora}: valor=${valor}`);
          }
        });
      }
    });
    if (!id_cumplido || !calificaciones) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // 1. Obtener info de cumplido (fecha, id_tipo_turno, id_negocio, colaborador)
    const [cumplidoRows] = await pool.query(
      `SELECT c.fecha, c.id_tipo_turno, u.id_negocio, c.id_colaborador, col.nombre AS colaborador_nombre, col.apellido AS colaborador_apellido
       FROM cumplidos c
       JOIN puestos p ON c.id_puesto = p.id_puesto
       JOIN unidades_negocio u ON p.id_unidad = u.id_unidad
       LEFT JOIN colaboradores col ON c.id_colaborador = col.id
       WHERE c.id_cumplido = ?`,
      [id_cumplido]
    ) as any[];
    const cumplido = cumplidoRows[0];
    if (!cumplido) {
      return NextResponse.json({ error: 'Cumplido no encontrado' }, { status: 404 });
    }
    console.log('Cumplido:', cumplido);

    // 2. Obtener configuración para la fecha y zona
    const [configRows] = await pool.query(
      'SELECT cantidad_diurno, cantidad_nocturno FROM configuracion_reportes_comunicacion WHERE id_negocio = ? AND fecha_inicial <= ? ORDER BY fecha_inicial DESC LIMIT 1',
      [cumplido.id_negocio, cumplido.fecha]
    ) as any[];
    const config = configRows[0];
    if (!config) {
      return NextResponse.json({ error: 'No hay configuración para la fecha y zona' }, { status: 400 });
    }
    console.log('Configuración esperada:', config);

    // 3. Validar cantidad de reportes según turno
    const cantidadEsperada = cumplido.id_tipo_turno === 1 ? config.cantidad_diurno : config.cantidad_nocturno;
    console.log('Cantidad esperada para el turno:', cantidadEsperada);
    console.log('Cantidad recibida:', Object.keys(calificaciones).length);
    if (Object.keys(calificaciones).length > cantidadEsperada) {
      return NextResponse.json({ error: `No puede registrar más de ${cantidadEsperada} reportes para este turno` }, { status: 400 });
    }

    // 4. Insertar o actualizar
    const [existeRows] = await pool.query(
      'SELECT id FROM reporte_comunicacion WHERE id_cumplido = ?',
      [id_cumplido]
    ) as any[];
    const existe = existeRows[0];

    console.log('Guardando en la base de datos:', {
      id_cumplido,
      calificaciones,
      modo: existe ? 'UPDATE' : 'INSERT',
    });

    if (existe) {
      await pool.query(
        'UPDATE reporte_comunicacion SET calificaciones = ?, fecha_actualizacion = NOW() WHERE id_cumplido = ?',
        [JSON.stringify(calificaciones), id_cumplido]
      );
    } else {
      await pool.query(
        'INSERT INTO reporte_comunicacion (id_cumplido, calificaciones) VALUES (?, ?)',
        [id_cumplido, JSON.stringify(calificaciones)]
      );
    }

    console.log('--- FIN DEPURACIÓN REPORTE DE COMUNICACIÓN ---');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al guardar reporte de comunicación:', error);
    return NextResponse.json({ error: 'Error al guardar el reporte' }, { status: 500 });
  }
} 