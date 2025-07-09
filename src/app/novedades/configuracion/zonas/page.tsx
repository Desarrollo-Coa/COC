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

interface Zona {
  id: number
  nombre: string
}

export default function ZonasPage() {
  const [zonas, setZonas] = useState<Zona[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingZona, setEditingZona] = useState<Zona | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
  })
  const { toast } = useToast()

  const loadZonas = async () => {
    try {
      const response = await fetch("/api/novedades/configuracion/zonas")
      if (!response.ok) throw new Error("Error al cargar zonas")
      const data = await response.json()
      setZonas(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las zonas",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadZonas()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingZona
        ? `/api/novedades/configuracion/zonas/${editingZona.id}`
        : "/api/novedades/configuracion/zonas"
      
      const method = editingZona ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_zona: formData.nombre,
        }),
      })

      if (!response.ok) throw new Error("Error al guardar zona")

      await loadZonas()
      setIsDialogOpen(false)
      setFormData({
        nombre: "",
      })
      setEditingZona(null)

      toast({
        title: "Éxito",
        description: `Zona ${editingZona ? "actualizada" : "creada"} exitosamente`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la zona",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (zona: Zona) => {
    setEditingZona(zona)
    setFormData({
      nombre: zona.nombre,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta zona?")) return

    try {
      const response = await fetch(
        `/api/novedades/configuracion/zonas/${id}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) throw new Error("Error al eliminar zona")

      await loadZonas()
      toast({
        title: "Éxito",
        description: "Zona eliminada exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la zona",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Zonas</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Nueva Zona</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingZona ? "Editar Zona" : "Nueva Zona"}
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
                    setFormData({
                      nombre: "",
                    })
                    setEditingZona(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingZona ? "Actualizar" : "Crear"}
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
          {zonas.map((zona) => (
            <TableRow key={`zona-${zona.id}`}>
              <TableCell>{zona.id}</TableCell>
              <TableCell>{zona.nombre}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(zona)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(zona.id)}
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