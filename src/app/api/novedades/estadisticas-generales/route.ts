import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_negocio = searchParams.get('id_negocio');
    const id_unidad = searchParams.get('id_unidad');
    const id_puesto = searchParams.get('id_puesto');
    let desde = searchParams.get('desde');
    let hasta = searchParams.get('hasta');

    // LOG de parámetros recibidos
    console.log('--- Estadísticas Generales ---');
    console.log('id_negocio:', id_negocio, 'id_unidad:', id_unidad, 'id_puesto:', id_puesto, 'desde:', desde, 'hasta:', hasta);

    if (!id_negocio || !desde || !hasta) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (id_negocio, desde, hasta)' }, { status: 400 });
    }

    // Ajustar fechas para incluir todo el rango del día
    if (/^\d{4}-\d{2}-\d{2}$/.test(desde)) {
      desde = `${desde} 00:00:00`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
      hasta = `${hasta} 23:59:59`;
    }

    // Filtros dinámicos
    let where = 'novedades.fecha_hora_novedad BETWEEN ? AND ? AND puestos.id_unidad = unidades_negocio.id_unidad AND unidades_negocio.id_negocio = negocios.id_negocio AND negocios.id_negocio = ?';
    let params: any[] = [desde, hasta, id_negocio];

    if (id_unidad) {
      where += ' AND unidades_negocio.id_unidad = ?';
      params.push(id_unidad);
    }
    if (id_puesto) {
      where += ' AND puestos.id_puesto = ?';
      params.push(id_puesto);
    }

    // Novedades por tipo de evento
    const sqlPorTipo = `SELECT tipos_evento.nombre_tipo_evento as tipo, COUNT(*) as cantidad
       FROM novedades
       JOIN puestos ON novedades.id_puesto = puestos.id_puesto
       JOIN unidades_negocio ON puestos.id_unidad = unidades_negocio.id_unidad
       JOIN negocios ON unidades_negocio.id_negocio = negocios.id_negocio
       JOIN tipos_evento ON novedades.id_tipo_evento = tipos_evento.id_tipo_evento
       WHERE ${where}
       GROUP BY tipos_evento.nombre_tipo_evento
       ORDER BY cantidad DESC`;
    console.log('SQL porTipo:', sqlPorTipo);
    console.log('Params porTipo:', params);
    const [porTipo] = await pool.query(sqlPorTipo, params);
    console.log('Resultado porTipo:', porTipo);

    // Novedades por mes
    const sqlPorMes = `SELECT MONTH(novedades.fecha_hora_novedad) as mes, COUNT(*) as cantidad
       FROM novedades
       JOIN puestos ON novedades.id_puesto = puestos.id_puesto
       JOIN unidades_negocio ON puestos.id_unidad = unidades_negocio.id_unidad
       JOIN negocios ON unidades_negocio.id_negocio = negocios.id_negocio
       WHERE ${where}
       GROUP BY mes
       ORDER BY mes ASC`;
    console.log('SQL porMes:', sqlPorMes);
    console.log('Params porMes:', params);
    const [porMes] = await pool.query(sqlPorMes, params);
    console.log('Resultado porMes:', porMes);

    // Novedades por puesto
    const sqlPorPuesto = `SELECT puestos.nombre_puesto as puesto, COUNT(*) as cantidad
       FROM novedades
       JOIN puestos ON novedades.id_puesto = puestos.id_puesto
       JOIN unidades_negocio ON puestos.id_unidad = unidades_negocio.id_unidad
       JOIN negocios ON unidades_negocio.id_negocio = negocios.id_negocio
       WHERE ${where}
       GROUP BY puestos.nombre_puesto
       ORDER BY cantidad DESC`;
    console.log('SQL porPuesto:', sqlPorPuesto);
    console.log('Params porPuesto:', params);
    const [porPuesto] = await pool.query(sqlPorPuesto, params);
    console.log('Resultado porPuesto:', porPuesto);

    // Novedades por unidad de negocio
    const sqlPorUnidad = `SELECT unidades_negocio.nombre_unidad as unidad, COUNT(*) as cantidad
       FROM novedades
       JOIN puestos ON novedades.id_puesto = puestos.id_puesto
       JOIN unidades_negocio ON puestos.id_unidad = unidades_negocio.id_unidad
       JOIN negocios ON unidades_negocio.id_negocio = negocios.id_negocio
       WHERE ${where}
       GROUP BY unidades_negocio.nombre_unidad
       ORDER BY cantidad DESC`;
    console.log('SQL porUnidad:', sqlPorUnidad);
    console.log('Params porUnidad:', params);
    const [porUnidad] = await pool.query(sqlPorUnidad, params);
    console.log('Resultado porUnidad:', porUnidad);

    // Total novedades y días analizados
    const sqlTotales = `SELECT COUNT(*) as total, DATEDIFF(LEAST(?, MAX(DATE(novedades.fecha_hora_novedad))), GREATEST(?, MIN(DATE(novedades.fecha_hora_novedad)))) + 1 as dias
       FROM novedades
       JOIN puestos ON novedades.id_puesto = puestos.id_puesto
       JOIN unidades_negocio ON puestos.id_unidad = unidades_negocio.id_unidad
       JOIN negocios ON unidades_negocio.id_negocio = negocios.id_negocio
       WHERE ${where}`;
    console.log('SQL totales:', sqlTotales);
    console.log('Params totales:', [hasta, desde, ...params]);
    const [totales] = await pool.query(sqlTotales, [hasta, desde, ...params]);
    console.log('Resultado totales:', totales);

    // Eventos detallados (para modales)
    const sqlEventos = `SELECT novedades.id_novedad, novedades.consecutivo, novedades.fecha_hora_novedad as fecha_novedad, TIME_FORMAT(novedades.fecha_hora_novedad, '%H:%i:%s') as hora_novedad, 
              novedades.descripcion, novedades.gestion, tipos_evento.nombre_tipo_evento as tipo_novedad, 
              unidades_negocio.nombre_unidad as unidad_negocio, negocios.nombre_negocio, puestos.nombre_puesto as puesto,
              GROUP_CONCAT(imagenes_novedades.url_imagen) as archivos
       FROM novedades
       JOIN puestos ON novedades.id_puesto = puestos.id_puesto
       JOIN unidades_negocio ON puestos.id_unidad = unidades_negocio.id_unidad
       JOIN negocios ON unidades_negocio.id_negocio = negocios.id_negocio
       JOIN tipos_evento ON novedades.id_tipo_evento = tipos_evento.id_tipo_evento
       LEFT JOIN imagenes_novedades ON novedades.id_novedad = imagenes_novedades.id_novedad
       WHERE ${where}
       GROUP BY novedades.id_novedad
       ORDER BY novedades.fecha_hora_novedad DESC`;
    console.log('SQL eventos:', sqlEventos);
    console.log('Params eventos:', params);
    const [eventos] = await pool.query(sqlEventos, params);
    console.log('Resultado eventos:', eventos);
    const eventosProcesados = (eventos as any[]).map(evento => ({
      ...evento,
      archivos: evento.archivos ? Array.from(new Set((evento.archivos as string).split(','))).map((url: string) => ({ url_archivo: url })) : []
    }));

    return NextResponse.json({
      porTipo,
      porMes,
      porPuesto,
      porUnidad,
      totales: Array.isArray(totales) ? totales[0] : totales,
      eventos: eventosProcesados
    });
  } catch (error) {
    console.error('Error en estadísticas generales:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas generales' }, { status: 500 });
  }
}