'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AccessDeniedProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export default function AccessDenied({
  title = 'Acceso Denegado',
  description = 'No tienes permisos para acceder a esta página. Contacta al administrador si crees que esto es un error.',
  showBackButton = true,
  showHomeButton = true,
}: AccessDeniedProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleHome = () => {
    router.push('/users/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {showBackButton && (
              <Button
                variant="outline"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            )}
            {showHomeButton && (
              <Button
                onClick={handleHome}
              >
                <Home className="h-4 w-4" />
                Ir al Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 