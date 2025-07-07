import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import React, { useState } from 'react';

interface Colaborador {
  cedula?: string;
  placa: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  foto_url?: string;
}

interface registrarColaboradorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Colaborador;
  setFormData: (data: Colaborador) => void;
  isEditing: boolean;
  onCancel: () => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
}

export function registrarColaborador({
  open,
  onOpenChange,
  formData,
  setFormData,
  isEditing,
  onCancel,
  selectedFile,
  setSelectedFile,
  previewUrl,
  setPreviewUrl,
  onSuccess,
}: registrarColaboradorProps & { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let foto_url = formData.foto_url;
      if (selectedFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          foto_url = reader.result as string;
        };
        reader.readAsDataURL(selectedFile);
      }
      const url = "/api/settings/colaboradores";
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, foto_url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al procesar la solicitud");
      setSuccess(data.message || (isEditing ? "Colaborador actualizado exitosamente" : "Colaborador creado exitosamente"));
      if (onSuccess) onSuccess();
      setTimeout(() => { onOpenChange(false); setSuccess(null); }, 1000);
    } catch (err: any) {
      setError(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Colaborador' : 'Nuevo Colaborador'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="cedula">Cédula</Label>
                <Input
                  id="cedula"
                  value={formData.cedula || ''}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value.replace(/\D/g, '') })}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={isEditing}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="placa">Placa</Label>
                <Input
                  id="placa"
                  value={formData.placa}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value.replace(/\D/g, '') })}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={isEditing}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  className="uppercase"
                  style={{ textTransform: 'uppercase' }}
                  placeholder="Ingrese el nombre"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  required
                  className="uppercase"
                  style={{ textTransform: 'uppercase' }}
                  placeholder="Ingrese el apellido"
                />
              </div>
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                  <Label htmlFor="activo">Activo</Label>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center justify-start gap-4">
              <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center relative">
                {(previewUrl || formData.foto_url) ? (
                  <img
                    src={previewUrl || formData.foto_url}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-500 text-center p-4">
                    <p>Foto del colaborador</p>
                    <p className="text-sm">Click para seleccionar</p>
                  </div>
                )}
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="foto"
              />
              <Label
                htmlFor="foto"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Seleccionar foto
              </Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Procesando...' : (isEditing ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-500 text-sm">
              {success}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
} 