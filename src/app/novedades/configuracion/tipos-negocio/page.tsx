"use client"

import { useState, useEffect } from "react"
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
import { Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface TipoNegocio {
  id: number
  nombre: string
}

export default function TiposNegocioPage() {
  const [tiposNegocio, setTiposNegocio] = useState<TipoNegocio[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoNegocio | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
  })
  const { toast } = useToast()

  const loadTiposNegocio = async () => {
    try {
      const response = await fetch("/api/novedades/configuracion/tipos-negocio")
      if (!response.ok) throw new Error("Error al cargar tipos de negocio")
      const data = await response.json()
      setTiposNegocio(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los tipos de negocio",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadTiposNegocio()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingTipo
        ? `/api/novedades/configuracion/tipos-negocio/${editingTipo.id}`
        : "/api/novedades/configuracion/tipos-negocio"
      
      const method = editingTipo ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_tipo_negocio: formData.nombre,
        }),
      })

      if (!response.ok) throw new Error("Error al guardar tipo de negocio")

      await loadTiposNegocio()
      setIsDialogOpen(false)
      setFormData({ nombre: "" })
      setEditingTipo(null)

      toast({
        title: "Éxito",
        description: `Tipo de negocio ${editingTipo ? "actualizado" : "creado"} exitosamente`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el tipo de negocio",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (tipo: TipoNegocio) => {
    setEditingTipo(tipo)
    setFormData({
      nombre: tipo.nombre,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este tipo de negocio?")) return

    try {
      const response = await fetch(
        `/api/novedades/configuracion/tipos-negocio/${id}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) throw new Error("Error al eliminar tipo de negocio")

      await loadTiposNegocio()
      toast({
        title: "Éxito",
        description: "Tipo de negocio eliminado exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el tipo de negocio",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tipos de Negocio</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Nuevo Tipo de Negocio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTipo ? "Editar Tipo de Negocio" : "Nuevo Tipo de Negocio"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setFormData({ nombre: "" })
                    setEditingTipo(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTipo ? "Actualizar" : "Crear"}
                </Button>
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
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiposNegocio.map((tipo) => (
            <TableRow key={`tipo-negocio-${tipo.id}`}>
              <TableCell>{tipo.id}</TableCell>
              <TableCell>{tipo.nombre}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(tipo)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(tipo.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 