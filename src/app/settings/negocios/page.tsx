"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Skeleton from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Negocio {
  id_negocio: number;
  nombre_negocio: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export default function NegociosPage() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchNegocios();
  }, []);

  const fetchNegocios = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/negocios");
      if (!res.ok) throw new Error("No se pudieron obtener los negocios");
      const data = await res.json();
      setNegocios(data);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNegocio.trim()) return;
    try {
      const res = await fetch("/api/negocios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_negocio: nombreNegocio })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear negocio");
      toast({ title: "Negocio creado", description: `Se creó el negocio: ${data.negocio.nombre_negocio}` });
      setNombreNegocio("");
      setIsDialogOpen(false);
      fetchNegocios();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Negocios</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Negocio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Negocio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Nombre del negocio"
                value={nombreNegocio}
                onChange={e => setNombreNegocio(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-28 flex flex-col justify-center items-center">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4 text-center">{error}</div>
      ) : negocios.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No hay negocios registrados.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {negocios.map((negocio) => (
            <Card key={negocio.id_negocio} className="h-28 flex flex-row items-center gap-4 px-6">
              <div className="flex items-center justify-center rounded-full h-10 w-10 bg-green-100">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex flex-col flex-1">
                <CardTitle className="text-base font-semibold text-gray-900 text-left">
                  {negocio.nombre_negocio}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  {negocio.activo ? "Activo" : "Inactivo"} &middot; Creado: {new Date(negocio.fecha_creacion).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 