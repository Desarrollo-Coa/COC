"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Search, Filter, Download, Eye, Calendar, FileText, Edit, Upload, X, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Ausencia {
  id_ausencia: number
  nombre_colaborador: string
  apellido_colaborador: string
  nombre_negocio: string
  nombre_unidad: string
  nombre_puesto: string
  nombre_tipo_ausencia: string
  fecha_inicio: string
  fecha_fin: string
  descripcion: string
  fecha_registro: string
  archivos: Array<{
    id_archivo: number
    url_archivo: string
    nombre_archivo: string
  }>
}

interface EditAusenciaData {
  id_ausencia: number
  nombre_tipo_ausencia: string
  descripcion: string
  archivos: File[]
  archivos_existentes: Array<{
    id_archivo: number
    url_archivo: string
    nombre_archivo: string
  }>
  archivos_eliminar: number[]
}

function formatFecha(fecha: string) {
  if (!fecha) return ""
  if (fecha.includes("T")) return fecha.split("T")[0]
  return fecha
}

function calcularDias(fechaInicio: string, fechaFin: string) {
  if (!fechaInicio || !fechaFin) return 0
  const inicio = new Date(fechaInicio)
  const fin = new Date(fechaFin)
  return Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

function getTipoColor(tipo: string) {
  switch (tipo.toLowerCase()) {
    case "enfermedad":
      return "bg-red-100 text-red-800 border-red-200"
    case "incumplimiento de horario":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "accidente laboral":
      return "bg-orange-100 text-orange-800 border-orange-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const ITEMS_PER_PAGE = 10

export default function HistorialAusenciasPage() {
  const [ausencias, setAusencias] = useState<Ausencia[]>([])
  const [filteredAusencias, setFilteredAusencias] = useState<Ausencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingAusencia, setEditingAusencia] = useState<EditAusenciaData | null>(null)
  const [saving, setSaving] = useState(false)
  const [todosLosTipos, setTodosLosTipos] = useState<any[]>([])

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState("all")
  const [negocioFilter, setNegocioFilter] = useState("all")

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar ausencias
        const ausenciasRes = await fetch("/api/ausencias");
        const ausenciasData = await ausenciasRes.json();
        if (Array.isArray(ausenciasData)) {
          setAusencias(ausenciasData);
          setFilteredAusencias(ausenciasData);
        } else {
          throw new Error("Formato de datos inválido");
        }

        // Cargar todos los tipos de ausencia
        const tiposRes = await fetch("/api/tipos-ausencia");
        const tiposData = await tiposRes.json();
        if (Array.isArray(tiposData)) {
          setTodosLosTipos(tiposData);
        }
      } catch (error) {
        setError("Error al cargar ausencias");
        console.error("Error al cargar tipos de ausencia:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [])

  useEffect(() => {
    let filtered = ausencias

    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          `${a.nombre_colaborador} ${a.apellido_colaborador}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.nombre_negocio.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.nombre_puesto.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (tipoFilter !== "all") {
      filtered = filtered.filter((a) => a.nombre_tipo_ausencia === tipoFilter)
    }

    if (negocioFilter !== "all") {
      filtered = filtered.filter((a) => a.nombre_negocio === negocioFilter)
    }

    setFilteredAusencias(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, tipoFilter, negocioFilter, ausencias])

  const tiposUnicos = [...new Set(ausencias.map((a) => a.nombre_tipo_ausencia))]
  const negociosUnicos = [...new Set(ausencias.map((a) => a.nombre_negocio))]

  // Paginación
  const totalPages = Math.ceil(filteredAusencias.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentAusencias = filteredAusencias.slice(startIndex, endIndex)

  const handleEdit = (ausencia: Ausencia) => {
    setEditingAusencia({
      id_ausencia: ausencia.id_ausencia,
      nombre_tipo_ausencia: ausencia.nombre_tipo_ausencia,
      descripcion: ausencia.descripcion,
      archivos: [],
      archivos_existentes: ausencia.archivos,
      archivos_eliminar: []
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingAusencia) return

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('id_ausencia', editingAusencia.id_ausencia.toString())
      formData.append('nombre_tipo_ausencia', editingAusencia.nombre_tipo_ausencia)
      formData.append('descripcion', editingAusencia.descripcion)
      
      // Agregar archivos nuevos
      editingAusencia.archivos.forEach((file, index) => {
        formData.append(`archivo_${index}`, file)
      })

      // Agregar archivos a eliminar
      if (editingAusencia.archivos_eliminar.length > 0) {
        formData.append('archivos_eliminar', JSON.stringify(editingAusencia.archivos_eliminar))
      }

      const response = await fetch(`/api/ausencias/${editingAusencia.id_ausencia}`, {
        method: 'PUT',
        body: formData
      })

      if (response.ok) {
        // Refresh data
        const updatedRes = await fetch("/api/ausencias");
        const updatedData = await updatedRes.json();
        if (Array.isArray(updatedData)) {
          setAusencias(updatedData)
        }
        setEditModalOpen(false)
        setEditingAusencia(null)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar')
      }
    } catch (error) {
      console.error('Error:', error)
      // Aquí podrías mostrar un toast de error
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && editingAusencia) {
      const files = Array.from(e.target.files)
      setEditingAusencia({
        ...editingAusencia,
        archivos: [...editingAusencia.archivos, ...files]
      })
    }
  }

  const removeFile = (index: number) => {
    if (editingAusencia) {
      setEditingAusencia({
        ...editingAusencia,
        archivos: editingAusencia.archivos.filter((_, i) => i !== index)
      })
    }
  }

  const removeExistingFile = (id_archivo: number) => {
    if (editingAusencia) {
      setEditingAusencia({
        ...editingAusencia,
        archivos_existentes: editingAusencia.archivos_existentes.filter(f => f.id_archivo !== id_archivo),
        archivos_eliminar: [...editingAusencia.archivos_eliminar, id_archivo]
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-64"></div>
            <div className="h-96 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/ausencias">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Volver al Dashboard</span>
                  <span className="sm:hidden">Volver</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Historial de Ausencias</h1>
                <p className="text-sm sm:text-base text-slate-600">Consulte y gestione todas las ausencias registradas</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              <Link href="/ausencias/registro">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <span className="hidden sm:inline">Registrar Nueva</span>
                  <span className="sm:hidden">Nueva</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar colaborador, negocio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de ausencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {todosLosTipos.map((tipo) => (
                      <SelectItem key={tipo.id_tipo_ausencia} value={tipo.nombre_tipo_ausencia}>
                        {tipo.nombre_tipo_ausencia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={negocioFilter} onValueChange={setNegocioFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Negocio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los negocios</SelectItem>
                    {negociosUnicos.map((negocio) => (
                      <SelectItem key={negocio} value={negocio}>
                        {negocio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setTipoFilter("all")
                    setNegocioFilter("all")
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm sm:text-base">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  Ausencias Registradas
                </span>
                <Badge variant="outline">{filteredAusencias.length} resultado(s)</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : filteredAusencias.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No se encontraron ausencias</p>
                </div>
              ) : (
                <>
                  {/* Vista compacta de tabla */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-medium text-xs sm:text-sm">Colaborador</th>
                          <th className="text-left py-3 px-4 font-medium text-xs sm:text-sm">Negocio</th>
                          <th className="text-left py-3 px-4 font-medium text-xs sm:text-sm">Tipo</th>
                          <th className="text-left py-3 px-4 font-medium text-xs sm:text-sm">Período</th>
                          <th className="text-left py-3 px-4 font-medium text-xs sm:text-sm">Duración</th>
                          <th className="text-center py-3 px-4 font-medium text-xs sm:text-sm">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentAusencias.map((ausencia) => (
                          <tr key={ausencia.id_ausencia} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <div className="font-medium text-xs sm:text-sm">
                                {ausencia.nombre_colaborador} {ausencia.apellido_colaborador}
                              </div>
                              <div className="text-xs text-slate-500">{ausencia.nombre_puesto}</div>
                            </td>
                            <td className="py-3 px-4 text-xs sm:text-sm">{ausencia.nombre_negocio}</td>
                            <td className="py-3 px-4">
                              <Badge className={`text-xs ${getTipoColor(ausencia.nombre_tipo_ausencia)}`}>
                                {ausencia.nombre_tipo_ausencia}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-xs sm:text-sm">
                              {formatFecha(ausencia.fecha_inicio)} - {formatFecha(ausencia.fecha_fin)}
                            </td>
                            <td className="py-3 px-4 text-xs sm:text-sm">
                              {calcularDias(ausencia.fecha_inicio, ausencia.fecha_fin)} día(s)
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(ausencia)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-slate-600">
                        Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAusencias.length)} de {filteredAusencias.length} resultados
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                            return (
                              <Button
                                key={page}
                                variant={page === currentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="w-8 h-8 p-0"
                              >
                                {page}
                              </Button>
                            )
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Edición */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ausencia</DialogTitle>
            <DialogDescription>
              Modifique el tipo de ausencia, descripción y archivos adjuntos.
            </DialogDescription>
          </DialogHeader>
          
          {editingAusencia && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo de Ausencia</Label>
                  <Select 
                    value={editingAusencia.nombre_tipo_ausencia} 
                    onValueChange={(value) => setEditingAusencia({...editingAusencia, nombre_tipo_ausencia: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {todosLosTipos.map((tipo) => (
                        <SelectItem key={tipo.id_tipo_ausencia} value={tipo.nombre_tipo_ausencia}>
                          {tipo.nombre_tipo_ausencia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={editingAusencia.descripcion}
                  onChange={(e) => setEditingAusencia({...editingAusencia, descripcion: e.target.value})}
                  placeholder="Descripción de la ausencia..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Archivos Adjuntos</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                    <Upload className="w-4 h-4 text-slate-400" />
                  </div>
                  
                  {/* Archivos existentes */}
                  {editingAusencia.archivos_existentes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Archivos existentes:</Label>
                      {editingAusencia.archivos_existentes.map((archivo) => (
                        <div key={archivo.id_archivo} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm truncate">{archivo.nombre_archivo}</span>
                          </div>
                          <div className="flex gap-1">
                            <a
                              href={archivo.url_archivo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Ver
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExistingFile(archivo.id_archivo)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Archivos nuevos */}
                  {editingAusencia.archivos.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Archivos nuevos:</Label>
                      {editingAusencia.archivos.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            <span className="text-sm truncate">{file.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
