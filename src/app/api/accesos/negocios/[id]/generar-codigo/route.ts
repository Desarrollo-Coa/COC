import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

function generarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const codigoPlano = generarCodigo();

  // Desactivar códigos anteriores
  await pool.query(
    'UPDATE codigos_seguridad_negocio SET activo = 0 WHERE id_negocio = ?',
    [params.id]
  );
  // Insertar nuevo código en texto plano
  await pool.query(
    'INSERT INTO codigos_seguridad_negocio (id_negocio, codigo_acceso_hash, activo) VALUES (?, ?, 1)',
    [params.id, codigoPlano]
  );
  return NextResponse.json({ codigo: codigoPlano });
} 