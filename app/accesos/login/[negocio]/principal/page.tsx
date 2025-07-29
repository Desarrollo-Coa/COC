'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileConfig from '@/components/profile-config';

interface PageProps {
  params: Promise<{ negocio: string }>;
}

export default function PrincipalPage({ params }: PageProps) {
  const [userData, setUserData] = useState<any>(null);
  const [puestoData, setPuestoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  // Función para obtener puesto de cookies
  const getPuestoFromCookies = () => {
    const cookies = document.cookie.split(';');
    const puestoCookie = cookies.find(cookie => cookie.trim().startsWith('vigilante_puesto='));
    if (!puestoCookie) return null;
    try {
      return JSON.parse(decodeURIComponent(puestoCookie.split('=')[1]));
    } catch {
      return null;
    }
  };

  // Función para eliminar puesto de cookies
  const removePuestoFromCookies = () => {
    document.cookie = 'vigilante_puesto=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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

        // Obtener datos del usuario
        const userResponse = await fetch('/api/accesos/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Negocio-Hash': negocioHash
          }
        });
        
        if (userResponse.ok) {
          const sessionData = await userResponse.json();
          setUserData(sessionData);

          // Obtener puesto desde la cookie
          const puestoFromCookie = getPuestoFromCookies();
          if (puestoFromCookie) {
            setPuestoData({
              id: puestoFromCookie.id_puesto,
              nombre: puestoFromCookie.nombre_puesto,
              unidad: puestoFromCookie.nombre_unidad
            });
          }
        } else {
          // Token inválido, limpiar y redirigir
          removeTokenFromCookies();
          removePuestoFromCookies();
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
      const token = getTokenFromCookies();
      
      if (token) {
        await fetch('/api/accesos/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Negocio-Hash': negocioHash
          }
        });
      }
      
      removeTokenFromCookies();
      removePuestoFromCookies();
      router.push(`/accesos/login/${negocioHash}`);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 text-white">!</div>
          </div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null; // No debería llegar aquí, pero por si acaso
  }

  return (
    <ProfileConfig
      user={`${userData.nombre} ${userData.apellido}`}
      id_colaborador={userData.id}
      id_puesto={puestoData?.id || 1}
      onLogout={handleLogout}
      negocio={userData.negocio}
      puesto={{
        id: puestoData?.id || 1,
        nombre: puestoData?.nombre || "Puesto Principal"
      }}
    />
  );
} 