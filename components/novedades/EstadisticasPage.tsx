'use client'

import { useState, useEffect } from 'react'
import { Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import React from 'react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface Negocio {
  id_negocio: number
  nombre_negocio: string
}

interface DatosPorAnio {
  nombre: number
  cantidad: number
}

interface DatosPorTipo {
  nombre: string
  cantidad: number
  porcentaje: number
}

interface DatosPorPlanta {
  nombre: string
  cantidad: number
}

interface Evento {
  id_novedad: number
  consecutivo: string
  fecha_novedad: string
  hora_novedad: string
  descripcion: string
  gestion: string
  tipo_novedad: string
  nivel_criticidad: string
  planta: string
  archivos: { url_archivo: string }[]
}

export default function EstadisticasPage() {
  const { toast } = useToast()
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<string>('')
  const [datosPorAnio, setDatosPorAnio] = useState<DatosPorAnio[]>([])
  const [datosPorTipo, setDatosPorTipo] = useState<DatosPorTipo[]>([])
  const [datosPorPlanta, setDatosPorPlanta] = useState<DatosPorPlanta[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [eventosSeleccionados, setEventosSeleccionados] = useState<Evento[]>([])
  const [vistaActual, setVistaActual] = useState<'comparativa' | 'plantas'>('comparativa')

  useEffect(() => {
    const fetchNegocios = async () => {
      try {
        const response = await fetch('/api/negocios')
        const data = await response.json()
        setNegocios(data)
        if (data.length > 0) {
          setNegocioSeleccionado(data[0].nombre_negocio)
        }
      } catch (error) {
        console.error('Error al obtener negocios:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los negocios"
        })
      }
    }

    fetchNegocios()
  }, [toast])

  useEffect(() => {
    const fetchData = async () => {
      if (!negocioSeleccionado) return

      setLoading(true)
      try {
        const [anioRes, tipoRes, plantaRes] = await Promise.all([
          fetch(`/api/novedades/estadisticas?filtroTemporal=anual&negocio=${negocioSeleccionado}`),
          fetch(`/api/novedades/estadisticas?filtroTemporal=tipo&negocio=${negocioSeleccionado}`),
          fetch(`/api/novedades/estadisticas?filtroTemporal=planta&negocio=${negocioSeleccionado}`)
        ])
        
        const [anioData, tipoData, plantaData] = await Promise.all([
          anioRes.json(),
          tipoRes.json(),
          plantaRes.json()
        ])

        setDatosPorAnio(Array.isArray(anioData) ? anioData : [])
        setDatosPorTipo(Array.isArray(tipoData) ? tipoData : [])
        setDatosPorPlanta(Array.isArray(plantaData) ? plantaData : [])
      } catch (error) {
        console.error('Error al obtener datos:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las estadísticas"
        })
        setDatosPorAnio([])
        setDatosPorTipo([])
        setDatosPorPlanta([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast, negocioSeleccionado])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    }
  }

  const barChartData = {
    labels: datosPorAnio.map(item => item.nombre.toString()),
    datasets: [
      {
        label: 'Novedades',
        data: datosPorAnio.map(item => item.cantidad),
        backgroundColor: 'rgba(136, 132, 216, 0.5)',
        borderColor: 'rgba(136, 132, 216, 1)',
        borderWidth: 1
      }
    ]
  }

  const pieChartData = {
    labels: datosPorTipo.map(item => item.nombre),
    datasets: [
      {
        data: datosPorTipo.map(item => item.cantidad),
        backgroundColor: [
          'rgba(0, 136, 254, 0.5)',
          'rgba(0, 196, 159, 0.5)',
          'rgba(255, 187, 40, 0.5)',
          'rgba(255, 128, 66, 0.5)',
          'rgba(136, 132, 216, 0.5)'
        ],
        borderColor: [
          'rgba(0, 136, 254, 1)',
          'rgba(0, 196, 159, 1)',
          'rgba(255, 187, 40, 1)',
          'rgba(255, 128, 66, 1)',
          'rgba(136, 132, 216, 1)'
        ],
        borderWidth: 1
      }
    ]
  }

  const plantasChartData = {
    labels: datosPorPlanta.map(item => item.nombre),
    datasets: [
      {
        label: 'Novedades',
        data: datosPorPlanta.map(item => item.cantidad),
        backgroundColor: 'rgba(136, 132, 216, 0.5)',
        borderColor: 'rgba(136, 132, 216, 1)',
        borderWidth: 1
      }
    ]
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto h-screen">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Menú lateral */}
        <aside className="w-full lg:w-64 bg-white rounded-lg shadow p-4 mt-4 lg:mt-8">
          <h2 className="text-lg font-bold mb-4">Vistas</h2>
          <div className="flex lg:flex-col gap-2 lg:space-y-2">
            <button
              className={`flex-1 lg:w-full text-center lg:text-left px-4 py-2 rounded ${
                vistaActual === 'comparativa' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
              onClick={() => setVistaActual('comparativa')}
            >
              Comparativa de Novedades
            </button>
            <button
              className={`flex-1 lg:w-full text-center lg:text-left px-4 py-2 rounded ${
                vistaActual === 'plantas' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
              onClick={() => setVistaActual('plantas')}
            >
              Novedades por Plantas
            </button>
          </div>
        </aside>

        {/* Contenido principal */}
        <div className="flex-1 h-full pt-4 lg:pt-8">
          <div className="header mb-4">
            <div className="tabs flex flex-wrap justify-center lg:justify-start gap-2 lg:gap-0">
              {negocios.map((negocio, index) => (
                <React.Fragment key={negocio.id_negocio}>
                <span
                  className={`cursor-pointer px-2 lg:px-4 font-bold ${
                      negocioSeleccionado === negocio.nombre_negocio ? 'text-blue-600' : ''
                  }`}
                    onClick={() => setNegocioSeleccionado(negocio.nombre_negocio)}
                >
                    {negocio.nombre_negocio}
                </span>
                  {index < negocios.length - 1 && <span>|</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
          <hr />

          {vistaActual === 'comparativa' ? (
            <div className="bg-white rounded-lg shadow p-4 lg:p-6 mt-4 h-[calc(100%-6rem)]">
              <h3 className="text-xl font-bold mb-3">Comparativa de Novedades</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gráfico de Barras - Novedades por Año */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h4 className="text-lg font-semibold mb-2">Novedades por Año</h4>
                  <p className="text-sm text-gray-500 mb-4">Total de novedades registradas por año</p>
                  <div className="h-[300px]">
                    <Bar data={barChartData} options={chartOptions} />
                  </div>
                </div>

                {/* Gráfico Circular - Novedades por Tipo */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h4 className="text-lg font-semibold mb-2">Distribución por Tipo</h4>
                  <p className="text-sm text-gray-500 mb-4">Porcentaje de novedades por tipo</p>
                  <div className="h-[300px]">
                    <Pie data={pieChartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-4 lg:p-6 mt-4 h-[calc(100%-6rem)]">
              <h3 className="text-xl font-bold mb-3">Novedades por Plantas</h3>
              
              <div className="h-[400px]">
                <Bar data={plantasChartData} options={{
                  ...chartOptions,
                  indexAxis: 'y' as const,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      display: false
                    }
                  }
                }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Detalles de Novedades</h2>
              <div className="space-y-8">
                {eventosSeleccionados.map((evento) => (
                  <div key={evento.id_novedad} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-2xl font-bold mb-6">
                        {evento.tipo_novedad} - {evento.planta}
                      </h2>
                      
                      {evento.archivos && evento.archivos.length > 0 && (
                        <div className="mb-6">
                          <div className="flex gap-4 overflow-x-auto pb-4">
                            {evento.archivos.map((archivo, index) => (
                              <img
                                key={archivo.url_archivo}
                                src={archivo.url_archivo}
                                alt={`Evidencia`}
                                className="h-[300px] w-auto object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
                        <div className="flex gap-8 text-sm text-gray-600">
                          <p>
                            Fecha: {evento.fecha_novedad.split('T')[0].split('-').reverse().join('/')}
                          </p>
                          <p>
                            Hora: {evento.hora_novedad}
                          </p>
                        </div>
                        <div className="prose max-w-none">
                          <p className="text-gray-700 text-base leading-relaxed">
                            {evento.descripcion}
                          </p>
                          {evento.gestion && (
                            <p className="text-gray-700 text-base leading-relaxed mt-4">
                              {evento.gestion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 