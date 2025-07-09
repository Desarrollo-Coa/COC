import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id_tipo_negocio as id,
        nombre_tipo_negocio as nombre
      FROM tipos_negocio_cementos
      ORDER BY id_tipo_negocio ASC`
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener tipos de negocio:", error)
    return NextResponse.json(
      { error: "Error al obtener tipos de negocio" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { nombre_tipo_negocio } = data

    const [result] = await pool.query(
      "INSERT INTO tipos_negocio_cementos (nombre_tipo_negocio) VALUES (?)",
      [nombre_tipo_negocio]
    )

    return NextResponse.json({
      success: true,
      message: "Tipo de negocio creado exitosamente",
      id: (result as any).insertId,
    })
  } catch (error) {
    console.error("Error al crear tipo de negocio:", error)
    return NextResponse.json(
      { error: "Error al crear tipo de negocio" },
      { status: 500 }
    )
  }
} 