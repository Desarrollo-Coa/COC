import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const negocioId = searchParams.get('negocioId'); // id_negocio
    const unidadNegocioId = searchParams.get('unidadNegocioId'); // id_unidad

    if (!fecha || !negocioId) {
      return NextResponse.json(
        { error: 'Se requiere la fecha y negocioId' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      // Obtener todos los puestos del negocio o solo de la unidad si se especifica
      let puestosQuery = `
        SELECT p.id_puesto, p.nombre_puesto, p.activo, p.id_unidad
        FROM puestos p
        JOIN unidades_negocio u ON p.id_unidad = u.id_unidad
        WHERE u.id_negocio = ?`;
      const queryParams: any[] = [negocioId];
      if (unidadNegocioId) {
        puestosQuery += ' AND p.id_unidad = ?';
        queryParams.push(unidadNegocioId);
      }
      puestosQuery += ' ORDER BY p.nombre_puesto ASC';
      const [puestosRows] = await connection.query<RowDataPacket[]>(puestosQuery, queryParams);

      if (!puestosRows || puestosRows.length === 0) {
        return NextResponse.json({ puestos: {} });
      }

      // Obtener cumplidos para cada puesto en la fecha
      const puestoIds = puestosRows.map((p) => p.id_puesto);
      if (puestoIds.length === 0) {
        return NextResponse.json({ puestos: {} });
      }
      const [cumplidosRows] = await connection.query<RowDataPacket[]>(
        `SELECT c.id_cumplido, c.fecha, c.id_puesto, c.id_tipo_turno, c.id_colaborador,
                col.nombre AS colaborador_nombre, col.apellido AS colaborador_apellido, col.foto_url
         FROM cumplidos c
         LEFT JOIN colaboradores col ON c.id_colaborador = col.id
         WHERE c.fecha = ?
           AND c.id_puesto IN (${puestoIds.map(() => '?').join(',')})`,
        [fecha, ...puestoIds]
      );

      // Agrupar por puesto y turno
      const puestos: Record<string, any> = {};
      puestosRows.forEach((row) => {
        puestos[row.id_puesto] = {
          id_puesto: row.id_puesto,
          nombre_puesto: row.nombre_puesto,
          activo: !!row.activo,
          unidad_negocio_id: row.id_unidad?.toString() || null,
          diurno: null,
          nocturno: null
        };
      });

      cumplidosRows.forEach((row) => {
        if (puestos[row.id_puesto]) {
          const colaborador = row.id_colaborador
            ? {
                placa: row.id_colaborador,
                nombre: [row.colaborador_nombre, row.colaborador_apellido].filter(Boolean).join(' '),
                foto_url: row.foto_url || null
              }
            : null;
          if (row.id_tipo_turno === 1) {
            puestos[row.id_puesto].diurno = {
              colaborador
            };
          } else if (row.id_tipo_turno === 2) {
            puestos[row.id_puesto].nocturno = {
              colaborador
            };
          }
        }
      });

      // Filtrar: solo puestos activos, o inactivos con colaborador asignado
      const puestosFiltrados: Record<string, any> = {};
      Object.values(puestos).forEach((puesto: any) => {
        if (
          puesto.activo ||
          (puesto.diurno && puesto.diurno.colaborador) ||
          (puesto.nocturno && puesto.nocturno.colaborador)
        ) {
          puestosFiltrados[puesto.id_puesto] = puesto;
        }
      });

      return NextResponse.json({ puestos: puestosFiltrados });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al obtener cumplimiento de servicios:', error);
    return NextResponse.json(
      { error: 'Error al obtener cumplimiento de servicios' },
      { status: 500 }
    );
  }
} 