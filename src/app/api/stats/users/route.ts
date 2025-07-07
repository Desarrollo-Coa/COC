import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { jwtVerify } from 'jose';
import { RowDataPacket } from 'mysql2';
import { cookies } from 'next/headers';

interface UserCount extends RowDataPacket {
  total_users: number;
  active_users: number;
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar el token usando jwtVerify
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET || 'tu_clave_secreta_aqui')
    );

    // Obtener total de usuarios registrados y activos
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM user_sessions WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as active_users
    `;
    
    console.log('Query de estadísticas:', query);
    const [result] = await db.query<UserCount[]>(query);
    console.log('Resultados de estadísticas:', JSON.stringify(result, null, 2));

    const totalUsers = result[0].total_users;
    const activeUsers = result[0].active_users;
    const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    console.log('Estadísticas procesadas:', {
      totalUsers,
      activeUsers,
      activePercentage
    });

    return NextResponse.json({
      totalUsers,
      activeUsers,
      activePercentage
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
} 