import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import Hashids from 'hashids';

interface Colaborador extends RowDataPacket {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  foto_url?: string;
  activo: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const negocioHash = request.headers.get('x-negocio-hash');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    if (!negocioHash) {
      return NextResponse.json(
        { error: 'Hash de negocio requerido' },
        { status: 400 }
      );
    }

    const token = authHeader.substring(7);

    try {
      // Verificar el token JWT
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload } = await jwtVerify(token, secret);

      // Verificar que es un token de vigilante
      if (payload.tipo !== 'vigilante') {
        return NextResponse.json(
          { error: 'Token inválido para vigilantes' },
          { status: 401 }
        );
      }

      const colaboradorId = payload.id as number;

      // Verificar que el colaborador sigue activo
      const [colaboradores] = await pool.query<Colaborador[]>(
        `SELECT id, nombre, apellido, cedula, foto_url, activo
         FROM colaboradores
         WHERE id = ? AND activo = TRUE`,
        [colaboradorId]
      );

      if (!colaboradores.length) {
        return NextResponse.json(
          { error: 'Colaborador no encontrado o inactivo' },
          { status: 401 }
        );
      }

      const colaborador = colaboradores[0];

      // Decodificar el hash para obtener el ID del negocio
      const Hashids = require('hashids');
      const hashids = new Hashids(process.env.HASHIDS_SALT || 'accesos_salt', 8);
      const ids = hashids.decode(negocioHash);
      
      if (!ids.length) {
        return NextResponse.json(
          { error: 'Hash de negocio inválido' },
          { status: 400 }
        );
      }
      
      const id_negocio = ids[0];
      
      // Verificar que el negocio sigue activo
      const [negocios] = await pool.query<RowDataPacket[]>(
        `SELECT n.id_negocio, n.nombre_negocio
         FROM negocios n
         INNER JOIN codigos_seguridad_negocio csn ON n.id_negocio = csn.id_negocio
         WHERE n.id_negocio = ? AND csn.activo = TRUE AND n.activo = TRUE`,
        [id_negocio]
      );

      if (!negocios.length) {
        return NextResponse.json(
          { error: 'Negocio no encontrado o inactivo' },
          { status: 401 }
        );
      }

      const negocio = negocios[0];

      return NextResponse.json({
        id: colaborador.id,
        nombre: colaborador.nombre,
        apellido: colaborador.apellido,
        cedula: colaborador.cedula,
        foto_url: colaborador.foto_url,
        negocio: {
          id: negocio.id_negocio,
          nombre: negocio.nombre_negocio
        },
        exp: payload.exp
      });

    } catch (jwtError) {
      console.error('Error verificando JWT:', jwtError);
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Error en verificación de sesión:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 