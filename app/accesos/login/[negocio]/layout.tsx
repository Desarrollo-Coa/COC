'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, User, LogOut } from 'lucide-react';

interface VigilanteSession {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  foto_url?: string;
  negocio: {
    id: number;
    nombre: string;
  };
  exp: number;
}

export default function VigilanteLoginLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ negocio: string }>;
}) {
  const [session, setSession] = useState<VigilanteSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Función para obtener token de cookies
  const getTokenFromCookies = () => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('vigilante_token='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  };

  // Función para eliminar token de cookies
  const removeTokenFromCookies = () => {
    document.cookie = 'vigilante_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const negocio = (await params).negocio;
        const token = getTokenFromCookies();
        
        if (token) {
          const response = await fetch('/api/accesos/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Negocio-Hash': negocio
            }
          });
          
          if (response.ok) {
            const sessionData = await response.json();
            setSession(sessionData);
             
            return;
          } else {
            // Token inválido, limpiar
            removeTokenFromCookies();
          }
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [params, router]);

  const handleLogout = async () => {
    try {
      const negocio = (await params).negocio;
      const token = getTokenFromCookies();
      
      if (token) {
        await fetch('/api/accesos/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Negocio-Hash': negocio
          }
        });
      }
      
      removeTokenFromCookies();
      setSession(null);
      router.push(`/accesos/login/${negocio}`);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
} 