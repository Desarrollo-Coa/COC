import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const colaboradorId = searchParams.get("colaboradorId");
    const fecha = searchParams.get("fecha");
    const puestoId = searchParams.get("puestoId");

    if (!colaboradorId || !fecha || !puestoId) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    // Traer el cumplido para cualquier turno (incluyendo turno B)
    const [cumplidos] = await pool.query<RowDataPacket[]>(
      `SELECT c.id_cumplido, c.id_colaborador, c.id_tipo_turno, p.nombre_puesto, col.nombre, col.apellido
         FROM cumplidos c
         JOIN puestos p ON c.id_puesto = p.id_puesto
         LEFT JOIN colaboradores col ON c.id_colaborador = col.id
         WHERE c.id_puesto = ? AND c.fecha = ? AND c.id_colaborador = ?`,
      [puestoId, fecha, colaboradorId]
    );

    if (!cumplidos || cumplidos.length === 0) {
      return NextResponse.json({ error: "No existe cumplido para esos datos" }, { status: 404 });
    }

    const cumplido = cumplidos[0];
    const id_cumplido = cumplido.id_cumplido;

    // Traer notas asociadas al cumplido
    const [notas] = await pool.query<RowDataPacket[]>(
      'SELECT nota FROM notas_cumplidos WHERE id_cumplido = ?',
      [id_cumplido]
    );

    // Traer reportes de comunicación asociados al cumplido
    const [reportes] = await pool.query<RowDataPacket[]>(
      'SELECT calificaciones FROM reporte_comunicacion WHERE id_cumplido = ?',
      [id_cumplido]
    );

    // Construir respuesta
    return NextResponse.json({
      id_cumplido,
      colaborador: {
        id: colaboradorId,
        nombre: [cumplido.nombre, cumplido.apellido].filter(Boolean).join(' ')
      },
      puesto: cumplido.nombre_puesto,
      fecha,
      id_tipo_turno: cumplido.id_tipo_turno,
      nota: notas && notas.length > 0 ? notas[0].nota : null,
      reportes: reportes && reportes.length > 0
        ? (typeof reportes[0].calificaciones === "string"
            ? JSON.parse(reportes[0].calificaciones)
            : reportes[0].calificaciones)
        : null
    });
  } catch (error) {
    console.error("Error al obtener reporte por colaborador:", error);
    return NextResponse.json({ error: "Error al obtener reporte por colaborador" }, { status: 500 });
  }
} 