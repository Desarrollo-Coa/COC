import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { uploadToSpacesV2 } from '@/utils/uploadToSpacesV2';
import { deleteFromSpaces } from '@/utils/deleteFromSpaces';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id_ausencia = params.id;
    const formData = await request.formData();
    
    // Obtener datos del formulario
    const nombre_tipo_ausencia = formData.get('nombre_tipo_ausencia') as string;
    const descripcion = formData.get('descripcion') as string;
    const archivos_nuevos = formData.getAll('archivo_0') as File[]; // Archivos nuevos
    const archivos_eliminar = formData.get('archivos_eliminar') as string; // IDs de archivos a eliminar

    console.log('--- EDICIÓN DE AUSENCIA ---');
    console.log('ID Ausencia:', id_ausencia);
    console.log('Nuevo tipo:', nombre_tipo_ausencia);
    console.log('Nueva descripción:', descripcion);
    console.log('Archivos nuevos:', archivos_nuevos.length);
    console.log('Archivos a eliminar:', archivos_eliminar);

    // Validar que la ausencia existe
    const [ausenciaExistente] = await pool.query(
      'SELECT id_ausencia FROM ausencias WHERE id_ausencia = ?',
      [id_ausencia]
    ) as [any[], any];

    if (!ausenciaExistente || ausenciaExistente.length === 0) {
      return NextResponse.json({ error: 'Ausencia no encontrada' }, { status: 404 });
    }

    // Obtener el ID del tipo de ausencia basado en el nombre
    const [tiposAusencia] = await pool.query(
      'SELECT id_tipo_ausencia FROM tipos_ausencia WHERE nombre_tipo_ausencia = ?',
      [nombre_tipo_ausencia]
    ) as [any[], any];

    if (!tiposAusencia || tiposAusencia.length === 0) {
      return NextResponse.json({ error: 'Tipo de ausencia no válido' }, { status: 400 });
    }

    const id_tipo_ausencia = tiposAusencia[0].id_tipo_ausencia;

    // Actualizar la ausencia
    await pool.query(
      'UPDATE ausencias SET id_tipo_ausencia = ?, descripcion = ? WHERE id_ausencia = ?',
      [id_tipo_ausencia, descripcion, id_ausencia]
    );

    console.log('Ausencia actualizada correctamente');

    // Procesar archivos a eliminar
    if (archivos_eliminar) {
      const archivosEliminarIds = JSON.parse(archivos_eliminar);
      console.log('Eliminando archivos:', archivosEliminarIds);

      for (const id_archivo of archivosEliminarIds) {
        // Obtener información del archivo antes de eliminarlo
        const [archivoInfo] = await pool.query(
          'SELECT url_archivo, nombre_archivo FROM archivos_ausencias WHERE id_archivo = ? AND id_ausencia = ?',
          [id_archivo, id_ausencia]
        ) as [any[], any];

        if (archivoInfo && archivoInfo.length > 0) {
          const archivo = archivoInfo[0];
          
          // Eliminar de DigitalOcean Spaces
          try {
            // Extraer la clave del archivo de la URL
            // La URL tiene formato: https://nyc3.digitaloceanspaces.com/bucket/folder/file.ext
            const urlParts = archivo.url_archivo.split('/');
            const key = urlParts.slice(-3).join('/'); // Tomar los últimos 3 segmentos: folder/file.ext
            await deleteFromSpaces(key);
            console.log('Archivo eliminado de Spaces:', key);
          } catch (error) {
            console.error('Error al eliminar archivo de Spaces:', error);
            // Continuar con la eliminación de la BD aunque falle en Spaces
          }

          // Eliminar de la base de datos
          await pool.query(
            'DELETE FROM archivos_ausencias WHERE id_archivo = ?',
            [id_archivo]
          );
          console.log('Archivo eliminado de BD:', archivo.nombre_archivo);
        }
      }
    }

    // Procesar archivos nuevos
    for (const archivo of archivos_nuevos) {
      if (!archivo || archivo.size === 0) continue;

      // Validar tipo y tamaño
      if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(archivo.type)) {
        console.log('Archivo ignorado por tipo:', archivo.name, archivo.type);
        continue;
      }
      if (archivo.size > 10 * 1024 * 1024) {
        console.log('Archivo ignorado por tamaño:', archivo.name, archivo.size);
        continue;
      }

      try {
        const arrayBuffer = await archivo.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const url_archivo = await uploadToSpacesV2(
          buffer,
          archivo.name,
          archivo.type,
          `ausencias/${id_ausencia}`
        );

        // Guardar en la base de datos
        await pool.query(
          'INSERT INTO archivos_ausencias (id_ausencia, url_archivo, nombre_archivo) VALUES (?, ?, ?)',
          [id_ausencia, url_archivo, archivo.name]
        );

        console.log('Nuevo archivo subido:', archivo.name, url_archivo);
      } catch (error) {
        console.error('Error al subir archivo:', archivo.name, error);
      }
    }

    console.log('--- FIN EDICIÓN AUSENCIA ---');

    return NextResponse.json({ 
      success: true, 
      message: 'Ausencia actualizada correctamente',
      id_ausencia: parseInt(id_ausencia)
    });

  } catch (error: any) {
    console.error('Error al actualizar ausencia:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}

// GET - Obtener una ausencia específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id_ausencia = params.id;

    const [ausencias] = await pool.query(
      `SELECT a.*, c.nombre AS nombre_colaborador, c.apellido AS apellido_colaborador, 
              p.nombre_puesto, ta.nombre_tipo_ausencia, un.nombre_unidad, ng.nombre_negocio
       FROM ausencias a
       JOIN colaboradores c ON a.id_colaborador = c.id
       JOIN puestos p ON a.id_puesto = p.id_puesto
       JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
       JOIN negocios ng ON un.id_negocio = ng.id_negocio
       JOIN tipos_ausencia ta ON a.id_tipo_ausencia = ta.id_tipo_ausencia
       WHERE a.id_ausencia = ?`,
      [id_ausencia]
    ) as [any[], any];

    if (!ausencias || ausencias.length === 0) {
      return NextResponse.json({ error: 'Ausencia no encontrada' }, { status: 404 });
    }

    const ausencia = ausencias[0];

    // Obtener archivos adjuntos
    const [archivos] = await pool.query(
      'SELECT id_archivo, url_archivo, nombre_archivo FROM archivos_ausencias WHERE id_ausencia = ?',
      [id_ausencia]
    ) as [any[], any];

    return NextResponse.json({
      ...ausencia,
      archivos
    });

  } catch (error) {
    console.error('Error al obtener ausencia:', error);
    return NextResponse.json({ error: 'Error al obtener ausencia' }, { status: 500 });
  }
} 