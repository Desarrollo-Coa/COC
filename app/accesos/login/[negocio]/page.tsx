import { cookies, headers } from 'next/headers';
import Skeleton from '@/components/ui/skeleton';
import { Shield } from 'lucide-react';
import LoginForm from '@/components/LoginForm';

interface PageProps {
  params: Promise<{ negocio: string }>;
}

export default async function AccesosLoginPage({ params }: PageProps) {
  const { negocio: negocioHash } = await params;
  let business = null;
  let error = '';

  if (!negocioHash) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="w-full max-w-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-t-3xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white transform rotate-45"></div>
              <div className="absolute top-8 right-8 w-6 h-6 border-2 border-white transform rotate-12"></div>
              <div className="absolute bottom-6 left-8 w-4 h-4 bg-white transform rotate-45"></div>
            </div>
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-8 h-8 text-gray-900" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-b-3xl p-8 shadow-xl">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Vigilantes</h1>
              <p className="text-gray-600">Falta el parámetro de negocio en el link.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  try {
    // Detectar host para SSR
    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    
    // Obtener cookies de forma asíncrona
    const cookieStore = await cookies();
    const res = await fetch(`${baseUrl}/api/accesos/negocios/by-hash?hash=${negocioHash}`, {
      cache: 'no-store',
      headers: { cookie: cookieStore.toString() },
    });
    const data = await res.json();
    if (data.error) error = data.error;
    else {
      business = {
        id_negocio: data.id_negocio,
        nombre_negocio: data.nombre_negocio,
      };
    }
  } catch {
    error = 'Error al consultar el negocio';
  }

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-t-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white transform rotate-45"></div>
            <div className="absolute top-8 right-8 w-6 h-6 border-2 border-white transform rotate-12"></div>
            <div className="absolute bottom-6 left-8 w-4 h-4 bg-white transform rotate-45"></div>
          </div>
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-b-3xl p-8 shadow-xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error de Acceso</h1>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    </div>
  );
  
  if (!business) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-t-3xl p-8 relative overflow-hidden">
          <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
        </div>
        <div className="bg-white rounded-b-3xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <Skeleton className="h-8 w-2/3 mx-auto mb-2 rounded" />
            <Skeleton className="h-4 w-1/3 mx-auto mb-4 rounded" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );

  return <LoginForm negocioHash={negocioHash} business={business} />;
} 