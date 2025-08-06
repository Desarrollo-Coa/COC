'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import Skeleton from "@/components/ui/skeleton";

interface TipoNovedad {
  id_tipo_novedad: number;
  nombre_novedad: string;
}

export default function TiposNovedadesPage() {
  const [tiposNovedades, setTiposNovedades] = useState<TipoNovedad[]>([]);
  const [tiposFiltrados, setTiposFiltrados] = useState<TipoNovedad[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);


  const [formData, setFormData] = useState<TipoNovedad>({
    id_tipo_novedad: 0,
    nombre_novedad: "",
  });

  useEffect(() => {
    fetchTiposNovedades();
  }, []);

  useEffect(() => {
    filtrarTipos();
  }, [searchTerm, tiposNovedades]);

  const filtrarTipos = () => {
    let filtered = [...tiposNovedades];

    if (searchTerm) {
      filtered = filtered.filter(
        (tipo) =>
          tipo.nombre_novedad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          false
      );
    }

    setTiposFiltrados(filtered);
  };

  const fetchTiposNovedades = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/settings/tipos-novedades");
      const data = await response.json();
      setTiposNovedades(data);
      setTiposFiltrados(data);
    } catch (error) {
      console.error("Error al obtener tipos de novedades:", error);
      toast.error("No se pudieron cargar los tipos de novedades");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/settings/tipos-novedades";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success(isEditing
        ? "Tipo de novedad actualizado exitosamente"
        : "Tipo de novedad creado exitosamente");

      setIsDialogOpen(false);
      resetForm();
      fetchTiposNovedades();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (tipo: TipoNovedad) => {
    setFormData(tipo);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este tipo de novedad?")) return;

    try {
      const response = await fetch(
        `/api/settings/tipos-novedades?id=${id}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success("Tipo de novedad eliminado exitosamente");

      fetchTiposNovedades();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      id_tipo_novedad: 0,
      nombre_novedad: "",
    });
    setIsEditing(false);
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col gap-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Tipos de Novedades</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Tipo de Novedad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Tipo de Novedad" : "Nuevo Tipo de Novedad"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre_novedad">Nombre del Tipo de Novedad</Label>
                  <Input
                    id="nombre_novedad"
                    value={formData.nombre_novedad || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre_novedad: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {isEditing ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <Input
            placeholder="Buscar tipo de novedad..."
            value={searchTerm || ""}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-white border-gray-300 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 border rounded-md overflow-hidden bg-white">
        <div className="relative h-full overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10 border-b">
              <TableRow>
                <TableHead className="py-3 px-4 text-left font-medium">Nombre del Tipo de Novedad</TableHead>
                <TableHead className="py-3 px-4 text-right font-medium">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="py-3 px-4"><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : tiposFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                    No se encontraron tipos de novedades
                  </TableCell>
                </TableRow>
              ) : (
                tiposFiltrados.map((tipo) => (
                  <TableRow 
                    key={tipo.id_tipo_novedad}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="py-3 px-4">{tipo.nombre_novedad}</TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(tipo)}
                          className="hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tipo.id_tipo_novedad)}
                          className="hover:bg-gray-100 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 