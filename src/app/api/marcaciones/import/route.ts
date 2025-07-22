import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  
  try {
    const { inserts } = await request.json();

    if (!inserts || !Array.isArray(inserts)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Iniciar transacción
    await connection.beginTransaction();

    try {
      // Extraer los valores de los inserts (ahora son objetos)
      const values = inserts.map((item: any) => [
        item.id_cliente,
        item.id_origen,
        item.punto_marcacion,
        item.fecha,
        item.hora_marcacion,
        item.usuario,
        item.nombre
      ]);

      // Crear una única consulta SQL con múltiples valores
      const query = `
        INSERT INTO puntos_marcacion (id_cliente, id_origen, punto_marcacion, fecha, hora_marcacion, usuario, nombre) 
        VALUES ?
      `;

      // Ejecutar la consulta con todos los valores
      await connection.query(query, [values]);

      // Si todo salió bien, hacer commit
      await connection.commit();

      return NextResponse.json({ 
        message: 'Lote procesado exitosamente',
        registrosProcesados: inserts.length
      });

    } catch (error) {
      // Si hay error, hacer rollback
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error en la importación:', error);
    return NextResponse.json(
      { error: 'Error al procesar el lote de datos' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 