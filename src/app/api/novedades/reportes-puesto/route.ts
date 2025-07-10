import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id_negocio = searchParams.get('id_negocio')

    if (!id_negocio) {
      return NextResponse.json({ error: "Se requiere el parámetro id_negocio" }, { status: 400 })
    }

    // 1. Eventos por puesto y año (LEFT JOIN para incluir puestos sin eventos)
    const queryPorPuesto = `
      SELECT 
        p.nombre_puesto AS puesto,
        IFNULL(YEAR(n.fecha_hora_novedad), y.anio) AS anio,
        COUNT(n.id_novedad) AS cantidad
      FROM puestos p
      JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
      JOIN negocios ne ON un.id_negocio = ne.id_negocio
      LEFT JOIN (
        SELECT * FROM novedades WHERE YEAR(fecha_hora_novedad) IN (2024, 2025)
      ) n ON n.id_puesto = p.id_puesto
      JOIN (SELECT 2024 as anio UNION SELECT 2025) y
      WHERE ne.id_negocio = ?
        AND (YEAR(n.fecha_hora_novedad) = y.anio OR n.id_novedad IS NULL)
      GROUP BY p.nombre_puesto, y.anio
      ORDER BY p.nombre_puesto, y.anio
    `
    const [porPuesto] = await pool.query(queryPorPuesto, [id_negocio])

    // 2. Eventos por mes y año (todos los meses, aunque no haya eventos)
    const queryPorMes = `
      SELECT 
        y.anio, m.mes, COUNT(n.id_novedad) AS cantidad
      FROM 
        (SELECT 2024 as anio UNION SELECT 2025) y
      CROSS JOIN 
        (SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) m
      LEFT JOIN novedades n ON YEAR(n.fecha_hora_novedad) = y.anio AND MONTH(n.fecha_hora_novedad) = m.mes
      LEFT JOIN puestos p ON n.id_puesto = p.id_puesto
      LEFT JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
      LEFT JOIN negocios ne ON un.id_negocio = ne.id_negocio
      WHERE ne.id_negocio = ? OR ne.id_negocio IS NULL
      GROUP BY y.anio, m.mes
      ORDER BY y.anio, m.mes
    `
    const [porMes] = await pool.query(queryPorMes, [id_negocio])

    // 3. Eventos por tipo y año (todos los tipos, aunque no haya eventos)
    const queryPorTipo = `
      SELECT 
        t.nombre_tipo_evento AS tipo,
        y.anio,
        COUNT(n.id_novedad) AS cantidad
      FROM tipos_evento t
      CROSS JOIN (SELECT 2024 as anio UNION SELECT 2025) y
      LEFT JOIN novedades n ON n.id_tipo_evento = t.id_tipo_evento AND YEAR(n.fecha_hora_novedad) = y.anio
      LEFT JOIN puestos p ON n.id_puesto = p.id_puesto
      LEFT JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
      LEFT JOIN negocios ne ON un.id_negocio = ne.id_negocio
      WHERE ne.id_negocio = ? OR ne.id_negocio IS NULL
      GROUP BY t.nombre_tipo_evento, y.anio
      ORDER BY t.nombre_tipo_evento, y.anio
    `
    const [porTipo] = await pool.query(queryPorTipo, [id_negocio])

    // 4. Totales por año
    const queryTotales = `
      SELECT 
        y.anio, COUNT(n.id_novedad) AS cantidad
      FROM (SELECT 2024 as anio UNION SELECT 2025) y
      LEFT JOIN novedades n ON YEAR(n.fecha_hora_novedad) = y.anio
      LEFT JOIN puestos p ON n.id_puesto = p.id_puesto
      LEFT JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
      LEFT JOIN negocios ne ON un.id_negocio = ne.id_negocio
      WHERE ne.id_negocio = ? OR ne.id_negocio IS NULL
      GROUP BY y.anio
      ORDER BY y.anio
    `
    const [totales] = await pool.query(queryTotales, [id_negocio])

    return NextResponse.json({
      porPuesto,
      porMes,
      porTipo,
      totales
    })
  } catch (error) {
    console.error("Error al obtener reportes por puesto:", error)
    return NextResponse.json({ error: "Error al obtener reportes por puesto" }, { status: 500 })
  }
} 