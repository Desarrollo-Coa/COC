import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT nombre FROM roles');
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener roles' }, { status: 500 });
  }
} 