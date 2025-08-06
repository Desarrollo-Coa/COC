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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import Skeleton from "@/components/ui/skeleton";

interface PuestoReporte {
  id_puesto: number;
  nombre_puesto: string;
  codigo_puesto: string;
  unidad_negocio_id: number;
  activo: boolean;
  unidad_negocio_nombre?: string;
}

interface UnidadNegocio {
  id: number;
  nombre: string;
}

export default function PuestosReportesPage() {
  const [puestos, setPuestos] = useState<PuestoReporte[]>([]);
  const [puestosFiltrados, setPuestosFiltrados] = useState<PuestoReporte[]>([]);
  const [unidadesNegocio, setUnidadesNegocio] = useState<UnidadNegocio[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [unidadFiltro, setUnidadFiltro] = useState<string>("todos");
  const [isLoading, setIsLoading] = useState(true);


  const [formData, setFormData] = useState<PuestoReporte>({
    id_puesto: 0,
    nombre_puesto: "",
    codigo_puesto: "",
    unidad_negocio_id: 1,
    activo: true,
  });

  useEffect(() => {
    fetchPuestos();
    fetchUnidadesNegocio();
  }, []);

  useEffect(() => {
    filtrarPuestos();
  }, [searchTerm, unidadFiltro, puestos]);

  const filtrarPuestos = () => {
    let filtered = [...puestos];

    if (searchTerm) {
      filtered = filtered.filter(
        (puesto) =>
          puesto.nombre_puesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          puesto.codigo_puesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          false
      );
    }

    if (unidadFiltro !== "todos") {
      filtered = filtered.filter(
        (puesto) => puesto.unidad_negocio_id === parseInt(unidadFiltro)
      );
    }

    setPuestosFiltrados(filtered);
  };

  const fetchPuestos = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/settings/puestos-reportes");
      const data = await response.json();
      setPuestos(data);
      setPuestosFiltrados(data);
    } catch (error) {
      console.error("Error al obtener puestos para reportes:", error);
      toast.error("No se pudieron cargar los puestos para reportes");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnidadesNegocio = async () => {
    try {
      const response = await fetch("/api/unidades-negocio");
      const data = await response.json();
      setUnidadesNegocio(data);
    } catch (error) {
      console.error("Error al obtener unidades de negocio:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/settings/puestos-reportes";
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
        ? "Puesto actualizado exitosamente"
        : "Puesto creado exitosamente");

      setIsDialogOpen(false);
      resetForm();
      fetchPuestos();
    } catch (error: any) {
      toast.error(error.message)
    }
  };

  const handleEdit = (puesto: PuestoReporte) => {
    setFormData(puesto);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este puesto?")) return;

    try {
      const response = await fetch(
        `/api/settings/puestos-reportes?id=${id}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success("Puesto eliminado exitosamente");

      fetchPuestos();
    } catch (error: any) {
      toast.error(error.message)
    }
  };

  const resetForm = () => {
    setFormData({
      id_puesto: 0,
      nombre_puesto: "",
      codigo_puesto: "",
      unidad_negocio_id: 1,
      activo: true,
    });
    setIsEditing(false);
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col gap-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Puestos para Reportes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Puesto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Puesto" : "Nuevo Puesto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre_puesto">Nombre del Puesto</Label>
                  <Input
                    id="nombre_puesto"
                    value={formData.nombre_puesto || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre_puesto: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="codigo_puesto">Código del Puesto</Label>
                  <Input
                    id="codigo_puesto"
                    value={formData.codigo_puesto || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, codigo_puesto: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unidad">Unidad de Negocio</Label>
                  <Select
                    value={formData.unidad_negocio_id.toString()}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        unidad_negocio_id: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesNegocio.map((unidad) => (
                        <SelectItem
                          key={unidad.id}
                          value={unidad.id.toString()}
                        >
                          {unidad.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isEditing && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="activo"
                      checked={formData.activo}
                      onCheckedChange={(checked: boolean) =>
                        setFormData({ ...formData, activo: checked })
                      }
                    />
                    <Label htmlFor="activo">Activo</Label>
                  </div>
                )}
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
            placeholder="Buscar puesto..."
            value={searchTerm || ""}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-white border-gray-300 focus-visible:ring-blue-500"
          />
        </div>
        <div className="w-64">
          <Select
            value={unidadFiltro}
            onValueChange={setUnidadFiltro}
          >
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Filtrar por unidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las unidades</SelectItem>
              {unidadesNegocio.map((unidad) => (
                <SelectItem
                  key={unidad.id}
                  value={unidad.id.toString()}
                >
                  {unidad.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 border rounded-md overflow-hidden bg-white">
        <div className="relative h-full overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10 border-b">
              <TableRow>
                <TableHead className="py-3 px-4 text-left font-medium">Nombre del Puesto</TableHead>
                <TableHead className="py-3 px-4 text-left font-medium">Código</TableHead>
                <TableHead className="py-3 px-4 text-left font-medium">Unidad de Negocio</TableHead>
                <TableHead className="py-3 px-4 text-left font-medium">Estado</TableHead>
                <TableHead className="py-3 px-4 text-right font-medium">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="py-3 px-4"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="py-3 px-4"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="py-3 px-4"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="py-3 px-4"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : puestosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    No se encontraron puestos
                  </TableCell>
                </TableRow>
              ) : (
                puestosFiltrados.map((puesto) => (
                  <TableRow 
                    key={puesto.id_puesto}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="py-3 px-4">{puesto.nombre_puesto}</TableCell>
                    <TableCell className="py-3 px-4">{puesto.codigo_puesto}</TableCell>
                    <TableCell className="py-3 px-4">{puesto.unidad_negocio_nombre}</TableCell>
                    <TableCell className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          puesto.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {puesto.activo ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(puesto)}
                          className="hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(puesto.id_puesto)}
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