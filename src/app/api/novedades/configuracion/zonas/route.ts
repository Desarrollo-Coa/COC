import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT id_zona as id, nombre_zona as nombre 
       FROM zonas_cementos_argos 
       ORDER BY nombre_zona ASC`
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener zonas:", error)
    return NextResponse.json(
      { error: "Error al obtener zonas" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { nombre_zona } = data

    const [result] = await pool.query(
      "INSERT INTO zonas_cementos_argos (nombre_zona) VALUES (?)",
      [nombre_zona]
    )

    return NextResponse.json({
      success: true,
      message: "Zona creada exitosamente",
      id: (result as any).insertId,
    })
  } catch (error) {
    console.error("Error al crear zona:", error)
    return NextResponse.json(
      { error: "Error al crear zona" },
      { status: 500 }
    )
  }
} 