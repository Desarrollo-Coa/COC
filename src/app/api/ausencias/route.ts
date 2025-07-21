import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { uploadToSpacesV2 } from '@/utils/uploadToSpacesV2';

export const revalidate = 0;

export async function GET() {
  try {
    const [ausencias] = await pool.query(
      `SELECT a.*, c.nombre AS nombre_colaborador, c.apellido AS apellido_colaborador, p.nombre_puesto, ta.nombre_tipo_ausencia
       FROM ausencias a
       JOIN colaboradores c ON a.id_colaborador = c.id
       JOIN puestos p ON a.id_puesto = p.id_puesto
       JOIN tipos_ausencia ta ON a.id_tipo_ausencia = ta.id_tipo_ausencia
       ORDER BY a.fecha_registro DESC`
    );
    // Para cada ausencia, obtener archivos adjuntos
    const ausenciasConArchivos = await Promise.all((ausencias as any[]).map(async (a) => {
      const [archivos] = await pool.query(
        'SELECT id_archivo, url_archivo, nombre_archivo FROM archivos_ausencias WHERE id_ausencia = ?',
        [a.id_ausencia]
      );
      return { ...a, archivos };
    }));
    return NextResponse.json(ausenciasConArchivos);
  } catch (error) {
    console.error('Error al obtener ausencias:', error);
    return NextResponse.json({ error: 'Error al obtener ausencias' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const id_colaborador = formData.get('id_colaborador');
    const id_puesto = formData.get('id_puesto');
    const id_tipo_ausencia = formData.get('id_tipo_ausencia');
    const fecha_inicio = formData.get('fecha_inicio');
    const fecha_fin = formData.get('fecha_fin');
    const descripcion = formData.get('descripcion');
    const id_usuario_registro = formData.get('id_usuario_registro');
    const archivos = formData.getAll('archivos');

    // DEPURACIÓN: Mostrar datos recibidos
    console.log('--- REGISTRO DE AUSENCIA ---');
    console.log({ id_colaborador, id_puesto, id_tipo_ausencia, fecha_inicio, fecha_fin, descripcion, id_usuario_registro });
    console.log('Archivos recibidos:', archivos.map(a => (typeof a === 'string' ? a : a.name)));

    // Validaciones básicas
    if (!id_colaborador || !id_puesto || !id_tipo_ausencia || !fecha_inicio || !fecha_fin || !id_usuario_registro) {
      console.log('Faltan campos obligatorios');
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }
    if (new Date(fecha_inicio as string) > new Date(fecha_fin as string)) {
      console.log('Fechas inválidas');
      return NextResponse.json({ error: 'La fecha de inicio debe ser menor o igual a la fecha final' }, { status: 400 });
    }

    // Insertar ausencia
    const [result]: any = await pool.query(
      'INSERT INTO ausencias (id_colaborador, id_puesto, id_tipo_ausencia, fecha_inicio, fecha_fin, descripcion, id_usuario_registro) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_colaborador, id_puesto, id_tipo_ausencia, fecha_inicio, fecha_fin, descripcion, id_usuario_registro]
    );
    const id_ausencia = result.insertId;
    console.log('Ausencia insertada, id:', id_ausencia);

    // Subir archivos a DigitalOcean Spaces
    for (const archivo of archivos) {
      if (typeof archivo === 'string') continue;
      // Validar tipo y tamaño
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(archivo.type)) {
        console.log('Archivo ignorado por tipo:', archivo.name, archivo.type);
        continue;
      }
      if (archivo.size > 10 * 1024 * 1024) {
        console.log('Archivo ignorado por tamaño:', archivo.name, archivo.size);
        continue;
      }
      const arrayBuffer = await archivo.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const url_archivo = await uploadToSpacesV2(
        buffer,
        archivo.name,
        archivo.type,
        `ausencias/${id_ausencia}`
      );
      await pool.query(
        'INSERT INTO archivos_ausencias (id_ausencia, url_archivo, nombre_archivo) VALUES (?, ?, ?)',
        [id_ausencia, url_archivo, archivo.name]
      );
      console.log('Archivo subido y registrado:', archivo.name, url_archivo);
    }

    console.log('--- FIN REGISTRO AUSENCIA ---');
    return NextResponse.json({ success: true, id_ausencia });
  } catch (error: any) {
    console.error('Error al registrar ausencia:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
} 