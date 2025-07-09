import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const idDepartamento = parseInt(id);
    const data = await request.json();
    const { nombre_departamento } = data;

    await pool.query(
      "UPDATE Departamentos SET nombre_departamento = ? WHERE id_departamento = ?",
      [nombre_departamento, idDepartamento]
    );

    return NextResponse.json({
      success: true,
      message: "Departamento actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error al actualizar departamento:", error);
    return NextResponse.json(
      { error: "Error al actualizar departamento" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const idDepartamento = parseInt(id);

    await pool.query(
      "DELETE FROM Departamentos WHERE id_departamento = ?",
      [idDepartamento]
    );

    return NextResponse.json({
      success: true,
      message: "Departamento eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar departamento:", error);
    return NextResponse.json(
      { error: "Error al eliminar departamento" },
      { status: 500 }
    );
  }
}