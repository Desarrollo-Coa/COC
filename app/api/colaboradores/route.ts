import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const revalidate = 0;

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT 
        id,
        cedula,
        placa,
        nombre,
        apellido,
        activo,
        foto_url
      FROM colaboradores
      ORDER BY nombre ASC`
    );
    // Mapear para exponer 'nombres' y 'apellidos' en el JSON
    const colaboradores = (rows as any[]).map(c => ({
      ...c,
      nombres: c.nombre,
      apellidos: c.apellido,
    }));
    return NextResponse.json(colaboradores, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error("Error fetching colaboradores:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request: Request) {
  let connection;
  try {
    const body = await request.json();
    const { cedula, placa, nombres, apellidos, activo, foto_url } = body;
    if (!cedula || !placa || !nombres || !apellidos) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }
    connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO colaboradores (cedula, placa, nombre, apellido, activo, foto_url)
       VALUES (?, ?, ?, ?, ?, ?)` ,
      [cedula, placa, nombres, apellidos, activo !== undefined ? activo : true, foto_url || null]
    );
    return NextResponse.json({ message: 'Colaborador creado exitosamente', id: (result as any).insertId });
  } catch (error) {
    console.error("Error creando colaborador:", error);
    return NextResponse.json({ error: "Error al crear colaborador" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}