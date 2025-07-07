import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import ExcelJS from 'exceljs';

function getFechaFormato(fecha: string | Date) {
  const d = new Date(fecha);
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
}

async function getConfiguracion(negocioId: string, fecha: string) {
  const [rows] = await pool.query(
    'SELECT cantidad_diurno, cantidad_nocturno FROM configuracion_reportes_comunicacion WHERE id_negocio = ? AND fecha_inicial <= ? ORDER BY fecha_inicial DESC LIMIT 1',
    [negocioId, fecha]
  );
  const config = Array.isArray(rows) && rows.length > 0 ? rows[0] : { cantidad_diurno: 0, cantidad_nocturno: 0 };
  return config as { cantidad_diurno: number; cantidad_nocturno: number };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { negocioId, tipo, fechaInicio, fechaFin, fechaDia, nombreNegocio } = body;
    if (!negocioId || !tipo || !nombreNegocio) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    let fechas: string[] = [];
    if (tipo === 'global') {
      if (!fechaInicio || !fechaFin) {
        return NextResponse.json({ error: 'Faltan fechas para descarga global' }, { status: 400 });
      }
      const start = new Date(fechaInicio);
      const end = new Date(fechaFin);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        fechas.push(new Date(d).toISOString().split('T')[0]);
      }
    } else if (tipo === 'dia') {
      if (!fechaDia) {
        return NextResponse.json({ error: 'Falta fecha para descarga de día' }, { status: 400 });
      }
      fechas = [new Date(fechaDia).toISOString().split('T')[0]];
    } else {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    const workbook = new ExcelJS.Workbook();
    const diasSinDatos: string[] = [];
    let hojasConDatos = 0;

    for (const fecha of [...fechas].reverse()) {
      // Obtener configuración para la fecha
      const { cantidad_diurno, cantidad_nocturno } = await getConfiguracion(negocioId, fecha);

      // Obtener datos de la API de reporte de comunicación
      const [cumplidosRows] = await pool.query(
        `SELECT c.*, p.*, u.* FROM cumplidos c
         JOIN puestos p ON c.id_puesto = p.id_puesto
         JOIN unidades_negocio u ON p.id_unidad = u.id_unidad
         WHERE c.fecha = ? AND u.id_negocio = ?`,
        [fecha, parseInt(negocioId)]
      ) as any[];
      const cumplidosArray = Array.isArray(cumplidosRows) ? cumplidosRows : [cumplidosRows];
      if (!cumplidosArray || cumplidosArray.length === 0) {
        diasSinDatos.push(fecha);
        continue;
      }

      // Obtener reportes de comunicación
      const idsCumplido = cumplidosArray.map((c: any) => c.id_cumplido);
      let reportes: any[] = [];
      if (idsCumplido.length > 0) {
        const [reportesRows] = await pool.query(
          `SELECT id_cumplido, calificaciones FROM reporte_comunicacion WHERE id_cumplido IN (${idsCumplido.map(() => '?').join(',')})`,
          idsCumplido
        );
        reportes = (reportesRows as any[]).map((r: any) => {
          let calificacionesProcesadas;
          try {
            calificacionesProcesadas = typeof r.calificaciones === 'string'
              ? JSON.parse(r.calificaciones)
              : (r.calificaciones || {});
          } catch (e) {
            calificacionesProcesadas = {};
          }
          return {
            id_cumplido: r.id_cumplido,
            calificaciones: calificacionesProcesadas,
          };
        });
      }

      // Agrupar por unidad de negocio y puesto
      const unidades: Record<string, any[]> = {};
      cumplidosArray.forEach((c: any) => {
        if (!unidades[c.nombre_unidad]) unidades[c.nombre_unidad] = [];
        unidades[c.nombre_unidad].push(c);
      });

      // Función para separar por turno
      const getPorTurno = (turno: number) => {
        const res: Record<string, any[]> = {};
        for (const unidad in unidades) {
          const filtrados = unidades[unidad].filter((c) => c.id_tipo_turno === turno);
          if (filtrados.length) {
            res[unidad] = filtrados;
          }
        }
        return res;
      };
      const diuo = getPorTurno(1);
      const nocturno = getPorTurno(2);

      // Determinar todas las claves de reportes (R1, R2, ...), diurno y nocturno, y sus horas
      let clavesDiurno: string[] = [];
      let clavesNocturno: string[] = [];
      let horasDiurno: string[] = [];
      let horasNocturno: string[] = [];
      for (const r of reportes) {
        const cal = r.calificaciones || {};
        const tipoTurno = (cumplidosArray.find((c: any) => c.id_cumplido === r.id_cumplido) as { id_tipo_turno?: number } | undefined)?.id_tipo_turno;
        for (const key of Object.keys(cal)) {
          for (const hora of Object.keys(cal[key])) {
            if (tipoTurno === 1) {
              if (!clavesDiurno.includes(key)) clavesDiurno.push(key);
              if (!horasDiurno.includes(hora)) horasDiurno.push(hora);
            } else {
              if (!clavesNocturno.includes(key)) clavesNocturno.push(key);
              if (!horasNocturno.includes(hora)) horasNocturno.push(hora);
            }
          }
        }
      }
      clavesDiurno.sort();
      clavesNocturno.sort();
      horasDiurno.sort();
      horasNocturno.sort();

      // Asegurar que las claves coincidan con la configuración
      clavesDiurno = Array.from({ length: cantidad_diurno }, (_, i) => `R${i + 1}`);
      clavesNocturno = Array.from({ length: cantidad_nocturno }, (_, i) => `R${i + 1}`);
      if (horasDiurno.length < cantidad_diurno) {
        horasDiurno = [...horasDiurno, ...Array(cantidad_diurno - horasDiurno.length).fill('')];
      }
      if (horasNocturno.length < cantidad_nocturno) {
        horasNocturno = [...horasNocturno, ...Array(cantidad_nocturno - horasNocturno.length).fill('')];
      }

      // Crear hoja
      const sheet = workbook.addWorksheet(fecha);
      hojasConDatos++;

      // Encabezado azul corporativo
      const totalCols = 5 + clavesDiurno.length + clavesNocturno.length;
      sheet.mergeCells(1, 1, 1, totalCols); // Merge toda la fila para el título
      sheet.getCell(1, 1).value = `REPORTE DE COMUNICACION ${String(nombreNegocio).toUpperCase()}`;
      sheet.getCell(1, 1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '002060' }
      };
      sheet.getCell(1, 1).font = { color: { argb: 'FFFFFF' }, bold: true, size: 16 };
      sheet.getCell(1, 1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Fecha grande
      sheet.mergeCells(2, 1, 2, totalCols); // Merge toda la fila para la fecha
      // Mostrar la fecha de la hoja en formato DD-MM-YYYY
      const [yyyy, mm, dd] = fecha.split('-');
      sheet.getCell(2, 1).value = `${dd}-${mm}-${yyyy}`;
      sheet.getCell(2, 1).font = { bold: true, size: 13 };
      sheet.getCell(2, 1).alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getCell(2, 1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '002060' }
      };
      sheet.getCell(2, 1).font = { color: { argb: 'FFFFFF' }, bold: true, size: 13 };

      // Subencabezados
      // Encabezados fijos en la fila 3 (combinados con la fila 4)
      const encabezadosPrincipales = [
        'UNIDAD DE NEGOCIO',
        'PUESTO',
        'COLABORADOR DIURNO',
        'COLABORADOR NOCTURNO',
        'NIVEL DE COMUNICACIÓN'
      ];
      for (let c = 1; c <= encabezadosPrincipales.length; c++) {
        sheet.mergeCells(3, c, 4, c);
        sheet.getCell(3, c).value = encabezadosPrincipales[c - 1];
        sheet.getCell(3, c).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        sheet.getCell(3, c).font = { color: { argb: 'FFFFFF' }, bold: true };
        sheet.getCell(3, c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '002060' }
        };
        sheet.getCell(3, c).border = { bottom: { style: 'thin' }, right: { style: 'thin' }, left: { style: 'thin' }, top: { style: 'thin' } };
      }
      // Encabezados de reportes en la fila 4
      let col = encabezadosPrincipales.length + 1;
      const diurnoStartCol = col;
      for (let i = 0; i < clavesDiurno.length; i++) {
        const hora = horasDiurno[i] || '';
        sheet.getCell(4, col++).value = hora ? hora : '';
      }
      const diurnoEndCol = col - 1;
      const nocturnoStartCol = col;
      for (let i = 0; i < clavesNocturno.length; i++) {
        const hora = horasNocturno[i] || '';
        sheet.getCell(4, col++).value = hora ? hora : '';
      }
      const nocturnoEndCol = col - 1;

      // Fila superior para Turno Diurno y Turno Nocturno
      if (clavesDiurno.length > 0) {
        if (diurnoEndCol >= diurnoStartCol) {
          sheet.mergeCells(3, diurnoStartCol, 3, diurnoEndCol);
          sheet.getCell(3, diurnoStartCol).value = 'Turno Diurno';
          sheet.getCell(3, diurnoStartCol).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
      }
      if (clavesNocturno.length > 0) {
        if (nocturnoEndCol >= nocturnoStartCol) {
          sheet.mergeCells(3, nocturnoStartCol, 3, nocturnoEndCol);
          sheet.getCell(3, nocturnoStartCol).value = 'Turno Nocturno';
          sheet.getCell(3, nocturnoStartCol).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
      }
      // Estilo encabezados de reportes
      for (let c = 6; c <= totalCols; c++) {
        sheet.getCell(4, c).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        sheet.getCell(4, c).font = { color: { argb: 'FFFFFF' }, bold: true };
        sheet.getCell(4, c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '002060' }
        };
        sheet.getCell(4, c).border = { bottom: { style: 'thin' }, right: { style: 'thin' }, left: { style: 'thin' }, top: { style: 'thin' } };
      }
      // Bordes y fondo para fila de Turno Diurno/Nocturno
      for (let c = 6; c <= totalCols; c++) {
        sheet.getCell(3, c).border = { bottom: { style: 'thin' }, right: { style: 'thin' }, left: { style: 'thin' }, top: { style: 'thin' } };
        sheet.getCell(3, c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '002060' }
        };
        sheet.getCell(3, c).font = { color: { argb: 'FFFFFF' }, bold: true };
      }

      // Nuevo ciclo agrupando por unidad de negocio
      let row = 5;
      for (const unidad of Object.keys(unidades)) {
        const puestosDiurno = diuo[unidad] || [];
        const puestosNocturno = nocturno[unidad] || [];
        const maxPuestos = Math.max(puestosDiurno.length, puestosNocturno.length);
        const startRow = row;
        for (let i = 0; i < maxPuestos; i++) {
          let col = 1;
          if (i === 0) {
            sheet.getCell(row, col).value = unidad;
          }
          col++;
          const diurnoData = puestosDiurno[i] || { nombre_puesto: '', colaborador: '', id_cumplido: null };
          const nocturnoData = puestosNocturno[i] || { nombre_puesto: '', colaborador: '', id_cumplido: null };
          sheet.getCell(row, col++).value = diurnoData.nombre_puesto || nocturnoData.nombre_puesto || '';
          sheet.getCell(row, col++).value = diurnoData.colaborador || '';
          sheet.getCell(row, col++).value = nocturnoData.colaborador || '';

          // Calcular nivel de comunicación
          let puntajes = [];
          if (diurnoData.id_cumplido) {
            const reporte = reportes.find((r) => r.id_cumplido === diurnoData.id_cumplido);
            if (reporte && reporte.calificaciones) {
              for (const key of Object.keys(reporte.calificaciones)) {
                for (const hora of Object.keys(reporte.calificaciones[key])) {
                  const val = reporte.calificaciones[key][hora];
                  if (val && typeof val === 'object' && 'valor' in val) {
                    if (typeof val.valor === 'number') puntajes.push(val.valor);
                  } else if (typeof val === 'number') {
                    puntajes.push(val);
                  }
                }
              }
            }
          }
          if (nocturnoData.id_cumplido) {
            const reporte = reportes.find((r) => r.id_cumplido === nocturnoData.id_cumplido);
            if (reporte && reporte.calificaciones) {
              for (const key of Object.keys(reporte.calificaciones)) {
                for (const hora of Object.keys(reporte.calificaciones[key])) {
                  const val = reporte.calificaciones[key][hora];
                  if (val && typeof val === 'object' && 'valor' in val) {
                    if (typeof val.valor === 'number') puntajes.push(val.valor);
                  } else if (typeof val === 'number') {
                    puntajes.push(val);
                  }
                }
              }
            }
          }
          const nivelCom = puntajes.length > 0 ? `${Math.round((puntajes.reduce((a, b) => a + b, 0) / puntajes.length) * 10)}%` : '';
          sheet.getCell(row, col++).value = nivelCom;

          // Reportes diurnos
          for (const k of clavesDiurno) {
            let valor = '';
            let nota = '';
            if (diurnoData.id_cumplido) {
              const reporte = reportes.find((r) => r.id_cumplido === diurnoData.id_cumplido);
              if (reporte && reporte.calificaciones && reporte.calificaciones[k]) {
                const horas = Object.keys(reporte.calificaciones[k]);
                if (horas.length > 0) {
                  const hora = horas[0];
                  const val = reporte.calificaciones[k][hora];
                  if (val && typeof val === 'object' && 'valor' in val) {
                    valor = val.valor;
                    nota = val.nota;
                  } else {
                    valor = val;
                  }
                }
              }
            }
            const cell = sheet.getCell(row, col++);
            cell.value = valor;
            if (nota && nota.length > 0) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCC' } };
              cell.note = nota;
            }
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.border = { bottom: { style: 'thin' }, right: { style: 'thin' }, left: { style: 'thin' }, top: { style: 'thin' } };
          }

          // Reportes nocturnos
          for (const k of clavesNocturno) {
            let valor = '';
            let nota = '';
            if (nocturnoData.id_cumplido) {
              const reporte = reportes.find((r) => r.id_cumplido === nocturnoData.id_cumplido);
              if (reporte && reporte.calificaciones && reporte.calificaciones[k]) {
                const horas = Object.keys(reporte.calificaciones[k]);
                if (horas.length > 0) {
                  const hora = horas[0];
                  const val = reporte.calificaciones[k][hora];
                  if (val && typeof val === 'object' && 'valor' in val) {
                    valor = val.valor;
                    nota = val.nota;
                  } else {
                    valor = val;
                  }
                }
              }
            }
            const cell = sheet.getCell(row, col++);
            cell.value = valor;
            if (nota && nota.length > 0) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCC' } };
              cell.note = nota;
            }
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.border = { bottom: { style: 'thin' }, right: { style: 'thin' }, left: { style: 'thin' }, top: { style: 'thin' } };
          }

          // Estilo filas alternas y bordes
          const fillColor = row % 2 === 0 ? 'FFFFFF' : 'F2F2F2';
          for (let cIdx = 1; cIdx <= totalCols; cIdx++) {
            const cell = sheet.getCell(row, cIdx);
            if (!cell.fill || (cell.fill && (cell.fill as any).fgColor?.argb !== 'FFCCCC')) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
            }
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.border = { bottom: { style: 'thin' }, right: { style: 'thin' }, left: { style: 'thin' }, top: { style: 'thin' } };
          }
          row++;
        }
        // Hacer merge de la celda de unidad de negocio para este grupo
        if (maxPuestos > 1) {
          sheet.mergeCells(startRow, 1, row - 1, 1);
          sheet.getCell(startRow, 1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
      }
      // Ajustar ancho de columnas
      sheet.columns = [
        { width: 25 }, // Unidad de negocio
        { width: 20 }, // Puesto
        { width: 25 }, // Colaborador diurno
        { width: 25 }, // Colaborador nocturno
        { width: 18 }, // Nivel comunicación
        ...clavesDiurno.map(() => ({ width: 13 })),
        ...clavesNocturno.map(() => ({ width: 13 })),
      ];
    }

    // Generar buffer
    if (hojasConDatos === 0) {
      return NextResponse.json({ error: tipo === 'global' ? 'No hay datos para ningún día del rango seleccionado.' : 'No hay datos para el día seleccionado.' }, { status: 404 });
    }
    const buffer = await workbook.xlsx.writeBuffer();
    let filename = '';
    if (tipo === 'global') {
      filename = `${nombreNegocio}_${fechas[0]}_a_${fechas[fechas.length - 1]}.xlsx`;
    } else {
      filename = `${nombreNegocio}_${fechas[0]}.xlsx`;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    };
    if (diasSinDatos.length > 0) {
      headers['X-No-Data-Days'] = diasSinDatos.join(',');
    }
    return new Response(buffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error generando Excel:', error);
    return NextResponse.json({ error: 'Error generando Excel' }, { status: 500 });
  }
}