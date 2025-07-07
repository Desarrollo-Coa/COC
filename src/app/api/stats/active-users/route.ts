import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface ActiveUserRow extends RowDataPacket {
  id: number;
  nombre: string;
  rol: string;
  ultima_actividad: string;
}

export async function GET() {
  let connection;
  try {
    connection = await db.getConnection();
    
    // Log para ver la hora actual del servidor
    console.log('Hora actual del servidor:', new Date().toISOString());
    
    const query = `SELECT 
      u.id,
      u.nombre,
      r.nombre as rol,
      us.last_activity as ultima_actividad
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN user_sessions us ON u.id = us.user_id
    WHERE us.last_activity >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ORDER BY us.last_activity DESC`;

    console.log('Ejecutando query:', query);
    
    const [rows] = await connection.execute<ActiveUserRow[]>(query);
    
    // Log para ver los resultados
    console.log('Resultados de la consulta:', JSON.stringify(rows, null, 2));
    
    // Log para verificar la última actividad de todas las sesiones
    const [allSessions] = await connection.execute(
      'SELECT user_id, last_activity FROM user_sessions'
    );
    console.log('Todas las sesiones activas:', JSON.stringify(allSessions, null, 2));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error detallado en active-users:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios activos" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
} 