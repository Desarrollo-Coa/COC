// app/api/middleware-routes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface Module extends RowDataPacket {
  ruta: string;
  acepta_subrutas: boolean;
}

// Función para normalizar rutas
function normalizePath(path: string): string {
  return path.replace(/\/+/g, '/').replace(/\/$/, '');
}

async function getUserModules(userId: number) {
  const [modules] = await pool.query<Module[]>(
    `SELECT m.ruta, m.acepta_subrutas
     FROM modulos m
     INNER JOIN usuarios_modulos um ON m.id = um.modulo_id
     WHERE um.user_id = ? AND um.permitido = TRUE AND m.activo = TRUE`,
    [userId]
  );
  return modules.map(module => ({
    ...module,
    ruta: normalizePath(module.ruta)
  }));
}

export async function GET(request: NextRequest) {
  // Obtener la ruta del parámetro de búsqueda
  const requestedPath = request.nextUrl.searchParams.get('path');
  console.log('Verificando acceso para ruta:', requestedPath);

  if (!requestedPath) {
    console.error('No se proporcionó una ruta en los parámetros');
    return new NextResponse(null, { status: 403 });
  }

  const url = normalizePath(requestedPath);
  console.log('Ruta normalizada:', url);

  const token = getTokenFromRequest(request);
  if (!token) {
    return new NextResponse(null, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return new NextResponse(null, { status: 401 });
  }

  // Si es administrador, permitir acceso
  const role = (payload.role as string | undefined)?.toLowerCase() || '';
  if (role === 'administrador') {
    return new NextResponse(null, { status: 200 });
  }

  // Si la ruta es / o /users/dashboard, permitir acceso
  if (url === '/' || url === '/users/dashboard') {
    return new NextResponse(null, { status: 200 });
  }

  // Obtener módulos asignados al usuario
  const userId = payload.id as number;
  const modules = await getUserModules(userId);

  console.log('Módulos asignados:', modules);

  // Verificar si la ruta actual está permitida
  const isAllowed = modules.some((module) => {
    const modulePath = module.ruta;
    const acceptsSubroutes = module.acepta_subrutas;

    // Si la ruta coincide exactamente
    if (url === modulePath) {
      console.log('Ruta coincide exactamente:', modulePath);
      return true;
    }

    // Si la ruta es una subruta y se permiten subrutas
    if (acceptsSubroutes && url.startsWith(modulePath + '/')) {
      console.log('Ruta es subruta permitida de:', modulePath);
      return true;
    }

    return false;
  });

  if (!isAllowed) {
    console.log('Acceso denegado a:', url);
    console.log('Rutas permitidas:', modules.map(m => m.ruta));
    return new NextResponse(null, { status: 403 });
  }

  console.log('Acceso permitido a:', url);
  return new NextResponse(null, { status: 200 });
} 