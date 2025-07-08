// middleware.ts
import { NextResponse, NextRequest } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  console.log('Middleware ejecutado para:', request.nextUrl.pathname);

  const url = request.nextUrl.pathname;
  // Rutas protegidas exactas
  const protectedRoutes = [
    '/settings',
    '/settings/colaboradores',
    '/settings/negocios',
    '/settings/puestos',
    '/settings/puestos-reportes',
    '/settings/rutas',
    '/settings/tipos-novedades',
    '/settings/unidades-negocio',
    '/users/dashboard',
    '/users/settings',
    '/usuarios',
  ];

  // Verificar si la ruta actual está protegida (exacta o subruta)
  const isProtectedRoute = protectedRoutes.some(route =>
    url === route || url.startsWith(`${route}/`)
  );

  if (isProtectedRoute) {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }

    const role = (payload.role as string | undefined)?.toLowerCase() || '';

    // Solo administradores pueden acceder a /settings/rutas y / (si se protege en el futuro)
    if ((url.startsWith('/settings/rutas') || url === '/') && role !== 'administrador') {
      return NextResponse.redirect(new URL('/users/dashboard', request.url));
    }

    // El resto de rutas protegidas: solo autenticación
    return NextResponse.next();
  }

  // Si no es ruta protegida, continuar
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/settings',
    '/settings/colaboradores',
    '/settings/negocios',
    '/settings/puestos',
    '/settings/puestos-reportes',
    '/settings/rutas',
    '/settings/tipos-novedades',
    '/settings/unidades-negocio',
    '/users/dashboard',
    '/users/settings',
    '/usuarios',
    '/settings/:path*',
    '/users/:path*',
    '/usuarios/:path*',
  ]
};