'use client';

import { useState, useEffect, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast"; 
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import Skeleton from "@/components/ui/skeleton";
import { registrarColaborador as RegistrarColaborador } from '@/components/registrar-colaborador';

interface Colaborador {
  placa: string;
  nombre: string;
  apellido: string;
  nombres?: string;
  apellidos?: string;
  activo: boolean;
  foto_url?: string;
  cedula?: string;
}

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [formData, setFormData] = useState<Colaborador>({
    placa: "",
    nombre: "",
    apellido: "",
    activo: true,
    foto_url: "",
  });

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [pendingSearch, setPendingSearch] = useState<string>("");

  useEffect(() => {
    fetchColaboradores();
    // eslint-disable-next-line
  }, [page, pageSize, searchTerm]);

  useEffect(() => {
    setPendingSearch(searchTerm);
  }, []);

  const fetchColaboradores = async () => {
    try {
      setIsLoading(true);
      let url = `/api/settings/colaboradores?limit=${pageSize}&offset=${(page - 1) * pageSize}`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      const response = await fetch(url);
      let result = await response.json();
      let data = result.data || [];
      setTotal(result.total || 0);
      // Normalizar los datos para que siempre tengan 'nombre' y 'apellido'
      data = data.map((col: any) => ({
        ...col,
        nombre: col.nombre || col.nombres || "",
        apellido: col.apellido || col.apellidos || "",
      }));
      setColaboradores(data);
    } catch (error) {
      console.error("Error al obtener colaboradores:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los colaboradores",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cambia el valor del input, pero no busca inmediatamente
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingSearch(e.target.value);
    setPage(1);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setSearchTerm(e.target.value);
    }, 1000);
  };

  // Si pierde el foco, busca inmediatamente
  const handleSearchBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    setSearchTerm(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToDigitalOcean = async (file: File, placa: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('placa', placa);

    try {
      const response = await fetch('/api/upload-foto', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      throw new Error('Error al subir la imagen');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let foto_url = formData.foto_url;

      if (selectedFile) {
        foto_url = await uploadToDigitalOcean(selectedFile, formData.placa);
      }

      const url = "/api/settings/colaboradores";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, foto_url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la solicitud");
      }

      toast({
        title: "Éxito",
        description: data.message || (isEditing
          ? "Colaborador actualizado exitosamente"
          : "Colaborador creado exitosamente"),
      });

      setIsDialogOpen(false);
      resetForm();
      fetchColaboradores();
    } catch (error: any) {
      console.error("Error completo:", error);
      toast({
        title: "Error",
        description: error.message || "Error al procesar la solicitud",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (colaborador: Colaborador) => {
    setFormData(colaborador);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (placa: string) => {
    if (!confirm("¿Está seguro que desea eliminar este colaborador? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/settings/colaboradores?placa=${placa}`,
        { method: "DELETE" }
      );
      
      const data = await response.json();
      console.log('Respuesta del servidor:', data); // Para debugging

      if (!response.ok) {
        toast({
          title: "No se puede eliminar el colaborador",
          description: data.error || "Error desconocido al intentar eliminar",
          variant: "destructive",
          duration: 7000,
        });
        return;
      }

      toast({
        title: "Éxito",
        description: data.message,
        duration: 3000,
      });

      fetchColaboradores();
    } catch (error: any) {
      console.error("Error detallado:", error);
      toast({
        title: "Error del sistema",
        description: "Ocurrió un error al intentar eliminar el colaborador. Por favor, contacte al administrador.",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      placa: "",
      nombre: "",
      apellido: "",
      activo: true,
      foto_url: "",
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditing(false);
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col gap-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Colaboradores</h1>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Colaborador
        </Button>
        <RegistrarColaborador
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          formData={formData}
          setFormData={setFormData}
          isEditing={isEditing}
          onCancel={() => { setIsDialogOpen(false); resetForm(); }}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          previewUrl={previewUrl}
          setPreviewUrl={setPreviewUrl}
          onSuccess={() => {
            setIsDialogOpen(false);
            resetForm();
            fetchColaboradores();
          }}
        />
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <Input
            placeholder="Buscar colaborador..."
            value={pendingSearch}
            onChange={handleSearchChange}
            onBlur={handleSearchBlur}
            className="pl-8 bg-white border-gray-300 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 border rounded-md overflow-hidden bg-white">
        <div className="relative h-full overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10 border-b">
              <TableRow>
                <TableHead className="py-3 px-4 text-left font-medium">Placa</TableHead>
                <TableHead className="py-3 px-4 text-left font-medium">Nombre</TableHead>
                <TableHead className="py-3 px-4 text-left font-medium">Apellido</TableHead>
                <TableHead className="py-3 px-4 text-left font-medium">Estado</TableHead>
                <TableHead className="py-3 px-4 text-right font-medium">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="py-3 px-4"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="py-3 px-4"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="py-3 px-4"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="py-3 px-4"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : colaboradores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    No se encontraron colaboradores
                  </TableCell>
                </TableRow>
              ) : (
                colaboradores.map((colaborador) => (
                  <TableRow 
                    key={colaborador.placa}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                          {colaborador.foto_url ? (
                            <img
                              src={colaborador.foto_url}
                              alt={`${colaborador.nombre || colaborador.nombres} ${colaborador.apellido || colaborador.apellidos}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-xs">Sin foto</span>
                            </div>
                          )}
                        </div>
                        {colaborador.placa}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {colaborador.nombre || colaborador.nombres}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {colaborador.apellido || colaborador.apellidos}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          colaborador.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {colaborador.activo ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(colaborador)}
                          className="hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(colaborador.placa)}
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