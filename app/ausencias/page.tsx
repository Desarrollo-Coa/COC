"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Users, TrendingUp, FileText, Plus, History, BarChart3 } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import Link from "next/link"

interface DashboardStats {
  totalAusencias: number
  ausenciasEsteMes: number
  colaboradoresAfectados: number
  tiposAusencia: Array<{
    nombre: string
    cantidad: number
    porcentaje: number
  }>
  ausenciasPorNegocio: Array<{
    negocio: string
    cantidad: number
  }>
  colaboradoresConMasAusencias: Array<{
    nombre: string
    apellido: string
    negocio: string
    enfermedad: number
    incumplimiento: number
    accidente: number
    total: number
  }>
  tendenciaMensual: Array<{
    mes: string
    cantidad: number
  }>
  tendenciaDiaria: Array<{
    dia: string
    cantidad: number
  }>
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#3b82f6", "#f472b6", "#facc15"];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch("/api/ausencias/dashboard/stats");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setStats(data);
      } catch (error) {
        setError("Error al cargar estadísticas");
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-6 sm:p-8 text-center">
            <CardTitle className="text-red-600 mb-2">Error</CardTitle>
            <CardDescription>{error || "No se pudieron cargar las estadísticas"}</CardDescription>
          </Card>
        </div>
      </div>
    )
  }

  // Calculate the maximum Y-axis value (max bar value + 30%)
  const maxBarValue = Math.max(...stats.ausenciasPorNegocio.map(item => item.cantidad), 0);
  const yAxisMax = Math.ceil(maxBarValue * 1.3); // Add 30% to the max value

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard de Ausencias</h1>
              <p className="text-sm sm:text-base text-slate-600">Gestión y análisis de ausencias laborales</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link href="/ausencias/registro" className="w-full sm:w-auto">
                <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Registrar Ausencia</span>
                  <span className="sm:hidden">Registrar</span>
                </Button>
              </Link>
              <Link href="/ausencias/historial" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  <History className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Ver Historial</span>
                  <span className="sm:hidden">Historial</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium opacity-90">Total Ausencias</CardTitle>
                <CalendarDays className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats.totalAusencias}</div>
                <p className="text-xs opacity-90">Registradas en el sistema</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium opacity-90">Este Mes</CardTitle>
                <TrendingUp className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats.ausenciasEsteMes}</div>
                <p className="text-xs opacity-90">Ausencias registradas</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium opacity-90">Colaboradores</CardTitle>
                <Users className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats.colaboradoresAfectados}</div>
                <p className="text-xs opacity-90">Con ausencias registradas</p>
              </CardContent>
            </Card>

            {/* Elimina la tarjeta de Tipos Activos y reemplázala por el gráfico de barras de tipos de ausencia */}
            {/* Cambia el gráfico de tendencia mensual a barras */}
            {/* Agrega un nuevo gráfico de línea para tendencia diaria */}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Gráfico de barras de tipos de ausencia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  Ausencias por Tipo
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Cantidad de ausencias por tipo</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    cantidad: {
                      label: "Cantidad",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="!aspect-auto h-[250px] sm:h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.tiposAusencia} margin={{ top: 10, right: 5, left: 5, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="nombre" 
                        tick={{ fill: "#374151", fontSize: 9 }} 
                        interval={0}
                        height={60}
                        angle={-45}
                        textAnchor="end"
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: "#374151", fontSize: 9 }} 
                        width={30}
                        tickLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} label={{ position: "top", fill: "#1e293b", fontSize: 10, fontWeight: "bold", offset: 2 }}>
                        {stats.tiposAusencia.map((entry, index) => (
                          <Cell key={`cell-tipo-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Tendencia Mensual (barras por mes) - ahora en la segunda posición */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  Tendencia Mensual
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Ausencias por mes (enero, febrero, marzo, ...)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    cantidad: {
                      label: "Ausencias",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="!aspect-auto h-[250px] sm:h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.tendenciaMensual} margin={{ top: 10, right: 5, left: 5, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="mes" 
                        tick={{ fill: "#374151", fontSize: 9 }}
                        height={60}
                        angle={-45}
                        textAnchor="end"
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: "#374151", fontSize: 9 }} 
                        width={30}
                        tickLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cantidad" fill="#8b5cf6" radius={[4, 4, 0, 0]} label={{ position: "top", fill: "#1e293b", fontSize: 10, fontWeight: "bold", offset: 2 }}>
                        {stats.tendenciaMensual.map((entry, index) => (
                          <Cell key={`cell-mes-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Gráfico de barras de ausencias por negocio (ahora abajo y ocupa dos columnas) */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Ausencias por Negocio
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Cantidad de ausencias por unidad de negocio</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    cantidad: {
                      label: "Cantidad",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="!aspect-auto h-[250px] sm:h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.ausenciasPorNegocio} margin={{ top: 10, right: 5, left: 5, bottom: 70 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="negocio" 
                        tick={{ fill: "#374151", fontSize: 8 }} 
                        angle={-45} 
                        textAnchor="end" 
                        height={70}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fill: "#374151", fontSize: 9 }} 
                        width={30}
                        tickLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} label={{ position: "top", fill: "#1e293b", fontSize: 10, fontWeight: "bold", offset: 2 }}>
                        {stats.ausenciasPorNegocio.map((entry, index) => (
                          <Cell key={`cell-negocio-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Colaboradores con más ausencias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                Colaboradores con Más Ausencias
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Ranking de colaboradores por cantidad de ausencias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm">Colaborador</th>
                      <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm">Enfermedad</th>
                      <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm">Incumplimiento</th>
                      <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm">Accidente</th>
                      <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.colaboradoresConMasAusencias.map((colaborador, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <div className="font-medium text-xs sm:text-sm">
                            {colaborador.nombre} {colaborador.apellido}
                          </div>
                          <div className="text-xs text-slate-500 hidden sm:block">
                            {colaborador.negocio}
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                          <Badge variant={colaborador.enfermedad > 0 ? "destructive" : "secondary"} className="text-xs">
                            {colaborador.enfermedad}
                          </Badge>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                          <Badge variant={colaborador.incumplimiento > 0 ? "destructive" : "secondary"} className="text-xs">
                            {colaborador.incumplimiento}
                          </Badge>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                          <Badge variant={colaborador.accidente > 0 ? "destructive" : "secondary"} className="text-xs">
                            {colaborador.accidente}
                          </Badge>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                          <Badge variant="outline" className="font-bold text-xs">
                            {colaborador.total}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}