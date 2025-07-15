import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const [rows] = await pool.query(
    'SELECT codigo_acceso_hash FROM codigos_seguridad_negocio WHERE id_negocio = ? AND activo = 1 LIMIT 1',
    [params.id]
  );
  return NextResponse.json((rows as any[])[0] || {});
}

// PUT: Desactivar el código activo
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  await pool.query(
    'UPDATE codigos_seguridad_negocio SET activo = 0 WHERE id_negocio = ? AND activo = 1',
    [params.id]
  );
  return NextResponse.json({ success: true });
}

// DELETE: Eliminar el código activo
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await pool.query(
    'DELETE FROM codigos_seguridad_negocio WHERE id_negocio = ? AND activo = 1',
    [params.id]
  );
  return NextResponse.json({ success: true });
} 