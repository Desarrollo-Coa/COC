import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import ExcelJS from 'exceljs';

function getFechaFormato(fecha: string | Date) {
  const d = new Date(fecha);
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { negocioId, tipo, fechaInicio, fechaFin, fechaDia, nombreZona } = body;
    const id_negocio = negocioId;
    const nombreNegocio = nombreZona;
    if (!id_negocio || !tipo || !nombreNegocio) {
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
      // Obtener cumplidos de la zona para la fecha
      const [cumplidos] = await pool.query(`
        SELECT 
          c.*, 
          p.nombre_puesto, 
          u.nombre_unidad,
          CONCAT_WS(' ', col.nombre, col.apellido) AS colaborador_nombre_completo
        FROM cumplidos c
        JOIN puestos p ON c.id_puesto = p.id_puesto
        JOIN unidades_negocio u ON p.id_unidad = u.id_unidad
        LEFT JOIN colaboradores col ON c.id_colaborador = col.id
        WHERE c.fecha = ? AND u.id_negocio = ?
      `, [fecha, parseInt(id_negocio)]);
      // Obtener notas de los cumplidos de este día
      const cumplidosArray = Array.isArray(cumplidos) ? cumplidos : [cumplidos];
      const soloCumplidos = cumplidosArray.filter((c: any) => c && typeof c === 'object' && 'id_cumplido' in c);
      let notasMap: Record<number, string> = {};
      if (soloCumplidos.length > 0) {
        const ids = soloCumplidos.map((c: any) => c.id_cumplido);
        if (ids.length > 0) {
          const [notas] = await pool.query(
            `SELECT id_cumplido, nota FROM notas_cumplidos WHERE id_cumplido IN (${ids.map(() => '?').join(',')})`,
            ids
          );
          if (Array.isArray(notas)) {
            notas.forEach((n: any) => {
              notasMap[n.id_cumplido] = n.nota;
            });
          }
        }
      }
      if (!soloCumplidos || soloCumplidos.length === 0) {
        diasSinDatos.push(fecha);
        continue;
      }
      // Agrupar solo por unidad de negocio y separar por turno
      const unidades: Record<string, any[]> = {};
      soloCumplidos.forEach((c: any) => {
        if (!unidades[c.nombre_unidad]) unidades[c.nombre_unidad] = [];
        unidades[c.nombre_unidad].push(c);
      });
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
      const diurno = getPorTurno(1);
      const nocturno = getPorTurno(2);
      // Crear hoja
      const sheet = workbook.addWorksheet(fecha);
      hojasConDatos++;
      // Encabezados grandes
      sheet.mergeCells('A1', 'C1');
      sheet.mergeCells('E1', 'G1');
      sheet.getCell('A1').value = `CUMPLIDO TURNO DIURNO ${String(nombreNegocio).toUpperCase()}`;
      sheet.getCell('E1').value = `CUMPLIDO TURNO NOCTURNO ${String(nombreNegocio).toUpperCase()}`;
      ['A1','E1'].forEach(cell => {
        sheet.getCell(cell).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '002060' }
        };
        sheet.getCell(cell).font = { color: { argb: 'FFFFFF' }, bold: true, size: 13 };
        sheet.getCell(cell).alignment = { vertical: 'middle', horizontal: 'center' };
      });
      // Sub-encabezados
      sheet.mergeCells('A2', 'C2');
      sheet.mergeCells('E2', 'G2');
      sheet.getCell('A2').value = '';
      sheet.getCell('E2').value = '';
      ['A2','E2'].forEach(cell => {
        sheet.getCell(cell).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '002060' }
        };
        sheet.getCell(cell).font = { color: { argb: 'FFFFFF' }, bold: true };
        sheet.getCell(cell).alignment = { vertical: 'middle', horizontal: 'center' };
      });
      // Columnas
      sheet.getCell('A3').value = 'UNIDAD DE NEGOCIO';
      sheet.getCell('B3').value = 'PUESTO';
      sheet.getCell('C3').value = 'COLABORADOR DIURNO';
      sheet.getCell('E3').value = 'UNIDAD DE NEGOCIO';
      sheet.getCell('F3').value = 'PUESTO';
      sheet.getCell('G3').value = 'COLABORADOR NOCTURNO';
      ['A3','B3','C3','E3','F3','G3'].forEach(cell => {
        sheet.getCell(cell).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '002060' }
        };
        sheet.getCell(cell).font = { color: { argb: 'FFFFFF' }, bold: true };
        sheet.getCell(cell).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        sheet.getCell(cell).border = { bottom: { style: 'thin' }, right: { style: 'thin' }, left: { style: 'thin' }, top: { style: 'thin' } };
      });
      // Filas de datos agrupadas por unidad de negocio
      let row = 4;
      // Agrupar por unidad de negocio para diurno y nocturno
      const diurnoUnidades = Object.entries(diurno);
      const nocturnoUnidades = Object.entries(nocturno);
      // Calcular el máximo de filas para alinear ambas secciones
      const maxRows = Math.max(
        diurnoUnidades.reduce((acc, [_, arr]) => acc + arr.length, 0),
        nocturnoUnidades.reduce((acc, [_, arr]) => acc + arr.length, 0)
      );
      // Construir filas agrupadas para diurno
      let diurnoRows: any[] = [];
      diurnoUnidades.forEach(([unidad, arr]) => {
        arr.forEach((c: any, idx: number) => {
          diurnoRows.push({
            unidad,
            puesto: c.nombre_puesto,
            colaborador: c.colaborador_nombre_completo,
            id_cumplido: c.id_cumplido,
            merge: idx === 0 ? arr.length : 0
          });
        });
      });
      // Construir filas agrupadas para nocturno
      let nocturnoRows: any[] = [];
      nocturnoUnidades.forEach(([unidad, arr]) => {
        arr.forEach((c: any, idx: number) => {
          nocturnoRows.push({
            unidad,
            puesto: c.nombre_puesto,
            colaborador: c.colaborador_nombre_completo,
            id_cumplido: c.id_cumplido,
            merge: idx === 0 ? arr.length : 0
          });
        });
      });
      // Alinear ambas secciones
      const maxDataRows = Math.max(diurnoRows.length, nocturnoRows.length);
      for (let i = 0; i < maxDataRows; i++) {
        const diurnoData = diurnoRows[i] || { unidad: '', puesto: '', colaborador: '', id_cumplido: null, merge: 0 };
        const nocturnoData = nocturnoRows[i] || { unidad: '', puesto: '', colaborador: '', id_cumplido: null, merge: 0 };
        // Diurno
        if (diurnoData.merge > 0) {
          sheet.mergeCells(`A${row}:A${row + diurnoData.merge - 1}`);
          sheet.getCell(`A${row}`).value = diurnoData.unidad;
          sheet.getCell(`A${row}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
        sheet.getCell(`B${row}`).value = diurnoData.puesto;
        sheet.getCell(`C${row}`).value = diurnoData.colaborador;
        // Si hay nota, poner fondo rojo y comentario
        if (diurnoData.id_cumplido && notasMap[diurnoData.id_cumplido]) {
          sheet.getCell(`C${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } };
          sheet.getCell(`C${row}`).note = notasMap[diurnoData.id_cumplido];
        }
        // Nocturno
        if (nocturnoData.merge > 0) {
          sheet.mergeCells(`E${row}:E${row + nocturnoData.merge - 1}`);
          sheet.getCell(`E${row}`).value = nocturnoData.unidad;
          sheet.getCell(`E${row}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
        sheet.getCell(`F${row}`).value = nocturnoData.puesto;
        sheet.getCell(`G${row}`).value = nocturnoData.colaborador;
        // Si hay nota, poner fondo rojo y comentario
        if (nocturnoData.id_cumplido && notasMap[nocturnoData.id_cumplido]) {
          sheet.getCell(`G${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } };
          sheet.getCell(`G${row}`).note = notasMap[nocturnoData.id_cumplido];
        }
        // Estilo filas alternas
        const fillColor = i % 2 === 0 ? 'FFFFFF' : 'F2F2F2';
        ['A','B','C','E','F','G'].forEach(col => {
          // No sobrescribir fondo rojo si hay nota
          if (!((col === 'C' && diurnoData.id_cumplido && notasMap[diurnoData.id_cumplido]) || (col === 'G' && nocturnoData.id_cumplido && notasMap[nocturnoData.id_cumplido]))) {
            const cell = sheet.getCell(`${col}${row}`);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
          }
          const cell = sheet.getCell(`${col}${row}`);
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          cell.border = { bottom: { style: 'thin' }, right: { style: 'thin' }, left: { style: 'thin' }, top: { style: 'thin' } };
        });
        row++;
      }
      // Pie de página solo con la fecha
      sheet.mergeCells(`A${row}:G${row}`);
      // Formatear la fecha de la hoja a DD-MM-YYYY
      const [yyyy, mm, dd] = fecha.split('-');
      sheet.getCell(`A${row}`).value = `${dd}-${mm}-${yyyy}`;
      sheet.getCell(`A${row}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '002060' }
      };
      sheet.getCell(`A${row}`).font = { color: { argb: 'FFFFFF' }, bold: true };
      sheet.getCell(`A${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
      // Ajustar ancho
      sheet.columns = [
        { width: 25 },
        { width: 15 },
        { width: 30 },
        { width: 2 }, // espacio
        { width: 25 },
        { width: 15 },
        { width: 30 }
      ];
    }
    // Generar buffer
    if (hojasConDatos === 0) {
      return NextResponse.json({ error: tipo === 'global' ? 'No hay datos para ningún día del rango seleccionado.' : 'No hay datos para el día seleccionado.' }, { status: 404 });
    }
    const buffer = await workbook.xlsx.writeBuffer();
    // Nombre archivo
    let filename = '';
    if (tipo === 'global') {
      filename = `${nombreNegocio}_${fechas[0]}_a_${fechas[fechas.length-1]}.xlsx`;
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