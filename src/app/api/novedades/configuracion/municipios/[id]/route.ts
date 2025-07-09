import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idMunicipio = parseInt(id)
    const data = await request.json()
    const { nombre_municipio, id_departamento } = data

    await pool.query(
      "UPDATE Municipios SET nombre_municipio = ?, id_departamento = ? WHERE id_municipio = ?",
      [nombre_municipio, id_departamento, idMunicipio]
    )

    return NextResponse.json({
      success: true,
      message: "Municipio actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error al actualizar municipio:", error)
    return NextResponse.json(
      { error: "Error al actualizar municipio" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idMunicipio = parseInt(id)

    await pool.query(
      "DELETE FROM Municipios WHERE id_municipio = ?",
      [idMunicipio]
    )

    return NextResponse.json({
      success: true,
      message: "Municipio eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error al eliminar municipio:", error)
    return NextResponse.json(
      { error: "Error al eliminar municipio" },
      { status: 500 }
    )
  }
} 