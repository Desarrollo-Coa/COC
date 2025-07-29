import { NextRequest, NextResponse } from "next/server"
import pool from '@/lib/db';
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { RowDataPacket } from 'mysql2';

const s3Client = new S3Client({
  region: process.env.DO_SPACES_REGION!,
  endpoint: process.env.DO_SPACES_ENDPOINT,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!
  }
});

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params
    const id = params.id

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        n.id_novedad,
        n.consecutivo,
        n.fecha_hora_novedad as fecha_novedad,
        TIME_FORMAT(n.fecha_hora_novedad, '%H:%i:%s') as hora_novedad,
        n.descripcion,
        n.gestion,
        te.nombre_tipo_evento as tipo_novedad,
        p.nombre_puesto as puesto,
        un.nombre_unidad as unidad_negocio,
        ne.nombre_negocio as negocio,
        GROUP_CONCAT(i.url_imagen) as archivos,
        n.evento_critico,
        n.fecha_hora_registro,
        u.nombre as nombre_usuario,
        u.apellido as apellido_usuario
      FROM novedades n
      JOIN tipos_evento te ON n.id_tipo_evento = te.id_tipo_evento
      JOIN puestos p ON n.id_puesto = p.id_puesto
      JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
      JOIN negocios ne ON un.id_negocio = ne.id_negocio
      LEFT JOIN imagenes_novedades i ON n.id_novedad = i.id_novedad
      JOIN users u ON n.id_usuario = u.id
      WHERE n.id_novedad = ?
      GROUP BY n.id_novedad
      `,
      [id]
    )
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Novedad no encontrada" }, { status: 404 })
    }
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Error al obtener la novedad:", error)
    return NextResponse.json({ error: "Error al obtener la novedad" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params
    const id = params.id
    const data = await request.json()

    const query = `
      UPDATE novedades_cementos_argos
      SET 
        descripcion = ?,
        gestion = ?,
        id_tipo_evento = ?,
        id_sede = ?,
        id_tipo_negocio = ?
      WHERE id_novedad = ?
    `

    await pool.query(query, [
      data.descripcion,
      data.gestion,
      data.id_tipo_evento,
      data.id_sede,
      data.id_tipo_negocio,
      id
    ])

    return NextResponse.json({ message: "Evento actualizado correctamente" })
  } catch (error) {
    console.error("Error al actualizar el evento:", error)
    return NextResponse.json({ error: "Error al actualizar el evento" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params
    const id = params.id

    // Primero eliminar las imágenes asociadas
    await pool.query(
      "DELETE FROM imagenes_novedades_cementos_argos WHERE id_novedad = ?",
      [id]
    )

    // Luego eliminar el evento
    await pool.query(
      "DELETE FROM novedades_cementos_argos WHERE id_novedad = ?",
      [id]
    )

    return NextResponse.json({ message: "Evento eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar el evento:", error)
    return NextResponse.json({ error: "Error al eliminar el evento" }, { status: 500 })
  }
}
