import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const colaboradorId = searchParams.get('colaboradorId');
  const fecha = searchParams.get('fecha');
  const puestoId = searchParams.get('puestoId');

  if (!colaboradorId || !fecha || !puestoId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  try {
    const connection = await pool.getConnection();
    
    try {
      // 1. Buscar el cumplido para ese puesto, fecha y colaborador
      const [cumplidosRows] = await connection.query<RowDataPacket[]>(
        `SELECT c.id_cumplido, c.colaborador, p.nombre_puesto
         FROM cumplidos c
         JOIN puestos p ON c.id_puesto = p.id_puesto
         WHERE c.id_puesto = ? AND c.fecha = ? AND c.colaborador = ?`,
        [puestoId, fecha, colaboradorId]
      );

      if (!cumplidosRows.length) {
        return NextResponse.json({ 
          error: 'No se encontró el cumplido para los parámetros especificados' 
        }, { status: 404 });
      }

      const cumplido = cumplidosRows[0];
      const idCumplido = cumplido.id_cumplido;

      // 2. Obtener los reportes de comunicación para ese cumplido
      const [reportesRows] = await connection.query<RowDataPacket[]>(
        `SELECT calificaciones FROM reporte_comunicacion 
         WHERE id_cumplido = ?`,
        [idCumplido]
      );

      // 3. Obtener la nota del cumplido
      const [notasRows] = await connection.query<RowDataPacket[]>(
        `SELECT nota FROM notas_cumplidos 
         WHERE id_cumplido = ?`,
        [idCumplido]
      );

      // 4. Procesar las calificaciones
      let reportes: any[] = [];
      if (reportesRows.length > 0) {
        let calificaciones: any;
        
        try {
          // Manejar tanto strings JSON como objetos ya parseados por MySQL2
          calificaciones = typeof reportesRows[0].calificaciones === "string"
            ? JSON.parse(reportesRows[0].calificaciones)
            : (reportesRows[0].calificaciones || {});
        } catch (parseError) {
          console.error('Error al parsear calificaciones:', parseError);
          console.error('Datos recibidos:', reportesRows[0].calificaciones);
          return NextResponse.json({ 
            error: 'Error al procesar las calificaciones' 
          }, { status: 500 });
        }
        
        // Convertir el formato de calificaciones a array de reportes
        reportes = Object.entries(calificaciones).map(([reporteKey, horasObj]: [string, any]) => {
          const horas = Object.entries(horasObj as any);
          return horas.map(([hora, valorObj]: [string, any]) => {
            const valor = typeof valorObj === 'object' && valorObj !== null && 'valor' in valorObj 
              ? valorObj.valor 
              : valorObj;
            const nota = typeof valorObj === 'object' && valorObj !== null && 'nota' in valorObj 
              ? valorObj.nota 
              : null;
            
            return {
              reporte: reporteKey,
              hora: hora,
              valor: valor,
              nota: nota
            };
          });
        }).flat();
      }

      // 5. Preparar la respuesta
      const data = {
        nombre: cumplido.colaborador,
        puesto: cumplido.nombre_puesto,
        fecha: fecha,
        reportes: reportes,
        nota: notasRows.length > 0 ? notasRows[0].nota : ''
      };

      return NextResponse.json(data);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al obtener reportes por colaborador:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
} 