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

interface Departamento {
  id: number
  nombre: string
}

export default function DepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDepartamento, setEditingDepartamento] = useState<Departamento | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
  })
  const { toast } = useToast()

  const loadDepartamentos = async () => {
    try {
      const response = await fetch("/api/novedades/configuracion/departamentos")
      if (!response.ok) throw new Error("Error al cargar departamentos")
      const data = await response.json()
      setDepartamentos(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los departamentos",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadDepartamentos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingDepartamento
        ? `/api/novedades/configuracion/departamentos/${editingDepartamento.id}`
        : "/api/novedades/configuracion/departamentos"
      
      const method = editingDepartamento ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_departamento: formData.nombre,
        }),
      })

      if (!response.ok) throw new Error("Error al guardar departamento")

      await loadDepartamentos()
      setIsDialogOpen(false)
      setFormData({
        nombre: "",
      })
      setEditingDepartamento(null)

      toast({
        title: "Éxito",
        description: `Departamento ${editingDepartamento ? "actualizado" : "creado"} exitosamente`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el departamento",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (departamento: Departamento) => {
    setEditingDepartamento(departamento)
    setFormData({
      nombre: departamento.nombre,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este departamento?")) return

    try {
      const response = await fetch(
        `/api/novedades/configuracion/departamentos/${id}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) throw new Error("Error al eliminar departamento")

      await loadDepartamentos()
      toast({
        title: "Éxito",
        description: "Departamento eliminado exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el departamento",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Departamentos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Nuevo Departamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDepartamento ? "Editar Departamento" : "Nuevo Departamento"}
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
                    setEditingDepartamento(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDepartamento ? "Actualizar" : "Crear"}
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
          {departamentos.map((departamento) => (
            <TableRow key={`departamento-${departamento.id}`}>
              <TableCell>{departamento.id}</TableCell>
              <TableCell>{departamento.nombre}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(departamento)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(departamento.id)}
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