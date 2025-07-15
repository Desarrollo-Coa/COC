"use client";
export const dynamic = "force-dynamic";
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoginForm from '@/components/login-form';
import Skeleton from "@/components/ui/skeleton";

export default function AccesosLoginPage() {
  const searchParams = useSearchParams();
  const negocioHash = searchParams.get('negocio');
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (negocioHash) {
      setLoading(true);
      setError('');
      fetch(`/api/accesos/negocios/by-hash?hash=${negocioHash}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) setError(data.error);
          else {
            setBusiness({
              ...data,
              name: data.nombre_negocio,
            });
          }
        })
        .catch(() => setError('Error al consultar el negocio'))
        .finally(() => setLoading(false));
    }
  }, [negocioHash]);

  if (!negocioHash) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-blue-900">Acceso Vigilantes</h1>
        <p className="mb-4 text-gray-700">Falta el parámetro de negocio en el link.</p>
      </div>
    </div>
  );
  if (loading) return (
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
  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center text-red-600">{error}</div>
    </div>
  );
  if (!business) return null;

  return <LoginForm negocioHash={negocioHash} business={business} onLogin={() => {}} />;
}