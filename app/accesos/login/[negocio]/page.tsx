import { cookies, headers } from 'next/headers';
import LoginForm from '@/components/login-form';
import Skeleton from '@/components/ui/skeleton';

interface PageProps {
  params: { negocio: string };
}

export default async function AccesosLoginPage({ params }: PageProps) {
  const negocioHash = params.negocio;
  let business = null;
  let error = '';

  if (!negocioHash) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-blue-900">Acceso Vigilantes</h1>
          <p className="mb-4 text-gray-700">Falta el parámetro de negocio en el link.</p>
        </div>
      </div>
    );
  }

  try {
    // Detectar host para SSR
    const host = headers().get('x-forwarded-host') || headers().get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    const res = await fetch(`${baseUrl}/api/accesos/negocios/by-hash?hash=${negocioHash}`, {
      cache: 'no-store',
      headers: { cookie: cookies().toString() },
    });
    const data = await res.json();
    if (data.error) error = data.error;
    else {
      business = {
        ...data,
        name: data.nombre_negocio,
      };
    }
  } catch {
    error = 'Error al consultar el negocio';
  }

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center text-red-600">{error}</div>
    </div>
  );
  if (!business) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-100">
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