import { NextResponse } from "next/server"
import pool from "@/lib/db"

export const revalidate = 0

export async function GET() {
  try {
    // Total de ausencias
    const [totalResult] = await pool.query("SELECT COUNT(*) as total FROM ausencias WHERE activo = TRUE")
    const totalAusencias = (totalResult as any[])[0].total

    // Ausencias este mes
    const [mesResult] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM ausencias 
      WHERE activo = TRUE 
      AND MONTH(fecha_registro) = MONTH(CURRENT_DATE())
      AND YEAR(fecha_registro) = YEAR(CURRENT_DATE())
    `)
    const ausenciasEsteMes = (mesResult as any[])[0].total;

    // Colaboradores afectados
    const [colaboradoresResult] = await pool.query(`
      SELECT COUNT(DISTINCT id_colaborador) as total 
      FROM ausencias 
      WHERE activo = TRUE
    `)
    const colaboradoresAfectados = (colaboradoresResult as any[])[0].total

    // Ausencias por tipo
    const [tiposResult] = await pool.query(`
      SELECT ta.nombre_tipo_ausencia as nombre, COUNT(*) as cantidad,
             ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ausencias WHERE activo = TRUE)), 1) as porcentaje
      FROM ausencias a
      JOIN tipos_ausencia ta ON a.id_tipo_ausencia = ta.id_tipo_ausencia
      WHERE a.activo = TRUE
      GROUP BY ta.id_tipo_ausencia, ta.nombre_tipo_ausencia
      ORDER BY cantidad DESC
    `)

    // Ausencias por negocio
    const [negociosResult] = await pool.query(`
      SELECT ng.nombre_negocio as negocio, COUNT(*) as cantidad
      FROM ausencias a
      JOIN puestos p ON a.id_puesto = p.id_puesto
      JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
      JOIN negocios ng ON un.id_negocio = ng.id_negocio
      WHERE a.activo = TRUE
      GROUP BY ng.id_negocio, ng.nombre_negocio
      ORDER BY cantidad DESC
    `)

    // Colaboradores con más ausencias
    const [colaboradoresTopResult] = await pool.query(`
      SELECT 
        c.nombre, c.apellido, ng.nombre_negocio as negocio,
        SUM(CASE WHEN ta.nombre_tipo_ausencia = 'Enfermedad' THEN 1 ELSE 0 END) as enfermedad,
        SUM(CASE WHEN ta.nombre_tipo_ausencia = 'Incumplimiento de horario' THEN 1 ELSE 0 END) as incumplimiento,
        SUM(CASE WHEN ta.nombre_tipo_ausencia = 'Accidente laboral' THEN 1 ELSE 0 END) as accidente,
        COUNT(*) as total
      FROM ausencias a
      JOIN colaboradores c ON a.id_colaborador = c.id
      JOIN puestos p ON a.id_puesto = p.id_puesto
      JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
      JOIN negocios ng ON un.id_negocio = ng.id_negocio
      JOIN tipos_ausencia ta ON a.id_tipo_ausencia = ta.id_tipo_ausencia
      WHERE a.activo = TRUE
      GROUP BY c.id, c.nombre, c.apellido, ng.nombre_negocio
      ORDER BY total DESC
      LIMIT 10
    `)

    // Tendencia diaria (últimos 7 días)
    const [tendenciaResult] = await pool.query(`
      SELECT 
        DATE(fecha_registro) as dia,
        COUNT(*) as cantidad
      FROM ausencias
      WHERE activo = TRUE 
      AND fecha_registro >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
      GROUP BY DATE(fecha_registro)
      ORDER BY dia ASC
    `)

    // Formatear datos de tendencia
    const tendenciaDiaria = (tendenciaResult as any[]).map((item) => ({
      dia: new Date(item.dia).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      cantidad: item.cantidad,
    }))

    // Tendencia mensual (por mes y año)
    const [tendenciaMensualResult] = await pool.query(`
      SELECT 
        DATE_FORMAT(fecha_registro, '%b %Y') as mes,
        COUNT(*) as cantidad
      FROM ausencias
      WHERE activo = TRUE
      GROUP BY YEAR(fecha_registro), MONTH(fecha_registro), DATE_FORMAT(fecha_registro, '%b %Y')
      ORDER BY YEAR(fecha_registro), MONTH(fecha_registro)
    `);

    const tendenciaMensual = (tendenciaMensualResult as any[]).map((item) => ({
      mes: item.mes,
      cantidad: item.cantidad,
    }));

    const stats = {
      totalAusencias,
      ausenciasEsteMes,
      colaboradoresAfectados,
      tiposAusencia: tiposResult,
      ausenciasPorNegocio: negociosResult,
      colaboradoresConMasAusencias: colaboradoresTopResult,
      tendenciaDiaria,
      tendenciaMensual,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error)
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 })
  }
}