import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_unidad = searchParams.get('id_unidad');
    if (!id_unidad) {
      return NextResponse.json([], { status: 200 });
    }
    const [rows] = await pool.query(
      'SELECT id_puesto, nombre_puesto FROM puestos WHERE id_unidad = ? AND activo = TRUE ORDER BY nombre_puesto ASC',
      [id_unidad]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error al obtener puestos:', error);
    return NextResponse.json({ error: 'Error al obtener puestos' }, { status: 500 });
  }
} 