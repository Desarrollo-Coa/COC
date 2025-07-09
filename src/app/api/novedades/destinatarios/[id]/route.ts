import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const data = await request.json();
    const { nombre, email } = data;
    const id = params.id;

    const query = `
      UPDATE destinatarios_cementos_argos 
      SET nombre = ?, email = ?
      WHERE id_destinatario = ?
    `;

    await pool.query(query, [nombre, email, id]);

    return NextResponse.json({ message: "Destinatario actualizado correctamente" });
  } catch (error: any) {
    console.error("Error al actualizar destinatario:", error);
    return NextResponse.json(
      { error: "Error al actualizar el destinatario" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const id = params.id;
    
    const query = `
      DELETE FROM destinatarios_cementos_argos 
      WHERE id_destinatario = ?
    `;

    await pool.query(query, [id]);

    return NextResponse.json({ message: "Destinatario eliminado correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar destinatario:", error);
    return NextResponse.json(
      { error: "Error al eliminar el destinatario" },
      { status: 500 }
    );
  }
} 