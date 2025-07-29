import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { 
  isPublicRoute, 
  isAuthenticatedRoute, 
  getRouteConfig, 
  hasRoutePermission,
  normalizePath 
} from '@/lib/route-config';

// Función para verificar permisos de módulos desde la base de datos
async function checkModulePermissions(userId: number, path: string, token: string): Promise<boolean> {
  try {
    // Para rutas de API, permitir acceso si el usuario está autenticado
    // La verificación específica se hará en cada endpoint
    if (path.startsWith('/api/')) {
      return true;
    }
    
    // Para rutas de páginas, verificar en la base de datos usando el endpoint middleware-routes
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/middleware-routes?path=${encodeURIComponent(path)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Error verificando permisos de módulos:', error);
    // En caso de error, permitir acceso para evitar bloqueos
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const normalizedPath = normalizePath(pathname);

  console.log('=== [MIDDLEWARE] ===');
  console.log('Ruta solicitada:', normalizedPath);

  // Permitir archivos estáticos sin verificación
  if (
    normalizedPath.startsWith('/_next/') ||
    normalizedPath.startsWith('/public/') ||
    normalizedPath.startsWith('/img/') ||
    normalizedPath.startsWith('/api/webhooks/') ||
    normalizedPath === '/favicon.ico'
  ) {
    console.log('[MIDDLEWARE] Archivo estático, acceso permitido');
    return NextResponse.next();
  }

  // Permitir rutas públicas sin verificación
  if (isPublicRoute(normalizedPath)) {
    console.log('[MIDDLEWARE] Ruta pública, acceso permitido');
    return NextResponse.next();
  }

  // Verificar token de autenticación
  const token = getTokenFromRequest(request);
  if (!token) {
    console.log('[MIDDLEWARE] No hay token, redirigiendo a login');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar validez del token
  const payload = await verifyToken(token);
  if (!payload) {
    console.log('[MIDDLEWARE] Token inválido, redirigiendo a login');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = (payload.role as string | undefined)?.toLowerCase() || '';
  const userId = payload.id as number;

  console.log('[MIDDLEWARE] Usuario autenticado:', { userId, role });

  // Si es administrador, permitir acceso a todas las rutas
  if (role === 'administrador') {
    console.log('[MIDDLEWARE] Es administrador, acceso permitido');
    return NextResponse.next();
  }

  // Verificar rutas que solo requieren autenticación
  if (isAuthenticatedRoute(normalizedPath)) {
    console.log('[MIDDLEWARE] Ruta de usuario autenticado, acceso permitido');
    return NextResponse.next();
  }

  // Obtener configuración de la ruta
  const routeConfig = getRouteConfig(normalizedPath);
  
  if (routeConfig) {
    console.log('[MIDDLEWARE] Configuración de ruta encontrada:', routeConfig);
    
    // Si es administrador, permitir acceso
    if (role === 'administrador') {
      console.log('[MIDDLEWARE] Es administrador, acceso permitido');
      return NextResponse.next();
    }
    
    // Si requiere admin y no es administrador, denegar acceso
    if (routeConfig.requiresAdmin && role !== 'administrador') {
      console.log('[MIDDLEWARE] Acceso denegado - requiere administrador para ruta:', normalizedPath);
      
      if (normalizedPath.startsWith('/api/')) {
        return new NextResponse(null, { status: 403 });
      } else {
        const dashboardUrl = new URL('/users/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }
    
    // Para otras rutas, verificar permisos en la base de datos
    console.log('[MIDDLEWARE] Verificando permisos de módulos desde BD para:', normalizedPath);
    const hasPermission = await checkModulePermissions(userId, normalizedPath, token);
    
    if (!hasPermission) {
      console.log('[MIDDLEWARE] Acceso denegado a:', normalizedPath);
      
      if (normalizedPath.startsWith('/api/')) {
        return new NextResponse(null, { status: 403 });
      } else {
        const dashboardUrl = new URL('/users/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }
    
    console.log('[MIDDLEWARE] Permisos verificados, acceso permitido');
    return NextResponse.next();
  }

  // Si no hay configuración específica, verificar permisos de módulos desde la base de datos
  console.log('[MIDDLEWARE] Verificando permisos de módulos desde BD para:', normalizedPath);
  const hasPermission = await checkModulePermissions(userId, normalizedPath, token);
  
  if (!hasPermission) {
    console.log('[MIDDLEWARE] Acceso denegado a:', normalizedPath);
    
    if (normalizedPath.startsWith('/api/')) {
      return new NextResponse(null, { status: 403 });
    } else {
      // Redirigir a dashboard o página de acceso denegado
      const dashboardUrl = new URL('/users/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  console.log('[MIDDLEWARE] Acceso permitido a:', normalizedPath);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder and its contents
     * - img folder and its contents
     * - api/webhooks (webhook endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|img/|api/webhooks/).*)',
  ],
}; 