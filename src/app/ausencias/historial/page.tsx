"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Filter, Download, Eye, Calendar, FileText } from "lucide-react"
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

export default function HistorialAusenciasPage() {
  const [ausencias, setAusencias] = useState<Ausencia[]>([])
  const [filteredAusencias, setFilteredAusencias] = useState<Ausencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState("all") // Updated default value
  const [negocioFilter, setNegocioFilter] = useState("all") // Updated default value

  useEffect(() => {
    fetch("/api/ausencias")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAusencias(data)
          setFilteredAusencias(data)
        } else {
          throw new Error("Formato de datos inválido")
        }
      })
      .catch((e) => setError("Error al cargar ausencias"))
      .finally(() => setLoading(false))
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
  }, [searchTerm, tipoFilter, negocioFilter, ausencias])

  const tiposUnicos = [...new Set(ausencias.map((a) => a.nombre_tipo_ausencia))]
  const negociosUnicos = [...new Set(ausencias.map((a) => a.nombre_negocio))]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
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
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/ausencias">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Historial de Ausencias</h1>
              <p className="text-slate-600">Consulte y gestione todas las ausencias registradas</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Link href="/ausencias/registro">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Registrar Nueva</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <SelectItem value="all">Todos los tipos</SelectItem> {/* Updated value prop */}
                    {tiposUnicos.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={negocioFilter} onValueChange={setNegocioFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Negocio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los negocios</SelectItem> {/* Updated value prop */}
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
                    setTipoFilter("all") // Updated default value
                    setNegocioFilter("all") // Updated default value
                  }}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
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
                <div className="space-y-4">
                  {filteredAusencias.map((ausencia) => (
                    <div
                      key={ausencia.id_ausencia}
                      className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {ausencia.nombre_colaborador} {ausencia.apellido_colaborador}
                            </h3>
                            <Badge className={getTipoColor(ausencia.nombre_tipo_ausencia)}>
                              {ausencia.nombre_tipo_ausencia}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-600">
                            <div>
                              <span className="font-medium">Negocio:</span>
                              <p>{ausencia.nombre_negocio}</p>
                            </div>
                            <div>
                              <span className="font-medium">Unidad:</span>
                              <p>{ausencia.nombre_unidad}</p>
                            </div>
                            <div>
                              <span className="font-medium">Puesto:</span>
                              <p>{ausencia.nombre_puesto}</p>
                            </div>
                            <div>
                              <span className="font-medium">Duración:</span>
                              <p>{calcularDias(ausencia.fecha_inicio, ausencia.fecha_fin)} día(s)</p>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-slate-700">Período:</span>
                              <p className="text-slate-600">
                                {formatFecha(ausencia.fecha_inicio)} - {formatFecha(ausencia.fecha_fin)}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Registrado:</span>
                              <p className="text-slate-600">{formatFecha(ausencia.fecha_registro)}</p>
                            </div>
                          </div>

                          {ausencia.descripcion && (
                            <div className="mt-3">
                              <span className="font-medium text-slate-700">Descripción:</span>
                              <p className="text-slate-600 mt-1">{ausencia.descripcion}</p>
                            </div>
                          )}

                          {ausencia.archivos && ausencia.archivos.length > 0 && (
                            <div className="mt-3">
                              <span className="font-medium text-slate-700">Archivos adjuntos:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {ausencia.archivos.map((archivo) => (
                                  <a
                                    key={archivo.id_archivo}
                                    href={archivo.url_archivo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    <FileText className="w-4 h-4" />
                                    {archivo.nombre_archivo}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
