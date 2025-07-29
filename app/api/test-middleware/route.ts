import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request as any);
    
    if (!token) {
      return NextResponse.json({ 
        message: 'No hay token',
        status: 'unauthorized'
      }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ 
        message: 'Token inválido',
        status: 'invalid_token'
      }, { status: 401 });
    }

    return NextResponse.json({ 
      message: 'Token válido',
      status: 'authorized',
      user: {
        id: payload.id,
        email: payload.email,
        role: payload.role
      }
    });
  } catch (error) {
    console.error('Error en test-middleware:', error);
    return NextResponse.json({ 
      message: 'Error interno',
      status: 'error'
    }, { status: 500 });
  }
} 