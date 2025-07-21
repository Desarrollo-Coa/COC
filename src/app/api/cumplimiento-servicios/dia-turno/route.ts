import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_sede = searchParams.get('id_sede');
    const fecha = searchParams.get('fecha');
    const tipo_turno = searchParams.get('tipo_turno');
    if (!id_sede || !fecha || !tipo_turno) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }
    // Especificar el tipo de RowDataPacket[] para evitar el error de tipo
    const [cumplidos] = await pool.query<RowDataPacket[]>(
      `SELECT c.id_cumplido, c.colaborador, c.operador_coa
       FROM cumplidos_cementos_argos c
       WHERE c.id_sede = ? AND c.fecha = ? AND c.id_tipo_turno = ?`,
      [id_sede, fecha, tipo_turno]
    );
    if (!cumplidos || cumplidos.length === 0) {
      return NextResponse.json({ error: 'No existe cumplido para esos datos' }, { status: 404 });
    }
    const id_cumplido = cumplidos[0].id_cumplido;
    const [notas] = await pool.query<RowDataPacket[]>(
      'SELECT nota FROM notas_colaboradores_cementos_argos WHERE id_cumplido = ?',
      [id_cumplido]
    );
    return NextResponse.json({
      id_cumplido,
      colaborador: cumplidos[0].colaborador,
      operador_coa: cumplidos[0].operador_coa,
      nota: notas && notas.length > 0 ? notas[0].nota : null
    });
  } catch (error) {
    console.error('Error al obtener detalle de turno:', error);
    return NextResponse.json({ error: 'Error al obtener detalle de turno' }, { status: 500 });
  }
} 