import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'tu_clave_secreta_aqui';

export function getTokenFromRequest(request: NextRequest) {
  return request.cookies.get('token')?.value;
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(SECRET_KEY)
    );
    return payload;
  } catch (error) {
    console.error('Error verificando token:', error);
    return null;
  }
}

export async function createToken(payload: any) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(new TextEncoder().encode(SECRET_KEY));
  
  return token;
}

export function setTokenCookie(response: NextResponse, token: string) {
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 8 * 60 * 60 // 8 horas en segundos
  });
  return response;
} 