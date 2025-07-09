import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT 
        m.id_municipio as id,
        m.nombre_municipio as nombre,
        m.id_departamento as departamento_id,
        d.nombre_departamento as departamento
      FROM Municipios m
      JOIN Departamentos d ON m.id_departamento = d.id_departamento
      ORDER BY m.id_municipio ASC`
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener municipios:", error)
    return NextResponse.json(
      { error: "Error al obtener municipios" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { nombre_municipio, id_departamento } = data

    const [result] = await pool.query(
      "INSERT INTO Municipios (nombre_municipio, id_departamento) VALUES (?, ?)",
      [nombre_municipio, id_departamento]
    )

    return NextResponse.json({
      success: true,
      message: "Municipio creado exitosamente",
      id: (result as any).insertId,
    })
  } catch (error) {
    console.error("Error al crear municipio:", error)
    return NextResponse.json(
      { error: "Error al crear municipio" },
      { status: 500 }
    )
  }
} 