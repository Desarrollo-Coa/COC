import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idZona = parseInt(id)
    const data = await request.json()
    const { nombre_zona } = data

    await pool.query(
      "UPDATE zonas_cementos_argos SET nombre_zona = ? WHERE id_zona = ?",
      [nombre_zona, idZona]
    )

    return NextResponse.json({
      success: true,
      message: "Zona actualizada exitosamente",
    })
  } catch (error) {
    console.error("Error al actualizar zona:", error)
    return NextResponse.json(
      { error: "Error al actualizar zona" },
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
    const idZona = parseInt(id)

    await pool.query(
      "DELETE FROM zonas_cementos_argos WHERE id_zona = ?",
      [idZona]
    )

    return NextResponse.json({
      success: true,
      message: "Zona eliminada exitosamente",
    })
  } catch (error) {
    console.error("Error al eliminar zona:", error)
    return NextResponse.json(
      { error: "Error al eliminar zona" },
      { status: 500 }
    )
  }
} 