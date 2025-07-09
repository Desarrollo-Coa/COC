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

interface Sede {
  id: number
  nombre: string
  departamento: string
  municipio: string
  zona: string
  tipo_negocio: string
  direccion: string
}

interface Departamento {
  id: number
  nombre: string
}

interface Municipio {
  id: number
  nombre: string
  departamento_id: number
}

interface Zona {
  id: number
  nombre: string
}

interface TipoNegocio {
  id: number
  nombre: string
}

export default function SedesPage() {
  const [sedes, setSedes] = useState<Sede[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [tiposNegocio, setTiposNegocio] = useState<TipoNegocio[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSede, setEditingSede] = useState<Sede | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    departamento_id: "",
    municipio_id: "",
    zona_id: "",
    tipo_negocio_id: "",
    direccion: "",
  })
  const { toast } = useToast()

  const loadSedes = async () => {
    try {
      const response = await fetch("/api/novedades/configuracion/sedes")
      if (!response.ok) throw new Error("Error al cargar sedes")
      const data = await response.json()
      setSedes(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las sedes",
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

  const loadMunicipios = async (departamentoId: string) => {
    try {
      const response = await fetch(`/api/novedades/configuracion/municipios?departamento_id=${departamentoId}`)
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
    loadSedes()
    loadDepartamentos()
    loadZonas()
    loadTiposNegocio()
  }, [])

  useEffect(() => {
    if (formData.departamento_id) {
      loadMunicipios(formData.departamento_id)
    }
  }, [formData.departamento_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingSede
        ? `/api/novedades/configuracion/sedes/${editingSede.id}`
        : "/api/novedades/configuracion/sedes"
      
      const method = editingSede ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_sede: formData.nombre,
          id_departamento: parseInt(formData.departamento_id),
          id_municipio: parseInt(formData.municipio_id),
          id_zona: parseInt(formData.zona_id),
          id_tipo_negocio: parseInt(formData.tipo_negocio_id),
          direccion: formData.direccion,
        }),
      })

      if (!response.ok) throw new Error("Error al guardar sede")

      await loadSedes()
      setIsDialogOpen(false)
      setFormData({
        nombre: "",
        departamento_id: "",
        municipio_id: "",
        zona_id: "",
        tipo_negocio_id: "",
        direccion: "",
      })
      setEditingSede(null)

      toast({
        title: "Éxito",
        description: `Sede ${editingSede ? "actualizada" : "creada"} exitosamente`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la sede",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (sede: Sede) => {
    setEditingSede(sede)
    setFormData({
      nombre: sede.nombre,
      departamento_id: sede.departamento,
      municipio_id: sede.municipio,
      zona_id: sede.zona,
      tipo_negocio_id: sede.tipo_negocio,
      direccion: sede.direccion,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta sede?")) return

    try {
      const response = await fetch(
        `/api/novedades/configuracion/sedes/${id}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) throw new Error("Error al eliminar sede")

      await loadSedes()
      toast({
        title: "Éxito",
        description: "Sede eliminada exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la sede",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sedes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Nueva Sede</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSede ? "Editar Sede" : "Nueva Sede"}
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
                    setFormData({ ...formData, departamento_id: value, municipio_id: "" })
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
              <div>
                <label className="text-sm font-medium">Municipio</label>
                <Select
                  value={formData.municipio_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, municipio_id: value })
                  }
                  required
                  disabled={!formData.departamento_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipios.map((municipio) => (
                      <SelectItem key={municipio.id} value={municipio.id.toString()}>
                        {municipio.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Zona</label>
                <Select
                  value={formData.zona_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, zona_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {zonas.map((zona) => (
                      <SelectItem key={zona.id} value={zona.id.toString()}>
                        {zona.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Tipo de Negocio</label>
                <Select
                  value={formData.tipo_negocio_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo_negocio_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un tipo de negocio" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposNegocio.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Dirección</label>
                <Input
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
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
                      departamento_id: "",
                      municipio_id: "",
                      zona_id: "",
                      tipo_negocio_id: "",
                      direccion: "",
                    })
                    setEditingSede(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSede ? "Actualizar" : "Crear"}
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
            <TableHead>Municipio</TableHead>
            <TableHead>Zona</TableHead>
            <TableHead>Tipo de Negocio</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sedes.map((sede) => (
            <TableRow key={`sede-${sede.id}`}>
              <TableCell>{sede.id}</TableCell>
              <TableCell>{sede.nombre}</TableCell>
              <TableCell>{sede.departamento}</TableCell>
              <TableCell>{sede.municipio}</TableCell>
              <TableCell>{sede.zona}</TableCell>
              <TableCell>{sede.tipo_negocio}</TableCell>
              <TableCell>{sede.direccion}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(sede)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(sede.id)}
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