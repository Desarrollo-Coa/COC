'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, Plus } from 'lucide-react'

interface UnidadNegocio {
  id_unidad: number
  nombre_unidad: string
  id_zona: number
  nombre_zona?: string
}

interface Zona {
  id_zona: number
  nombre_zona: string
}

export default function UnidadesNegocioPage() {
  const [unidades, setUnidades] = useState<UnidadNegocio[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    nombre_unidad: '',
    id_zona: ''
  })

  useEffect(() => {
    fetchUnidades()
    fetchZonas()
  }, [])

  const fetchUnidades = async () => {
    try {
      const response = await fetch('/api/novedades/configuracion/unidades-negocio')
      if (!response.ok) {
        throw new Error('Error al cargar unidades')
      }
      const data = await response.json()
      setUnidades(data)
    } catch (error) {
      console.error('Error al cargar unidades:', error)
    }
  }

  const fetchZonas = async () => {
    try {
      const response = await fetch('/api/novedades/negocios')
      const data = await response.json()
      setZonas(data)
    } catch (error) {
      console.error('Error al cargar zonas:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId 
        ? `/api/novedades/configuracion/unidades-negocio/${editingId}`
        : '/api/novedades/configuracion/unidades-negocio'
      
      const method = editingId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Error al guardar unidad')
      }

      await fetchUnidades()
      resetForm()
    } catch (error) {
      console.error('Error al guardar unidad:', error)
    }
  }

  const handleEdit = (unidad: UnidadNegocio) => {
    setEditingId(unidad.id_unidad)
    setFormData({
      nombre_unidad: unidad.nombre_unidad,
      id_zona: unidad.id_zona.toString()
    })
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar esta unidad de negocio?')) {
      try {
        const response = await fetch(`/api/novedades/configuracion/unidades-negocio/${id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Error al eliminar unidad')
        }

        await fetchUnidades()
      } catch (error) {
        console.error('Error al eliminar unidad:', error)
      }
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      nombre_unidad: '',
      id_zona: ''
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Unidades de Negocio</h1>
        <Button onClick={resetForm}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Unidad
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre de la Unidad</label>
            <Input
              value={formData.nombre_unidad}
              onChange={(e) => setFormData({ ...formData, nombre_unidad: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Zona</label>
            <Select
              value={formData.id_zona}
              onValueChange={(value) => setFormData({ ...formData, id_zona: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una zona" />
              </SelectTrigger>
              <SelectContent>
                {zonas.map((zona) => (
                  <SelectItem key={zona.id_zona} value={zona.id_zona.toString()}>
                    {zona.nombre_zona}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={resetForm}>
            Cancelar
          </Button>
          <Button type="submit">
            {editingId ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Zona</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {unidades.map((unidad) => (
            <TableRow key={`unidad-${unidad.id_unidad}`}>
              <TableCell>{unidad.id_unidad}</TableCell>
              <TableCell>{unidad.nombre_unidad}</TableCell>
              <TableCell>{unidad.nombre_zona}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(unidad)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(unidad.id_unidad)}
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