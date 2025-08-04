import { NextRequest, NextResponse } from 'next/server';
import { getVigilanteTokenFromRequest } from '@/lib/auth';
import { uploadToSpacesV2 } from '@/utils/uploadToSpacesV2';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    console.log('📁 Subiendo archivo de cumplido...');
    
    // Verificar token
    const token = getVigilanteTokenFromRequest(request);
    console.log('📁 Token obtenido:', !!token);
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
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
    const url = await uploadToSpacesV2(
      buffer,
      fileName,
      file.type,
      'cumplidos/fotos'
    );

    // Obtener el tipo de archivo para imágenes de cumplido (IC)
    const [tipoArchivos] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM tipo_archivo WHERE codigo = "IC" AND activo = TRUE LIMIT 1'
    );

    if (!tipoArchivos.length) {
      return NextResponse.json(
        { error: 'Tipo de archivo no encontrado' },
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
        tipoArchivos[0].id,
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