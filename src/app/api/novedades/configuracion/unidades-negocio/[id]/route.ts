import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idUnidad = parseInt(id)
    const data = await request.json()
    const { nombre_unidad, id_zona } = data

    await pool.query(
      'UPDATE unidades_negocio_cementos_argos SET nombre_unidad = ?, id_zona = ? WHERE id_unidad = ?',
      [nombre_unidad, id_zona, idUnidad]
    )

    return NextResponse.json({ 
      success: true, 
      message: "Unidad de negocio actualizada exitosamente" 
    })
  } catch (error) {
    console.error("Error al actualizar unidad de negocio:", error)
    return NextResponse.json({ error: "Error al actualizar unidad de negocio" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idUnidad = parseInt(id)

    await pool.query(
      'DELETE FROM unidades_negocio_cementos_argos WHERE id_unidad = ?',
      [idUnidad]
    )

    return NextResponse.json({ 
      success: true, 
      message: "Unidad de negocio eliminada exitosamente" 
    })
  } catch (error) {
    console.error("Error al eliminar unidad de negocio:", error)
    return NextResponse.json({ error: "Error al eliminar unidad de negocio" }, { status: 500 })
  }
} 