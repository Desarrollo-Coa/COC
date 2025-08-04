import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { uploadToSpaces } from '@/utils/uploadToSpaces';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    console.log('📁 Subiendo archivo de cumplido...');
    
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

    // Obtener datos del formulario
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const descripcion = formData.get('descripcion') as string || '';
    const idCumplido = formData.get('idCumplido') as string;
    const latitud = formData.get('latitud') as string;
    const longitud = formData.get('longitud') as string;

    if (!file || !idCumplido) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Leer el archivo como buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generar nombre único para el archivo usando UUID
    const extension = file.name.split('.').pop();
    const uuid = uuidv4();
    const fileName = `cumplido_${idCumplido}_${uuid}.${extension}`;

    // Subir archivo a DigitalOcean Spaces
          const url = await uploadToSpaces(
      buffer,
      fileName,
      file.type,
      'cumplidos/fotos'
    );

    // Obtener el tipo de archivo para imágenes de cumplido (IC)
    console.log('🔍 Buscando tipo de archivo IC...');
    const [tipoArchivos] = await pool.query<RowDataPacket[]>(
      'SELECT id, codigo, descripcion, activo FROM tipo_archivo WHERE codigo = "IC"'
    );
    
    console.log('📋 Tipos de archivo IC encontrados:', tipoArchivos);

    if (!tipoArchivos.length) {
      console.error('❌ Tipo de archivo IC no encontrado en la base de datos');
      return NextResponse.json(
        { error: 'Tipo de archivo no encontrado' },
        { status: 404 }
      );
    }

    const tipoArchivo = tipoArchivos[0];
    if (!tipoArchivo.activo) {
      console.error('❌ Tipo de archivo IC no está activo');
      return NextResponse.json(
        { error: 'Tipo de archivo no está activo' },
        { status: 404 }
      );
    }

    // Insertar registro en la base de datos
    await pool.query(
      `INSERT INTO file_rc (
        id_cumplido, 
        tipo_id, 
        url, 
        latitud, 
        longitud, 
        descripcion
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        idCumplido,
        tipoArchivo.id,
        url,
        latitud || null,
        longitud || null,
        descripcion
      ]
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error al subir archivo:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}