'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardTitle as OriginalCardTitle } from "@/components/ui/card";
import { UserSidebar } from "@/components/user/UserSidebar";
import { UserHeader } from "@/components/user/UserHeader";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";

const CardTitle = OriginalCardTitle as ComponentType<any>;
const NextImage = Image as ComponentType<any>;

interface Module {
  id: string;
  nombre: string;
  descripcion: string;
  ruta: string;
  imagen_url: string;
  icono: string;
}

export default function UserDashboard() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserModules = async () => {
      try {
        const response = await fetch('/api/modules/user/assigned');
        if (!response.ok) {
          throw new Error('Error al cargar los módulos');
        }
        const data = await response.json();
        setModules(data);
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar los módulos asignados');
      } finally {
        setLoading(false);
      }
    };

    fetchUserModules();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <UserSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <UserHeader />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6 pb-20 sm:pb-6">
            <div className="animate-pulse">
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/4 mb-4 sm:mb-6"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="h-[320px] bg-gray-200 rounded-lg border-2 border-solid border-gray-300">
                    <div className="p-4">
                      <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                      <div className="h-[160px] bg-gray-300 rounded-md mb-4"></div>
                      <div className="h-4 bg-gray-300 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <UserSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <UserHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6 pb-20 sm:pb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6 text-gray-800">Tablero de Gestión COA</h1>
          
          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded relative mb-20 sm:mb-0" role="alert">
              <p>{error}</p>
            </div>
          ) : modules.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 sm:px-4 py-2 sm:py-3 rounded relative mb-20 sm:mb-0" role="alert">
              <p>No tienes módulos asignados. Contacta al administrador.</p>
            </div>  
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8">
              {modules.map((module) => (
                <Link href={module.ruta} key={module.id}>
                  <Card className="h-[320px] flex flex-col hover:shadow-lg transition-shadow duration-300 border-2 border-solid border-[#4A6FA5]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 min-h-[60px]">
                      <CardTitle className="text-base font-medium break-words">
                        {module.nombre}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="relative h-[160px] mb-4">
                        <Image
                          src={module.imagen_url}
                          alt={module.nombre}
                          fill
                          className="rounded-md object-cover"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-auto line-clamp-2 pb-4">
                        {module.descripcion}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 