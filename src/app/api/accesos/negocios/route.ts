import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  // Traer negocios y su código de acceso activo (si existe)
  const [rows] = await pool.query(`
    SELECT n.id_negocio, n.nombre_negocio, n.activo,
      c.codigo_acceso_hash
    FROM negocios n
    LEFT JOIN codigos_seguridad_negocio c
      ON n.id_negocio = c.id_negocio AND c.activo = 1
    ORDER BY n.id_negocio ASC
  `);
  return NextResponse.json(rows);
} 