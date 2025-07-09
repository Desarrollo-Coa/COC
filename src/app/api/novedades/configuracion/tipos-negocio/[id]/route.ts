import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idTipoNegocio = parseInt(id)
    const data = await request.json()
    const { nombre_tipo_negocio } = data

    await pool.query(
      "UPDATE Tipos_Negocio SET nombre_tipo_negocio = ? WHERE id_tipo_negocio = ?",
      [nombre_tipo_negocio, idTipoNegocio]
    )

    return NextResponse.json({
      success: true,
      message: "Tipo de negocio actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error al actualizar tipo de negocio:", error)
    return NextResponse.json(
      { error: "Error al actualizar tipo de negocio" },
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
    const idTipoNegocio = parseInt(id)

    await pool.query(
      "DELETE FROM Tipos_Negocio WHERE id_tipo_negocio = ?",
      [idTipoNegocio]
    )

    return NextResponse.json({
      success: true,
      message: "Tipo de negocio eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error al eliminar tipo de negocio:", error)
    return NextResponse.json(
      { error: "Error al eliminar tipo de negocio" },
      { status: 500 }
    )
  }
} 