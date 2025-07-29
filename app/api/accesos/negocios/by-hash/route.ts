import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import Hashids from 'hashids';

const hashids = new Hashids(process.env.HASHIDS_SALT || 'accesos_salt', 8);

export async function GET(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get('hash');
  if (!hash) return NextResponse.json({ error: 'Hash requerido' }, { status: 400 });

  const ids = hashids.decode(hash);
  if (!ids.length) return NextResponse.json({ error: 'Hash inválido' }, { status: 404 });

  const id_negocio = ids[0];
  // Traer el negocio y su código activo
  const [rows] = await pool.query(
    `SELECT n.id_negocio, n.nombre_negocio, c.codigo_acceso_hash
     FROM negocios n
     LEFT JOIN codigos_seguridad_negocio c
       ON n.id_negocio = c.id_negocio AND c.activo = 1
     WHERE n.id_negocio = ?`,
    [id_negocio]
  );
  const negocios = rows as any[];
  if (negocios.length === 0) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });

  // Mapear el código como 'code'
  const negocio = negocios[0];
  return NextResponse.json({
    ...negocio,
    code: negocio.codigo_acceso_hash || "",
  });
} 