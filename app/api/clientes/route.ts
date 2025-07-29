import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Listar clientes
export async function GET() {
  try {
    const [rows] = await pool.query('SELECT id_cliente, nombre_cliente FROM cliente ORDER BY id_cliente ASC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

// POST: Crear cliente
export async function POST(req: NextRequest) {
  try {
    const { nombre_cliente } = await req.json();
    if (!nombre_cliente) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    }
    const [result] = await pool.query('INSERT INTO cliente (nombre_cliente) VALUES (?)', [nombre_cliente]);
    return NextResponse.json({ id_cliente: (result as any).insertId, nombre_cliente }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 });
  }
}

// PUT: Editar cliente
export async function PUT(req: NextRequest) {
  try {
    const { id_cliente, nombre_cliente } = await req.json();
    if (!id_cliente || !nombre_cliente) {
      return NextResponse.json({ error: 'ID y nombre requeridos' }, { status: 400 });
    }
    await pool.query('UPDATE cliente SET nombre_cliente = ? WHERE id_cliente = ?', [nombre_cliente, id_cliente]);
    return NextResponse.json({ id_cliente, nombre_cliente });
  } catch (error) {
    return NextResponse.json({ error: 'Error al editar cliente' }, { status: 500 });
  }
}

// DELETE: Eliminar cliente solo si no tiene puntos asociados
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id_cliente = searchParams.get('id_cliente');
    if (!id_cliente) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    // Verificar si tiene puntos de marcación asociados
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM puntos_marcacion WHERE id_cliente = ?', [id_cliente]);
    const total = (rows as any)[0]?.total || 0;
    if (total > 0) {
      return NextResponse.json({ error: 'No se puede eliminar: el cliente tiene puntos de marcación asociados.' }, { status: 409 });
    }
    await pool.query('DELETE FROM cliente WHERE id_cliente = ?', [id_cliente]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 });
  }
} 