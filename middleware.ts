// middleware.ts
import { NextResponse, NextRequest } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  console.log('Middleware ejecutado para:', request.nextUrl.pathname);

  const url = request.nextUrl.pathname;
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
 

  // Verificar si la ruta actual está protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    url === route || url.startsWith(`${route}/`)
  );

  if (isProtectedRoute) {
    console.log('Ruta protegida detectada:', url);

    const token = getTokenFromRequest(request);
    if (!token) {
      console.log('No hay token, redirigiendo a /login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      console.log('Token inválido, redirigiendo a /login');
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }

    // Redirigir según el rol del usuario
    const role = (payload.role as string | undefined)?.toLowerCase() || '';
    console.log('Rol del usuario:', role);

    // Si es administrador, permitir acceso
    if (role === 'administrador') {
      // console.log('Token válido, usuario administrador:', payload);
      return NextResponse.next();
    }

    // Proteger la ruta principal solo para administradores
    if (url === '/' && role !== 'administrador') {
      console.log('Usuario no administrador intentando acceder a /, redirigiendo a /users/dashboard');
      return NextResponse.redirect(new URL('/users/dashboard', request.url));
    }

    // Proteger la ruta de módulos solo para administradores
    if (url.startsWith('/settings/rutas') && role !== 'administrador') {
      console.log('Usuario no administrador intentando acceder a /settings/rutas, redirigiendo a /dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Permitir acceso a /users/dashboard para todos los usuarios no administradores
    if (url === '/users/dashboard') {
      console.log('Acceso permitido a /users/dashboard para usuario no administrador');
      return NextResponse.next();
    }

    // Permitir acceso a /users/settings para todos los usuarios no administradores
    if (url === '/users/settings') {
      console.log('Acceso permitido a /users/settings para usuario no administrador');
      return NextResponse.next();
    }

    // Permitir acceso a /novedades/estadisticas-generales para todos los usuarios autenticados
    if (url === '/novedades/estadisticas-generales') {
      console.log('Acceso permitido a /novedades/estadisticas-generales');
      return NextResponse.next();
    }

    // Para usuarios no administradores, verificar permisos específicos
    try {
      const verifyUrl = new URL('/api/middleware-routes', request.url);
      verifyUrl.searchParams.set('path', url);
      
      const response = await fetch(verifyUrl.toString(), {
        headers: {
          'Cookie': request.headers.get('cookie') || ''
        }
      });

      if (response.status === 403) {
        console.log('Acceso denegado a:', url);
        return NextResponse.redirect(new URL('/users/dashboard', request.url));
      }

      if (response.status !== 200) {
        console.error('Error al verificar permisos:', response.status);
        return NextResponse.redirect(new URL('/users/dashboard', request.url));
      }

      console.log('Token válido, usuario:', payload);
      return NextResponse.next();
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return NextResponse.redirect(new URL('/users/dashboard', request.url));
    }
  }

  console.log('Ruta no protegida, continuando...');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/usuarios/:path*',
    '/coa/:path*',
    '/novedades/:path*',
    '/novedades/estadisticas-generales',
    '/bienestar/admin/:path*',
    '/users/dashboard/:path*',
    '/users/settings/:path*',
    '/cementos/:path*',
    '/settings/rutas/:path*'
  ]
};