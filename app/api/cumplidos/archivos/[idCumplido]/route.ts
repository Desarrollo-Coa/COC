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
    
    console.log('🔍 Buscando foto para cumplido:', idCumplido);

    // Primero verificar si existe el tipo de archivo IC
    const [tiposArchivo] = await pool.query<RowDataPacket[]>(
      'SELECT id, codigo, descripcion, activo FROM tipo_archivo WHERE codigo = "IC"'
    );
    
    console.log('📋 Tipos de archivo IC encontrados:', tiposArchivo);
    

    
    if (!tiposArchivo.length) {
      console.error('❌ Tipo de archivo IC no encontrado en la base de datos');
      return NextResponse.json(
        { error: 'Tipo de archivo no encontrado' },
        { status: 404 }
      );
    }

    const tipoArchivo = tiposArchivo[0];
    if (!tipoArchivo.activo) {
      console.error('❌ Tipo de archivo IC no está activo');
      return NextResponse.json(
        { error: 'Tipo de archivo no está activo' },
        { status: 404 }
      );
    }

    const [archivos] = await pool.query<RowDataPacket[]>(
      `SELECT f.*, ta.codigo as tipo_codigo
       FROM file_rc f
       INNER JOIN tipo_archivo ta ON f.tipo_id = ta.id
       WHERE f.id_cumplido = ? AND ta.codigo = 'IC'
       ORDER BY f.fecha_creacion DESC
       LIMIT 1`,
      [idCumplido]
    );

    console.log('📁 Archivos encontrados:', archivos.length);

    if (!archivos.length) {
      console.log('📭 No se encontraron archivos para el cumplido');
      return NextResponse.json({ foto: null });
    }

    console.log('✅ Foto encontrada:', archivos[0]);
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

    // Obtener archivos asociados al cumplido (todos los tipos: fotos, audios, etc.)
    const [archivos] = await pool.query<RowDataPacket[]>(
      `SELECT f.id, f.url, ta.codigo as tipo_codigo
       FROM file_rc f
       INNER JOIN tipo_archivo ta ON f.tipo_id = ta.id
       WHERE f.id_cumplido = ?`,
      [idCumplidoInt]
    );

    let archivosEliminados = 0;

    // Eliminar archivos de Digital Ocean Spaces
    for (const archivo of archivos) {
      try {
        // Extraer la key del archivo de la URL
        const url = archivo.url;
        console.log('[DELETE ARCHIVO] Procesando archivo:', archivo.tipo_codigo, url);
        
        // Determinar la carpeta según el tipo de archivo y la URL
        let carpeta = 'cumplidos/fotos'; // Por defecto
        if (archivo.tipo_codigo === 'AC') { // Audio
          // Verificar si es audio de comunicación o de cumplido
          if (url.includes('comunicacion/audio/')) {
            carpeta = 'comunicacion/audio';
          } else {
            carpeta = 'cumplidos/audios';
          }
        } else if (archivo.tipo_codigo === 'IC') { // Imagen
          carpeta = 'cumplidos/fotos';
        }
        
        // Extraer la key del archivo de la URL
        const keyMatch = url.match(new RegExp(`${carpeta.replace('/', '\\/')}\\/([^?]+)`));
        if (keyMatch) {
          const key = `${carpeta}/${keyMatch[1]}`;
          console.log('[DELETE ARCHIVO] Eliminando archivo de Spaces:', key);
          await deleteFromSpaces(key);
        } else {
          console.log('[DELETE ARCHIVO] No se pudo extraer la key de la URL:', url);
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
      archivosEliminados,
      tiposEliminados: archivos.map(a => a.tipo_codigo)
    });

  } catch (error) {
    console.error('[DELETE ARCHIVO] Error eliminando archivos:', error);
    return NextResponse.json(
      { error: 'Error al eliminar los archivos' },
      { status: 500 }
    );
  }
}