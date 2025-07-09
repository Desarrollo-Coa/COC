import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id_departamento as id,
        nombre_departamento as nombre
      FROM Departamentos
      ORDER BY id_departamento ASC`
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener departamentos:", error)
    return NextResponse.json(
      { error: "Error al obtener departamentos" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { nombre_departamento } = data

    const [result] = await pool.query(
      "INSERT INTO Departamentos (nombre_departamento) VALUES (?)",
      [nombre_departamento]
    )

    return NextResponse.json({
      success: true,
      message: "Departamento creado exitosamente",
      id: (result as any).insertId,
    })
  } catch (error) {
    console.error("Error al crear departamento:", error)
    return NextResponse.json(
      { error: "Error al crear departamento" },
      { status: 500 }
    )
  }
} 