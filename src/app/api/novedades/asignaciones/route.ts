import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { RowDataPacket } from 'mysql2'

// GET - Obtener todas las asignaciones
export async function GET() {
  try {
    const query = `
      SELECT 
        a.id_asignacion as id,
        a.id_destinatario,
        d.nombre as nombre_destinatario,
        d.email as email_destinatario,
        a.id_tipo_novedad,
        te.nombre_tipo_evento as nombre_tipo_novedad,
        a.id_sede,
        s.nombre_sede,
        a.id_unidad_negocio,
        un.nombre_unidad as nombre_unidad_negocio,
        a.activo
      FROM asignaciones_destinatarios_cementos_argos a
      INNER JOIN destinatarios_cementos_argos d ON a.id_destinatario = d.id_destinatario
      INNER JOIN Tipos_Evento te ON a.id_tipo_novedad = te.id_tipo_evento
      INNER JOIN Sedes s ON a.id_sede = s.id_sede
      INNER JOIN unidades_negocio_cementos_argos un ON a.id_unidad_negocio = un.id_unidad
      WHERE a.activo = true
      ORDER BY d.nombre ASC
    `

    const [rows] = await pool.query<RowDataPacket[]>(query)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener asignaciones:", error)
    return NextResponse.json({ error: "Error al obtener asignaciones" }, { status: 500 })
  }
}

// POST - Crear nueva asignación
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const query = `
      INSERT INTO asignaciones_destinatarios_cementos_argos 
      (id_destinatario, id_tipo_novedad, id_sede, id_unidad_negocio)
      VALUES (?, ?, ?, ?)
    `

    const [result] = await pool.query(query, [
      data.id_destinatario,
      data.id_tipo_novedad,
      data.id_sede,
      data.id_unidad_negocio
    ])

    return NextResponse.json({ 
      message: "Asignación creada exitosamente",
      id: (result as any).insertId 
    })
  } catch (error) {
    console.error("Error al crear asignación:", error)
    return NextResponse.json({ error: "Error al crear asignación" }, { status: 500 })
  }
} 