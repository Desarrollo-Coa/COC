import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { deleteFromSpaces } from '@/utils/deleteFromSpaces';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ idCumplido: string }> }
) {
  try {
    // Obtener token del header Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verificar el token JWT
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload } = await jwtVerify(token, secret);

      // Verificar que es un token de vigilante
      if (payload.tipo !== 'vigilante') {
        return NextResponse.json(
          { error: 'Token inválido para vigilantes' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const { idCumplido } = await params;

    const [archivos] = await pool.query<RowDataPacket[]>(
      `SELECT f.*, ta.codigo as tipo_codigo
       FROM file_rc f
       INNER JOIN tipo_archivo ta ON f.tipo_id = ta.id
       WHERE f.id_cumplido = ? AND ta.codigo = 'IC'
       ORDER BY f.fecha_creacion DESC
       LIMIT 1`,
      [idCumplido]
    );

    if (!archivos.length) {
      return NextResponse.json({ foto: null });
    }

    return NextResponse.json({ foto: archivos[0] });
  } catch (error) {
    console.error('Error al obtener foto del cumplido:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ idCumplido: string }> }
) {
  try {
    // Obtener token del header Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verificar el token JWT
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload } = await jwtVerify(token, secret);

      // Verificar que es un token de vigilante
      if (payload.tipo !== 'vigilante') {
        return NextResponse.json(
          { error: 'Token inválido para vigilantes' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const { idCumplido } = await params;
    const idCumplidoInt = parseInt(idCumplido);

    if (isNaN(idCumplidoInt)) {
      return NextResponse.json({ error: 'ID de cumplido inválido' }, { status: 400 });
    }

    console.log('[DELETE ARCHIVO] Eliminando archivos del cumplido:', idCumplidoInt);

    // Obtener archivos asociados al cumplido
    const [archivos] = await pool.query<RowDataPacket[]>(
      'SELECT id_file, url FROM file_rc WHERE id_cumplido = ?',
      [idCumplidoInt]
    );

    let archivosEliminados = 0;

    // Eliminar archivos de Digital Ocean Spaces
    for (const archivo of archivos) {
      try {
        // Extraer la key del archivo de la URL
        const url = archivo.url;
        const keyMatch = url.match(/cumplidos\/fotos\/([^?]+)/);
        if (keyMatch) {
          const key = `cumplidos/fotos/${keyMatch[1]}`;
          console.log('[DELETE ARCHIVO] Eliminando archivo de Spaces:', key);
          await deleteFromSpaces(key);
        }
      } catch (error) {
        console.error('[DELETE ARCHIVO] Error eliminando archivo de Spaces:', error);
        // Continuar con la eliminación aunque falle la eliminación del archivo
      }
    }

    // Eliminar registros de archivos de la base de datos
    const [result] = await pool.query(
      'DELETE FROM file_rc WHERE id_cumplido = ?',
      [idCumplidoInt]
    );

    archivosEliminados = (result as any).affectedRows || 0;

    console.log('[DELETE ARCHIVO] Archivos eliminados exitosamente:', archivosEliminados);

    return NextResponse.json({ 
      success: true, 
      message: 'Archivos eliminados exitosamente',
      archivosEliminados
    });

  } catch (error) {
    console.error('[DELETE ARCHIVO] Error eliminando archivos:', error);
    return NextResponse.json(
      { error: 'Error al eliminar los archivos' },
      { status: 500 }
    );
  }
}