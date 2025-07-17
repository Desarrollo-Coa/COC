import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { RowDataPacket } from 'mysql2'

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id_negocio, nombre_negocio FROM negocios ORDER BY nombre_negocio ASC"
    )
    console.log('Negocios encontrados:', rows.length);
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener negocios:", error)
    return NextResponse.json({ error: "Error al obtener negocios" }, { status: 500 })
  }
} 