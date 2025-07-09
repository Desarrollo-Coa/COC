import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { RowDataPacket } from 'mysql2'

export async function GET() {
  try {
    const query = `
      SELECT 
        un.id_unidad,
        un.nombre_unidad,
        un.id_zona,
        z.nombre_zona
      FROM unidades_negocio_cementos_argos un
      LEFT JOIN zonas_cementos_argos z ON un.id_zona = z.id_zona
      ORDER BY un.id_unidad ASC
    `

    const [rows] = await pool.query<RowDataPacket[]>(query)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener unidades de negocio:", error)
    return NextResponse.json({ error: "Error al obtener unidades de negocio" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { nombre_unidad, id_zona } = data

    const [result] = await pool.query(
      'INSERT INTO unidades_negocio_cementos_argos (nombre_unidad, id_zona) VALUES (?, ?)',
      [nombre_unidad, id_zona]
    )

    return NextResponse.json({ 
      success: true, 
      message: "Unidad de negocio creada exitosamente",
      id: (result as any).insertId 
    })
  } catch (error) {
    console.error("Error al crear unidad de negocio:", error)
    return NextResponse.json({ error: "Error al crear unidad de negocio" }, { status: 500 })
  }
} 