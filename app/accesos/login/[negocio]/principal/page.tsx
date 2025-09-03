'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileConfig from '@/components/profile-config';

interface PageProps {
  params: Promise<{ negocio: string }>;
}

export default function PrincipalPage({ params }: PageProps) {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Función para obtener token de cookies
  const getTokenFromCookies = () => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('vigilante_token='));
    if (!tokenCookie) return null;
    
    try {
      const sessionData = JSON.parse(tokenCookie.split('=')[1]);
      return sessionData.token || null;
    } catch (error) {
      console.error('Error parsing session data:', error);
      return null;
    }
  };

  // Función para eliminar token de cookies
  const removeTokenFromCookies = () => {
    document.cookie = 'vigilante_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { negocio: negocioHash } = await params;
        const token = getTokenFromCookies();
        
        if (!token) {
          // No hay token, redirigir al login
          router.push(`/accesos/login/${negocioHash}`);
          return;
        }

        // Obtener datos del usuario (ahora incluye puesto)
        const userResponse = await fetch('/api/accesos/auth/me', {
          credentials: 'include', // Asegurar que se envíen las cookies
          headers: {
            'X-Negocio-Hash': negocioHash
          }
        });
        
        if (userResponse.ok) {
          const data = await userResponse.json();
          setSessionData(data);
        } else {
          // Token inválido, limpiar y redirigir
          removeTokenFromCookies();
          router.push(`/accesos/login/${negocioHash}`);
          return;
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
        setError('Error al verificar la sesión');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [params, router]);

  const handleLogout = async () => {
    try {
      const { negocio: negocioHash } = await params;
      removeTokenFromCookies();
      router.push(`/accesos/login/${negocioHash}`);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No se pudo cargar la información de la sesión</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ProfileConfig 
        userData={sessionData.colaborador}
        negocioData={sessionData.negocio}
        puestoData={sessionData.puesto}
        onLogout={handleLogout}
      />
    </div>
  );
} 