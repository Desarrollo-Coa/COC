'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface TipoNovedad {
  id_tipo_evento: number
  nombre_tipo_evento: string
  id_tipo_reporte: number
  nombre_tipo_reporte: string
}

export default function TiposNovedadPage() {
  const [tiposNovedad, setTiposNovedad] = useState<TipoNovedad[]>([])
  const [tiposReporte, setTiposReporte] = useState<{id: number, nombre: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoNovedad | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadTiposNovedad()
    loadTiposReporte()
  }, [])

  const loadTiposNovedad = async () => {
    try {
      const response = await fetch('/api/novedades/tipos-evento')
      if (!response.ok) throw new Error('Error al cargar tipos de novedad')
      const data = await response.json()
      setTiposNovedad(data)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los tipos de novedad',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTiposReporte = async () => {
    try {
      const response = await fetch('/api/novedades/tipos-reporte')
      if (!response.ok) throw new Error('Error al cargar tipos de reporte')
      const data = await response.json()
      setTiposReporte(data)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los tipos de reporte',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      nombre_tipo_evento: formData.get('nombre_tipo_evento') as string,
      id_tipo_reporte: parseInt(formData.get('id_tipo_reporte') as string),
    }

    try {
      const url = editingTipo 
        ? `/api/novedades/tipos-evento/${editingTipo.id_tipo_evento}`
        : '/api/novedades/tipos-evento'
      
      const response = await fetch(url, {
        method: editingTipo ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Error al guardar el tipo de novedad')

      toast({
        title: 'Éxito',
        description: `Tipo de novedad ${editingTipo ? 'actualizado' : 'creado'} correctamente`,
      })

      setIsDialogOpen(false)
      setEditingTipo(null)
      loadTiposNovedad()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudo guardar el tipo de novedad',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este tipo de novedad?')) return

    try {
      const response = await fetch(`/api/novedades/tipos-evento/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Error al eliminar el tipo de novedad')

      toast({
        title: 'Éxito',
        description: 'Tipo de novedad eliminado correctamente',
      })

      loadTiposNovedad()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el tipo de novedad',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(4)].map((_, index) => (
                  <TableHead key={index} className="whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {[...Array(4)].map((_, cellIndex) => (
                    <TableCell key={cellIndex} className="whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Tipos de Novedad</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona los diferentes tipos de novedades que pueden ser reportadas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTipo(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Tipo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTipo ? 'Editar Tipo de Novedad' : 'Nuevo Tipo de Novedad'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_tipo_evento">Nombre del Tipo</Label>
                <Input
                  id="nombre_tipo_evento"
                  name="nombre_tipo_evento"
                  defaultValue={editingTipo?.nombre_tipo_evento}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="id_tipo_reporte">Tipo de Reporte</Label>
                <Select
                  name="id_tipo_reporte"
                  defaultValue={editingTipo?.id_tipo_reporte.toString()}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione un tipo de reporte" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposReporte.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTipo ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Nombre</TableHead>
              <TableHead className="font-semibold">Tipo de Reporte</TableHead>
              <TableHead className="font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiposNovedad.map((tipo) => (
              <TableRow key={tipo.id_tipo_evento} className="hover:bg-gray-50">
                <TableCell className="font-medium">{tipo.id_tipo_evento}</TableCell>
                <TableCell>{tipo.nombre_tipo_evento}</TableCell>
                <TableCell>{tipo.nombre_tipo_reporte}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingTipo(tipo)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(tipo.id_tipo_evento)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 