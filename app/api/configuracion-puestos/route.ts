import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const negocioId = searchParams.get('negocioId');

    if (!negocioId) {
      return NextResponse.json({ error: 'Negocio ID es requerido' }, { status: 400 });
    }

    const [puestos] = await pool.query(`
      SELECT p.*, u.nombre_unidad 
      FROM puestos p
      JOIN unidades_negocio u ON p.id_unidad = u.id_unidad
      WHERE u.id_negocio = ?
      ORDER BY u.nombre_unidad, p.nombre_puesto
    `, [negocioId]);

    return NextResponse.json(puestos);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener los puestos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre_puesto, id_unidad } = body;

    if (!nombre_puesto || !id_unidad) {
      return NextResponse.json({ error: 'Nombre del puesto y unidad son requeridos' }, { status: 400 });
    }

    const [result] = await pool.query(
      'INSERT INTO puestos (nombre_puesto, id_unidad) VALUES (?, ?)',
      [nombre_puesto, id_unidad]
    );

    return NextResponse.json({ id: (result as any).insertId, nombre_puesto, id_unidad });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al crear el puesto' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id_puesto, nombre_puesto, id_unidad, activo, fecha_inicial } = body;

    if (!id_puesto) {
      return NextResponse.json({ error: 'ID del puesto es requerido' }, { status: 400 });
    }

    // Construir la consulta dinámicamente según los campos presentes
    let query = 'UPDATE puestos SET nombre_puesto = ?, id_unidad = ?';
    const params: any[] = [nombre_puesto, id_unidad];

    if (typeof activo === 'boolean' || typeof activo === 'number') {
      query += ', activo = ?';
      params.push(activo);
    }
    if (typeof fecha_inicial === 'string' && fecha_inicial.length > 0) {
      query += ', fecha_inicial = ?';
      params.push(fecha_inicial);
    }
    query += ' WHERE id_puesto = ?';
    params.push(id_puesto);

    await pool.query(query, params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al actualizar el puesto' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idPuesto = searchParams.get('idPuesto');

    if (!idPuesto) {
      return NextResponse.json({ error: 'ID del puesto es requerido' }, { status: 400 });
    }

    // Verificar si el puesto tiene registros asociados
    const [registros] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM cumplidos WHERE id_puesto = ?',
      [idPuesto]
    );

    if (registros[0].count > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el puesto porque tiene registros asociados' },
        { status: 400 }
      );
    }

    await pool.query('DELETE FROM puestos WHERE id_puesto = ?', [idPuesto]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al eliminar el puesto' }, { status: 500 });
  }
} 