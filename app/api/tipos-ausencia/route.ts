import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(
      'SELECT id_tipo_ausencia, nombre_tipo_ausencia FROM tipos_ausencia WHERE activo = TRUE'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error al obtener tipos de ausencia:', error);
    return NextResponse.json({ error: 'Error al obtener tipos de ausencia' }, { status: 500 });
  }
} 