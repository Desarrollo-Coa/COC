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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Municipio {
  id: number
  nombre: string
  departamento_id: number
  departamento: string
}

interface Departamento {
  id: number
  nombre: string
}

export default function MunicipiosPage() {
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMunicipio, setEditingMunicipio] = useState<Municipio | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    departamento_id: "",
  })
  const { toast } = useToast()

  const loadMunicipios = async () => {
    try {
      const response = await fetch("/api/novedades/configuracion/municipios")
      if (!response.ok) throw new Error("Error al cargar municipios")
      const data = await response.json()
      setMunicipios(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los municipios",
        variant: "destructive",
      })
    }
  }

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
    loadMunicipios()
    loadDepartamentos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingMunicipio
        ? `/api/novedades/configuracion/municipios/${editingMunicipio.id}`
        : "/api/novedades/configuracion/municipios"
      
      const method = editingMunicipio ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_municipio: formData.nombre,
          id_departamento: parseInt(formData.departamento_id),
        }),
      })

      if (!response.ok) throw new Error("Error al guardar municipio")

      await loadMunicipios()
      setIsDialogOpen(false)
      setFormData({
        nombre: "",
        departamento_id: "",
      })
      setEditingMunicipio(null)

      toast({
        title: "Éxito",
        description: `Municipio ${editingMunicipio ? "actualizado" : "creado"} exitosamente`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el municipio",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (municipio: Municipio) => {
    setEditingMunicipio(municipio)
    setFormData({
      nombre: municipio.nombre,
      departamento_id: municipio.departamento_id.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este municipio?")) return

    try {
      const response = await fetch(
        `/api/novedades/configuracion/municipios/${id}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) throw new Error("Error al eliminar municipio")

      await loadMunicipios()
      toast({
        title: "Éxito",
        description: "Municipio eliminado exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el municipio",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Municipios</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Nuevo Municipio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMunicipio ? "Editar Municipio" : "Nuevo Municipio"}
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
              <div>
                <label className="text-sm font-medium">Departamento</label>
                <Select
                  value={formData.departamento_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, departamento_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map((departamento) => (
                      <SelectItem key={departamento.id} value={departamento.id.toString()}>
                        {departamento.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setFormData({
                      nombre: "",
                      departamento_id: "",
                    })
                    setEditingMunicipio(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingMunicipio ? "Actualizar" : "Crear"}
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
            <TableHead>Departamento</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {municipios.map((municipio) => (
            <TableRow key={`municipio-${municipio.id}`}>
              <TableCell>{municipio.id}</TableCell>
              <TableCell>{municipio.nombre}</TableCell>
              <TableCell>{municipio.departamento}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(municipio)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(municipio.id)}
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