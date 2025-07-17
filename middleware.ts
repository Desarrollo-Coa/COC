import { NextResponse, NextRequest } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  console.log('Middleware ejecutado para:', request.nextUrl.pathname);

  const url = request.nextUrl.pathname;

  // Obtener y verificar el token
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

  // Si es administrador, permitir acceso a todas las rutas
  if (role === 'administrador') {
    return NextResponse.next();
  }

  // Permitir acceso a rutas públicas para usuarios autenticados
  const publicRoutes = ['/users/dashboard', '/users/settings', '/novedades/estadisticas-generales'];
  if (publicRoutes.includes(url)) {
    return NextResponse.next();
  }

  // Verificar permisos para rutas protegidas
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

    return NextResponse.next();
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    return NextResponse.redirect(new URL('/users/dashboard', request.url));
  }
}

export const config = {
  matcher: [
    '/',
    '/usuarios',
    '/users/dashboard',
    '/users/dashboard/:path*',
    '/users/settings/:path*',
    '/settings/:path*',
    '/novedades/:path*',
    '/comunicacion/:path*',
    '/programacion/:path*',
    
  ]
};