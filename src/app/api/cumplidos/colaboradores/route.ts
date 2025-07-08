import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET - Obtener todos los colaboradores o buscar por texto (paginado)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const query = "SELECT id, nombre, apellido, cedula, placa, activo, foto_url FROM colaboradores ORDER BY nombre, apellido LIMIT ? OFFSET ?";
    const params = [limit, offset];
    const [colaboradores] = await pool.query(query, params);
    return NextResponse.json(colaboradores);
  } catch (error) {
    console.error("Error al obtener colaboradores:", error);
    return NextResponse.json(
      { error: "Error al obtener colaboradores" },
      { status: 500 }
    );
  }
} 