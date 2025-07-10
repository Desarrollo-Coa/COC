"use client";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";

interface Puesto {
  id_puesto: number;
  nombre_puesto: string;
  id_unidad: number;
  nombre_unidad?: string;
  fecha_inicial: string;
  activo: boolean;
}

interface UnidadNegocio {
  id_unidad: number;
  nombre_unidad: string;
}

export default function PuestosPage() {
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [unidades, setUnidades] = useState<UnidadNegocio[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPuesto, setEditingPuesto] = useState<Puesto | null>(null);
  const [formData, setFormData] = useState({
    nombre_puesto: "",
    id_unidad: "",
    fecha_inicial: "",
    activo: true,
  });
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMsg, setErrorModalMsg] = useState("");
  const { toast } = useToast();

  const loadPuestos = async () => {
    try {
      const response = await fetch("/api/novedades/puestos");
      if (!response.ok) throw new Error("Error al cargar puestos");
      const data = await response.json();
      setPuestos(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los puestos",
        variant: "destructive",
      });
    }
  };

  const loadUnidades = async () => {
    try {
      const response = await fetch("/api/novedades/configuracion/unidades-negocio");
      if (!response.ok) throw new Error("Error al cargar unidades de negocio");
      const data = await response.json();
      setUnidades(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las unidades de negocio",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadPuestos();
    loadUnidades();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPuesto
        ? `/api/novedades/puestos/${editingPuesto.id_puesto}`
        : "/api/novedades/puestos";
      const method = editingPuesto ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_puesto: formData.nombre_puesto,
          id_unidad: parseInt(formData.id_unidad),
          fecha_inicial: formData.fecha_inicial || undefined,
          activo: formData.activo,
        }),
      });
      if (!response.ok) throw new Error("Error al guardar puesto");
      await loadPuestos();
      setIsDialogOpen(false);
      setFormData({ nombre_puesto: "", id_unidad: "", fecha_inicial: "", activo: true });
      setEditingPuesto(null);
      toast({
        title: "Éxito",
        description: `Puesto ${editingPuesto ? "actualizado" : "creado"} exitosamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el puesto",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (puesto: Puesto) => {
    setEditingPuesto(puesto);
    setFormData({
      nombre_puesto: puesto.nombre_puesto,
      id_unidad: puesto.id_unidad.toString(),
      fecha_inicial: puesto.fecha_inicial ? puesto.fecha_inicial.split("T")[0] : "",
      activo: puesto.activo,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este puesto?")) return;
    try {
      const response = await fetch(`/api/novedades/puestos/${id}`, { method: "DELETE" });
      if (!response.ok) {
        if (response.status === 409) {
          setErrorModalMsg("No puedes eliminar este puesto porque tiene datos relacionados (cumplidos, novedades, etc.). Elimina o reasigna esos datos antes de intentar borrar el puesto.");
          setErrorModalOpen(true);
        } else {
          toast({ title: "Error", description: "No se pudo eliminar el puesto", variant: "destructive" });
        }
        return;
      }
      await loadPuestos();
      toast({ title: "Éxito", description: "Puesto eliminado exitosamente" });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar el puesto", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Puestos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Nuevo Puesto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPuesto ? "Editar Puesto" : "Nuevo Puesto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={formData.nombre_puesto}
                  onChange={e => setFormData({ ...formData, nombre_puesto: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Unidad de Negocio</label>
                <Select
                  value={formData.id_unidad}
                  onValueChange={value => setFormData({ ...formData, id_unidad: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map(unidad => (
                      <SelectItem key={unidad.id_unidad} value={unidad.id_unidad.toString()}>
                        {unidad.nombre_unidad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Fecha Inicial</label>
                <Input
                  type="date"
                  value={formData.fecha_inicial}
                  onChange={e => setFormData({ ...formData, fecha_inicial: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Activo</label>
                <Switch
                  checked={formData.activo}
                  onCheckedChange={checked => setFormData({ ...formData, activo: checked })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setFormData({ nombre_puesto: "", id_unidad: "", fecha_inicial: "", activo: true });
                    setEditingPuesto(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">{editingPuesto ? "Actualizar" : "Crear"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Unidad de Negocio</TableHead>
            <TableHead>Fecha Inicial</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {puestos.map(puesto => (
            <TableRow key={`puesto-${puesto.id_puesto}`}>
              <TableCell>{puesto.id_puesto}</TableCell>
              <TableCell>
                <span className="truncate max-w-[200px] block" title={puesto.nombre_puesto}>
                  {puesto.nombre_puesto}
                </span>
              </TableCell>
              <TableCell>{puesto.nombre_unidad || puesto.id_unidad}</TableCell>
              <TableCell>{puesto.fecha_inicial ? puesto.fecha_inicial.split("T")[0] : ""}</TableCell>
              <TableCell>{puesto.activo ? "Sí" : "No"}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(puesto)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(puesto.id_puesto)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Modal de error visible para relaciones */}
      <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>No se puede eliminar el puesto</DialogTitle>
          </DialogHeader>
          <p>{errorModalMsg}</p>
          <div className="flex justify-end mt-4">
            <Button type="button" onClick={() => setErrorModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 