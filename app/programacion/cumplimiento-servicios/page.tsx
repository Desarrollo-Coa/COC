"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label" 
import { ChevronDown, User, ArrowLeft, Menu, Moon, Sun, List, Grid } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Pie, PieChart, Label as RechartsLabel } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { motion, AnimatePresence } from "framer-motion"  
import  Skeleton  from "@/components/ui/skeleton"  
import { DetailModal } from "@/components/DetailModal"

// Interfaces remain unchanged
interface Personnel {
  id: string
  name: string
  position: string
  shift: "diurno" | "nocturno" | "turno_b"
  unit: string
  isPresent: boolean
  fecha?: string
  foto_url?: string | null
}

interface Unit {
  id: string
  name: string
  percentage: number
  color: string
}

interface Puesto {
  id: number
  puesto: string
  unidad_negocio_id: string
  activo: boolean
}

interface PuestoData {
  nombre: string
  unidad_negocio_id: string
  diurno?: {
    colaborador?: {
      placa: string
      nombre: string
      foto_url?: string
    }
  }
  nocturno?: {
    colaborador?: {
      placa: string
      nombre: string
      foto_url?: string
    }
  }
  turno_b?: {
    colaborador?: {
      placa: string
      nombre: string
      foto_url?: string
    }
  }
}
  

interface Negocio {
  id_negocio: number
  nombre_negocio: string
}

 
const chartConfig: ChartConfig = {
  percentage: { label: "Porcentaje" },
  "terrenos-ndu": { label: "Terrenos NDU", color: "#3B82F6" },
  baru: { label: "Barú", color: "#10B981" },
  sator: { label: "Sator", color: "#8B5CF6" },
}

function CircularProgress({ percentage, isSelected, onClick, unit }: { percentage: number; isSelected: boolean; onClick: () => void; unit: Unit }) {
  const chartData = [
    { name: unit.id, value: percentage, fill: unit.color },
    { name: "rest", value: 100 - percentage, fill: "#E5E7EB" },
  ]

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center p-4 rounded-xl transition-all duration-300 cursor-pointer relative",
        isSelected 
          ? "dark:bg-gray-800 shadow-lg scale-105 border-2 border-blue-500" 
          : "opacity-70 hover:opacity-100 dark:bg-gray-800 hover:bg-gray-50 hover:shadow-sm hover:border hover:border-gray-200"
      )}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      role="button"
      aria-label={`Seleccionar ${unit.name}`}
    >
      {isSelected && (
        <div className="absolute inset-0 bg-blue-500/5 rounded-xl pointer-events-none" />
      )}
      <div className="relative w-[min(48vw,180px)] h-[min(48vw,180px)] sm:w-48 sm:h-48">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="75%"
              outerRadius="95%"
              strokeWidth={3}
              stroke="white"
            >
              <RechartsLabel
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const name = unit.name || "";
                    // Divide el nombre en líneas de máximo 18 caracteres, sin cortar palabras
                    const lines = [];
                    let current = "";
                    name.split(" ").forEach(word => {
                      if ((current + " " + word).trim().length > 18) {
                        if (current) lines.push(current.trim());
                        current = word;
                      } else {
                        current += " " + word;
                      }
                    });
                    if (current) lines.push(current.trim());

                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="text-2xl sm:text-3xl font-bold text-black dark:text-white"
                          style={{ fill: 'currentColor' }}
                        >
                          {percentage}%
                        </tspan>
                        {lines.map((line, idx) => (
                          <tspan
                            key={idx}
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24 + idx * 14}
                            className="text-xs sm:text-sm font-medium text-black dark:text-white"
                            style={{ fill: 'currentColor' }}
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
    </motion.div>
  )
}

function CircularProgressSkeleton() {
  return (
    <div className="flex flex-col items-center p-4 rounded-xl bg-white dark:bg-gray-800">
      <div className="relative w-[min(48vw,180px)] h-[min(48vw,180px)] sm:w-48 sm:h-48">
        <Skeleton className="w-full h-full rounded-full" />
      </div>
      <div className="mt-4 space-y-2 w-full">
        <Skeleton className="h-6 w-16 mx-auto" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </div>
    </div>
  )
}

function PersonnelListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-700 rounded-lg p-4 mx-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 flex-1" />
            <div className="flex gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CumplimientoServiciosCementos() {
  const router = useRouter()
  const carruselRef = useRef<HTMLDivElement>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedDay, setSelectedDay] = useState<string>(new Date().getDate().toString())
  const [selectedEndDay, setSelectedEndDay] = useState("")
  const [selectedPosition, setSelectedPosition] = useState<string>("")
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [showPersonnel, setShowPersonnel] = useState(false)
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [loadingPersonnel, setLoadingPersonnel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [puestos, setPuestos] = useState<any[]>([])
  const [dateRange, setDateRange] = useState<string>("")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [isViewModeLoaded, setIsViewModeLoaded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null)
  const [modalSelectedDay, setModalSelectedDay] = useState<number | null>(null)
   const [unitsState, setUnitsState] = useState<Unit[]>([])
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [negocioId, setNegocioId] = useState<string>("")
  const [cumplimiento, setCumplimiento] = useState<number>(0)
  const [zonesCompliance, setZonesCompliance] = useState<{ id: string, name: string, percentage: number, color: string }[]>([])
  const [isCementoModalOpen, setIsCementoModalOpen] = useState(false)
  const [cementoModalData, setCementoModalData] = useState<{ colaboradorId: string | null, fecha: string | null, puestoId: number | null }>({ colaboradorId: null, fecha: null, puestoId: null })

  // Nuevo estado para unidades y puestos
  const [unidadesRaw, setUnidadesRaw] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [unidadId, setUnidadId] = useState<string>("")
  const [puestoId, setPuestoId] = useState<string>("")

  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ]

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 3 }, (_, i) => (currentYear - 1 + i).toString())
  }, [])

  const availablePositions = useMemo(() => 
    puestos
      .filter(puesto => !selectedUnit || puesto.unidad_negocio_id === selectedUnit)
      .map(puesto => puesto.puesto),
    [puestos, selectedUnit]
  )

  const days = useMemo(() => 
    Array.from({ length: 31 }, (_, i) => (i + 1).toString()),
    []
  )

  const calculateUnitPercentage = useCallback((personnelData: Personnel[], unitId: string) => {
    // Filtrar el personal por unidad
    const unitPersonnel = personnelData.filter(p => p.unit === unitId)
    if (unitPersonnel.length === 0) return 0

    // Agrupar por posición para analizar cada puesto
    const puestosPorUnidad = unitPersonnel.reduce((acc, person) => {
      if (!acc[person.position]) {
        acc[person.position] = {
          diurno: false,
          nocturno: false,
          turno_b: false
        }
      }
      if (person.shift === "diurno") {
        acc[person.position].diurno = person.isPresent
      } else if (person.shift === "nocturno") {
        acc[person.position].nocturno = person.isPresent
      } else if (person.shift === "turno_b") {
        acc[person.position].turno_b = person.isPresent
      }
      return acc
    }, {} as Record<string, { diurno: boolean; nocturno: boolean; turno_b: boolean }>)

    // Calcular el porcentaje total
    const totalPuestos = Object.keys(puestosPorUnidad).length
    if (totalPuestos === 0) return 0

    // Cada puesto tiene 3 turnos posibles (diurno, nocturno, turno_b)
    const totalTurnosPosibles = totalPuestos * 3
    let turnosAsignados = 0

    // Contar los turnos asignados
    Object.values(puestosPorUnidad).forEach(({ diurno, nocturno, turno_b }) => {
      if (diurno) turnosAsignados++
      if (nocturno) turnosAsignados++
      if (turno_b) turnosAsignados++
    })

    // Calcular el porcentaje final
    // Cada turno asignado representa un porcentaje del total
    const porcentajeTotal = (turnosAsignados / totalTurnosPosibles) * 100

    return Math.round(porcentajeTotal)
  }, [])

  // Definir los turnos a mostrar
  const turnos = [
    { key: "diurno", label: "Diurno", color: "yellow" },
    { key: "turno_b", label: "Turno B", color: "green" },
    { key: "nocturno", label: "Nocturno", color: "blue" }
  ];

  const loadInitialData = useCallback(async () => {
    if (!negocioId) {
      setPersonnel([])
      setPuestos([])
      return
    }
    setLoadingPersonnel(true)
    try {
      const startDay = parseInt(selectedDay || "1")
      const endDay = parseInt(selectedEndDay)
      const personnelData: Personnel[] = []
      const unidadNegocioId = selectedUnit
      // Si hay un rango de días y un puesto seleccionado, cargar datos para cada día
      if (selectedPosition && startDay && endDay) {
        const promises = []
        for (let day = startDay; day <= endDay; day++) {
          const fecha = `${selectedYear}-${(months.indexOf(selectedMonth) + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
          let reporteUrl = `/api/cumplimiento-servicios?fecha=${fecha}&negocioId=${negocioId}`
          if (unidadNegocioId) reporteUrl += `&unidadNegocioId=${unidadNegocioId}`
          promises.push(fetch(reporteUrl, { cache: 'no-store' }))
        }
        const responses = await Promise.all(promises)
        const reportesData = await Promise.all(responses.map(res => res.json()))
        reportesData.forEach((reporteData, index) => {
          const day = startDay + index
          const reportePuestos = reporteData.puestos || {}
          const puestoData = Object.entries(reportePuestos).find(([_, data]: [string, any]) => 
            data.nombre_puesto === selectedPosition
          )?.[1] as PuestoData | undefined
          if (puestoData) {
            const fecha = `${selectedYear}-${(months.indexOf(selectedMonth) + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
            personnelData.push({
              id: typeof puestoData?.diurno?.colaborador === 'object' ? puestoData?.diurno?.colaborador?.placa || `empty-diurno-${day}` : puestoData?.diurno?.colaborador || `empty-diurno-${day}`,
              name: typeof puestoData?.diurno?.colaborador === 'object' ? puestoData?.diurno?.colaborador?.nombre || "Sin asignar" : puestoData?.diurno?.colaborador || "Sin asignar",
              position: selectedPosition,
              shift: "diurno",
              unit: unidadNegocioId || "zona",
              isPresent: !!puestoData?.diurno?.colaborador,
              fecha: fecha,
              foto_url: typeof puestoData?.diurno?.colaborador === 'object' ? puestoData?.diurno?.colaborador?.foto_url || null : null
            })
            // Turno B
            if (puestoData?.turno_b?.colaborador) {
              personnelData.push({
                id: typeof puestoData?.turno_b?.colaborador === 'object' ? puestoData?.turno_b?.colaborador?.placa || `empty-turno_b-${day}` : puestoData?.turno_b?.colaborador || `empty-turno_b-${day}`,
                name: typeof puestoData?.turno_b?.colaborador === 'object' ? puestoData?.turno_b?.colaborador?.nombre || "Sin asignar" : puestoData?.turno_b?.colaborador || "Sin asignar",
                position: selectedPosition,
                shift: "turno_b",
                unit: unidadNegocioId || "zona",
                isPresent: !!puestoData?.turno_b?.colaborador,
                fecha: fecha,
                foto_url: typeof puestoData?.turno_b?.colaborador === 'object' ? puestoData?.turno_b?.colaborador?.foto_url || null : null
              })
            }
            personnelData.push({
              id: typeof puestoData?.nocturno?.colaborador === 'object' ? puestoData?.nocturno?.colaborador?.placa || `empty-nocturno-${day}` : puestoData?.nocturno?.colaborador || `empty-nocturno-${day}`,
              name: typeof puestoData?.nocturno?.colaborador === 'object' ? puestoData?.nocturno?.colaborador?.nombre || "Sin asignar" : puestoData?.nocturno?.colaborador || "Sin asignar",
              position: selectedPosition,
              shift: "nocturno",
              unit: unidadNegocioId || "zona",
              isPresent: !!puestoData?.nocturno?.colaborador,
              fecha: fecha,
              foto_url: typeof puestoData?.nocturno?.colaborador === 'object' ? puestoData?.nocturno?.colaborador?.foto_url || null : null
            })
          }
        })
        setPersonnel(personnelData)
      } else {
        // Cargar datos para un solo día (comportamiento original)
        const fecha = `${selectedYear}-${(months.indexOf(selectedMonth) + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`
        let reporteUrl = `/api/cumplimiento-servicios?fecha=${fecha}&negocioId=${negocioId}`
        if (unidadNegocioId) reporteUrl += `&unidadNegocioId=${unidadNegocioId}`
        const reporteRes = await fetch(reporteUrl, { cache: 'no-store' })
        if (!reporteRes.ok) throw new Error(`Error al cargar datos: ${await reporteRes.text()}`)
        const reporteData = await reporteRes.json()
        const reportePuestos = reporteData.puestos || {}
        const allPuestosData: any[] = []
        Object.entries(reportePuestos).forEach(([id, data]: [string, any]) => {
          const unidadId = data.unidad_negocio_id?.toString() || unidadNegocioId || negocioId
          allPuestosData.push({
            id: parseInt(id),
            puesto: data.nombre_puesto,
            unidad_negocio_id: unidadId,
            activo: true,
          })
          personnelData.push({
            id: typeof data?.diurno?.colaborador === 'object' ? data?.diurno?.colaborador?.placa || `empty-diurno-${id}` : data?.diurno?.colaborador || `empty-diurno-${id}`,
            name: typeof data?.diurno?.colaborador === 'object' ? data?.diurno?.colaborador?.nombre || "Sin asignar" : data?.diurno?.colaborador || "Sin asignar",
            position: data.nombre_puesto,
            shift: "diurno",
            unit: unidadId,
            isPresent: !!data?.diurno?.colaborador,
            fecha: fecha,
            foto_url: typeof data?.diurno?.colaborador === 'object' ? data?.diurno?.colaborador?.foto_url || null : null
          })
          // Turno B
          if (data?.turno_b?.colaborador) {
            personnelData.push({
              id: typeof data?.turno_b?.colaborador === 'object' ? data?.turno_b?.colaborador?.placa || `empty-turno_b-${id}` : data?.turno_b?.colaborador || `empty-turno_b-${id}`,
              name: typeof data?.turno_b?.colaborador === 'object' ? data?.turno_b?.colaborador?.nombre || "Sin asignar" : data?.turno_b?.colaborador || "Sin asignar",
              position: data.nombre_puesto,
              shift: "turno_b",
              unit: unidadId,
              isPresent: !!data?.turno_b?.colaborador,
              fecha: fecha,
              foto_url: typeof data?.turno_b?.colaborador === 'object' ? data?.turno_b?.colaborador?.foto_url || null : null
            })
          }
          personnelData.push({
            id: typeof data?.nocturno?.colaborador === 'object' ? data?.nocturno?.colaborador?.placa || `empty-nocturno-${id}` : data?.nocturno?.colaborador || `empty-nocturno-${id}`,
            name: typeof data?.nocturno?.colaborador === 'object' ? data?.nocturno?.colaborador?.nombre || "Sin asignar" : data?.nocturno?.colaborador || "Sin asignar",
            position: data.nombre_puesto,
            shift: "nocturno",
            unit: unidadId,
            isPresent: !!data?.nocturno?.colaborador,
            fecha: fecha,
            foto_url: typeof data?.nocturno?.colaborador === 'object' ? data?.nocturno?.colaborador?.foto_url || null : null
          })
        })
        setPuestos(allPuestosData)
        setPersonnel(personnelData)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar los datos')
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoadingPersonnel(false)
    }
  }, [negocioId, selectedYear, selectedMonth, selectedDay, selectedEndDay, selectedPosition, selectedUnit])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Si el puesto seleccionado no está disponible en la unidad actual, limpiarlo
  useEffect(() => {
    if (selectedPosition && !availablePositions.includes(selectedPosition)) {
      setSelectedPosition("")
    }
  }, [availablePositions, selectedPosition])

  const handleUnitClick = useCallback((unitId: string) => {
    setSelectedUnit(selectedUnit === unitId ? null : unitId)
    setSelectedEndDay("")
    setIsMobileMenuOpen(false)

    // Desplazamiento automático al gráfico seleccionado
    const carrusel = carruselRef.current
    if (carrusel) {
      const selectedChart = carrusel.querySelector(`[data-unit-id="${unitId}"]`) as HTMLElement
      if (selectedChart) {
        const containerRect = carrusel.getBoundingClientRect()
        const elementRect = selectedChart.getBoundingClientRect()
        const scrollLeft = elementRect.left - containerRect.left - (containerRect.width - elementRect.width) / 2
        
        carrusel.scrollTo({
          left: carrusel.scrollLeft + scrollLeft,
          behavior: 'smooth'
        })
      }
    }
  }, [selectedUnit])

  const handlePositionChange = useCallback((value: string) => {
    setSelectedPosition(value)
    setSelectedEndDay("")
    
    // Encontrar la unidad correspondiente al puesto seleccionado
    if (value) {
      const puesto = puestos.find(p => p.puesto === value)
      if (puesto) {
        const unidadId = puesto.unidad_negocio_id;
        if (unidadId) {
          setSelectedUnit(unidadId)
        }
      }
    }
  }, [puestos])

  const togglePositionExpansion = useCallback((position: string) => {
    setExpandedPositions(prev => {
      const newSet = new Set(prev)
      newSet.has(position) ? newSet.delete(position) : newSet.add(position)
      return newSet
    })
  }, [])

  const handleDayChange = useCallback((value: string) => {
    const day = parseInt(value)
    if (value === "" || (day > 0 && day <= 31)) {
      setSelectedDay(day.toString())
      // Si el día final es menor que el día inicial, resetearlo
      if (selectedEndDay && parseInt(selectedEndDay) < day) {
        setSelectedEndDay("")
      }
    }
  }, [selectedEndDay])

  const handleEndDayChange = useCallback((value: string) => {
    const day = parseInt(value)
    const startDay = parseInt(selectedDay)
    if (value === "" || (day > 0 && day <= 31 && day >= startDay)) {
      setSelectedEndDay(value)
    }
  }, [selectedDay])

  const handleDateRangeChange = useCallback((value: string) => {
    if (/^\d{1,2}-\d{1,2}$/.test(value)) setDateRange(value)
    else setDateRange("")
  }, [])

  const handleClearFilters = useCallback(() => {
    setSelectedMonth(new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase())
    setSelectedYear(new Date().getFullYear().toString())
    setSelectedDay(new Date().getDate().toString())
    setSelectedEndDay("")
    setSelectedPosition("")
    setDateRange("")
    setSelectedUnit(null)
    setExpandedPositions(new Set())
    setIsMobileMenuOpen(false)
    setNegocioId("")
  }, [])

  const filteredPersonnel = useMemo(() => 
    personnel.filter(person => 
      (!selectedUnit || person.unit === selectedUnit) &&
      (!selectedPosition || person.position === selectedPosition)
    ),
    [personnel, selectedUnit, selectedPosition]
  )

  // Agrupación de personal por puesto y turno (incluyendo turno_b)
  const groupedPersonnel = useMemo(() => 
    filteredPersonnel.reduce((acc, person) => {
      acc[person.position] = acc[person.position] || { diurno: [], turno_b: [], nocturno: [] }
      acc[person.position][person.shift].push(person)
      return acc
    }, {} as Record<string, { diurno: Personnel[]; turno_b: Personnel[]; nocturno: Personnel[] }>),
    [filteredPersonnel]
  )

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev)
    document.documentElement.classList.toggle('dark')
  }, [])

  // Efecto para cargar las preferencias desde localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('viewMode')
    const savedShowPersonnel = localStorage.getItem('showPersonnel')
    
    if (savedViewMode === 'list' || savedViewMode === 'grid') {
      setViewMode(savedViewMode)
    }
    
    if (savedShowPersonnel !== null) {
      setShowPersonnel(savedShowPersonnel === 'true')
    }
    
    setIsViewModeLoaded(true)
  }, [])

  // Efecto para guardar viewMode en localStorage
  useEffect(() => {
    if (isViewModeLoaded) {
      localStorage.setItem('viewMode', viewMode)
    }
  }, [viewMode, isViewModeLoaded])

  // Efecto para guardar showPersonnel en localStorage
  useEffect(() => {
    if (isViewModeLoaded) {
      localStorage.setItem('showPersonnel', showPersonnel.toString())
    }
  }, [showPersonnel, isViewModeLoaded])

  // Efecto para expandir todos los puestos cuando showPersonnel está activado
  useEffect(() => {
    if (showPersonnel) {
      const allPositions = new Set(Object.keys(groupedPersonnel))
      setExpandedPositions(allPositions)
    } else {
      setExpandedPositions(new Set())
    }
  }, [showPersonnel, groupedPersonnel])

  const handlePersonnelClick = useCallback(async (person: Personnel) => {
    // Solo abrir el modal si hay colaborador asignado
    if (!person.isPresent) return;
    
    // En cementos, el colaboradorId es la placa del colaborador (string)
    // No necesitamos convertirlo a número
    setCementoModalData({
      colaboradorId: person.id, // La placa del colaborador
      fecha: person.fecha || null,
      puestoId: (() => {
        // Buscar el puestoId por nombre de puesto
        const puesto = puestos.find(p => p.puesto === person.position);
        return puesto ? puesto.id : null;
      })(),
    });
    setIsCementoModalOpen(true);
  }, [puestos]);

  const isValidUnit = (unit: string): unit is "terrenos-ndu" | "baru" | "sator" => {
    return ["terrenos-ndu", "baru", "sator"].includes(unit)
      }

  // Cargar zonas al inicio
  useEffect(() => {
    const fetchNegocios = async () => {
      try {
        const res = await fetch("/api/negocios");
        const data = await res.json();
        setNegocios(data);
      } catch (error) {
        console.error('Error cargando negocios:', error);
        toast.error("Error al cargar negocios");
      }
    };
    
    fetchNegocios();
  }, [])

  // Calcular cumplimiento al cambiar personnel
  useEffect(() => {
    if (!negocioId) {
      setCumplimiento(0)
      return
    }
    // Calcular cumplimiento: turnos cubiertos / turnos posibles
    const totalTurnos = personnel.length
    const turnosCubiertos = personnel.filter(p => p.isPresent).length
    setCumplimiento(totalTurnos > 0 ? Math.round((turnosCubiertos / totalTurnos) * 100) : 0)
  }, [personnel, negocioId])

  // Cargar unidades de negocio al cambiar zona y fecha
  useEffect(() => {
    const fetchUnidades = async () => {
      if (!negocioId) {
        setUnidadesRaw([])
        setUnidades([])
        setUnidadId("")
        setSelectedPosition("")
        return
      }
      
      try {
        const res = await fetch(`/api/settings/unidades-negocio?id_negocio=${negocioId}`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setUnidadesRaw(data)
          const colores = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E42", "#F43F5E", "#6366F1"]
          const fecha = `${selectedYear}-${(months.indexOf(selectedMonth) + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`
          const unidadesConCumplimiento = await Promise.all(
            data.map(async (unidad, idx) => {
              const res = await fetch(`/api/cumplimiento-servicios?fecha=${fecha}&negocioId=${negocioId}&unidadNegocioId=${unidad.id_unidad}`)
              const datos = await res.json()
              let porcentaje = 0
              if (datos && datos.puestos) {
                const puestos = Object.values(datos.puestos)
                const totalTurnos = puestos.length * 3 // Ajustado para 3 turnos
                let turnosCubiertos = 0
                puestos.forEach((p: any) => {
                  if (p.diurno?.colaborador) turnosCubiertos++
                  if (p.turno_b?.colaborador) turnosCubiertos++
                  if (p.nocturno?.colaborador) turnosCubiertos++
                })
                porcentaje = totalTurnos > 0 ? Math.round((turnosCubiertos / totalTurnos) * 100) : 0
              }
              return {
                id: unidad.id_unidad.toString(),
                name: unidad.nombre_unidad,
                percentage: porcentaje,
                color: colores[idx % colores.length]
              }
            })
          )
          setUnidades(unidadesConCumplimiento)
          setSelectedUnit(null)
          setSelectedPosition("")
        }
      } catch (error) {
        console.error('Error cargando unidades de negocio:', error);
        setUnidadesRaw([])
        setUnidades([])
        toast.error("Error al cargar unidades de negocio")
      }
    };
    
    fetchUnidades();
  }, [negocioId, selectedYear, selectedMonth, selectedDay])

  // Cargar puestos dinámicamente al seleccionar unidad
  useEffect(() => {
    const fetchPuestos = async () => {
      if (!unidadId) {
        setPuestos([])
        setPuestoId("")
        return
      }
      
      try {
        const res = await fetch(`/api/puestos?unidadId=${unidadId}`);
        const data = await res.json();
        setPuestos(data);
      } catch (error) {
        console.error('Error cargando puestos:', error);
        toast.error("Error al cargar puestos");
      }
    };
    
    fetchPuestos();
  }, [unidadId])

  // Calcular cumplimiento general por zona al inicio o cuando cambian fechas
  useEffect(() => {
    if (negocioId) return // Solo si NO hay zona seleccionada
    if (negocios.length === 0) return
    const colores = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E42", "#F43F5E", "#6366F1"]
    const fecha = `${selectedYear}-${(months.indexOf(selectedMonth) + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`
    const fetchZonesCompliance = async () => {
      try {
        const zonesData = await Promise.all(
          negocios.map(async (negocio, idx) => {
            const res = await fetch(`/api/cumplimiento-servicios?fecha=${fecha}&negocioId=${negocio.id_negocio}`)
            const datos = await res.json()
            let porcentaje = 0
            if (datos && datos.puestos) {
              const puestos = Object.values(datos.puestos)
              const totalTurnos = puestos.length * 3 // Ajustado para 3 turnos
              let turnosCubiertos = 0
              puestos.forEach((p: any) => {
                if (p.diurno?.colaborador) turnosCubiertos++
                if (p.turno_b?.colaborador) turnosCubiertos++
                if (p.nocturno?.colaborador) turnosCubiertos++
              })
              porcentaje = totalTurnos > 0 ? Math.round((turnosCubiertos / totalTurnos) * 100) : 0
            }
            return {
              id: negocio.id_negocio.toString(),
              name: negocio.nombre_negocio,
              percentage: porcentaje,
              color: colores[idx % colores.length]
            }
          })
        );
        setZonesCompliance(zonesData);
      } catch (error) {
        console.error('Error calculando cumplimiento por zona:', error);
      }
    };
    
    fetchZonesCompliance();
  }, [negocios, negocioId, selectedYear, selectedMonth, selectedDay])

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300", isDarkMode && "dark")}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="mr-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Volver atrás"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                Cumplimiento de Servicios
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-sm sticky top-20 border-none dark:bg-gray-800">
              <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Filtros</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="negocio" className="text-sm font-medium text-gray-700 dark:text-gray-300">Negocio</Label>
                  <Select value={negocioId} onValueChange={setNegocioId}>
                    <SelectTrigger className="h-10 bg-white dark:bg-gray-700">
                      <SelectValue placeholder="Seleccionar negocio" />
                    </SelectTrigger>
                    <SelectContent>
                      {negocios
                        .filter(n => n.id_negocio !== undefined)
                        .map(n => (
                          <SelectItem key={n.id_negocio} value={n.id_negocio.toString()}>{n.nombre_negocio}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day" className="text-sm font-medium text-gray-700 dark:text-gray-300">Día</Label>
                  <Select value={selectedDay} onValueChange={setSelectedDay}>
                    <SelectTrigger className="h-10 bg-white dark:bg-gray-700">
                      <SelectValue placeholder="Día" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month" className="text-sm font-medium text-gray-700 dark:text-gray-300">Mes</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="h-10 bg-white dark:bg-gray-700">
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, idx) => (
                        <SelectItem key={month} value={month}>{month.padStart(2, "0")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                  <div className="space-y-2">
                  <Label htmlFor="year" className="text-sm font-medium text-gray-700 dark:text-gray-300">Año</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-700">
                      <SelectValue placeholder="Año" />
                      </SelectTrigger>
                      <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="showPersonnel"
                    checked={showPersonnel}
                    onCheckedChange={(checked) => setShowPersonnel(checked as boolean)}
                  />
                  <Label htmlFor="showPersonnel" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mostrar Personal
                  </Label>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="shadow-sm border-none dark:bg-gray-800">
              <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Resumen de Cumplimiento
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {!isViewModeLoaded ? (
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <Skeleton className="h-10 w-10 rounded-md" />
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewMode("list")}
                          className={cn(
                            "hover:bg-gray-100 dark:hover:bg-gray-700",
                            viewMode === "list" && "bg-gray-100 dark:bg-gray-700"
                          )}
                          aria-label="Vista de lista"
                        >
                          <List className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewMode("grid")}
                          className={cn(
                            "hover:bg-gray-100 dark:hover:bg-gray-700",
                            viewMode === "grid" && "bg-gray-100 dark:bg-gray-700"
                          )}
                          aria-label="Vista de cuadrícula"
                        >
                          <Grid className="h-5 w-5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 justify-items-center">
                  {negocioId
                    ? (
                      unidades.length === 0 && negocios.length > 0 ? (
                        <motion.div className="w-full flex gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          {[1,2,3].map(i => (
                            <CircularProgressSkeleton key={i} />
                          ))}
                        </motion.div>
                      ) : unidades.length === 0 && negocios.length === 0 ? (
                        <span className="text-gray-500">No hay unidades para el negocio seleccionado</span>
                      ) : (
                        unidades.map((unit) => (
                          <CircularProgress
                            key={unit.id}
                            percentage={unit.percentage}
                            isSelected={selectedUnit === null || selectedUnit === unit.id}
                            onClick={() => handleUnitClick(unit.id)}
                            unit={unit}
                          />
                        ))
                      )
                    ) : (
                      negocios.length === 0 ? (
                        <motion.div className="w-full flex gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          {[1,2,3].map(i => (
                            <CircularProgressSkeleton key={i} />
                          ))}
                        </motion.div>
                      ) : zonesCompliance.length === 0 ? (
                        <motion.div className="w-full flex gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          {[1,2,3].map(i => (
                            <CircularProgressSkeleton key={i} />
                          ))}
                        </motion.div>
                      ) : (
                        zonesCompliance.map((negocio) => (
                          <CircularProgress
                            key={negocio.id}
                            percentage={negocio.percentage}
                            isSelected={false}
                            onClick={() => setNegocioId(negocio.id)}
                            unit={{ id: negocio.id, name: negocio.name, percentage: negocio.percentage, color: negocio.color }}
                          />
                        ))
                      )
                    )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-none dark:bg-gray-800">
              <CardContent className="p-4 sm:p-6">
                {loadingPersonnel ? (
                  <PersonnelListSkeleton />
                ) : !negocioId ? (
                  <div className="text-center text-gray-500 py-8">Seleccione un negocio para ver el cumplimiento</div>
                ) : personnel.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No hay datos para la zona y fecha seleccionadas</div>
                ) : (
                  <>
                    {viewMode === "list" ? (
                      Object.entries(groupedPersonnel).map(([position, shifts]) => {
                        const isExpanded = expandedPositions.has(position)
                        const hasDiurno = shifts.diurno.some((p) => p.isPresent)
                        const hasTurnoB = shifts.turno_b.some((p) => p.isPresent)
                        const hasNocturno = shifts.nocturno.some((p) => p.isPresent)
                        return (
                          <motion.div
                            key={`position-group-${position}`}
                            className="bg-white dark:bg-gray-700 rounded-xl p-4 mb-4 shadow-sm"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            <div
                              className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                              onClick={() => togglePositionExpansion(position)}
                              role="button"
                              aria-expanded={isExpanded}
                              aria-label={`Expandir ${position}`}
                            >
                              <ChevronDown
                                className={cn(
                                  "w-5 h-5 text-gray-500 dark:text-gray-300 transition-transform duration-300",
                                  isExpanded ? "rotate-180" : ""
                                )}
                              />
                              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white flex-1">
                                {position}
                              </h3>
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                      hasDiurno ? "bg-yellow-400 border-yellow-500" : "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500"
                                    )}
                                  >
                                    {hasDiurno && <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>}
                                  </div>
                                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Diurno</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                      hasTurnoB ? "bg-green-400 border-green-500" : "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500"
                                    )}
                                  >
                                    {hasTurnoB && <div className="w-2 h-2 bg-green-600 rounded-full"></div>}
                                  </div>
                                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Turno B</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                      hasNocturno ? "bg-blue-400 border-blue-500" : "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500"
                                    )}
                                  >
                                    {hasNocturno && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                                  </div>
                                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Nocturno</span>
                                </div>
                              </div>
                            </div>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  className="ml-4 sm:ml-8 space-y-4 mt-4"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div className="bg-gray-50 dark:bg-gray-600 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                      <h4 className="text-sm sm:text-md font-medium text-gray-700 dark:text-gray-200">Diurno</h4>
                                    </div>
                                    {shifts.diurno.length > 0 ? (
                                      shifts.diurno.map((person) => (
                                        <div key={`diurno-${person.id}-${person.fecha}`} className="flex flex-col gap-2 mb-3">
                                          {person.fecha && (
                                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                              {new Date(person.fecha.replace(/-/g, '/')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                            </div>
                                          )}
                                          <div className="flex items-center gap-3">
                                            <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                            <span 
                                              className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:text-blue-500"
                                              onClick={() => handlePersonnelClick(person)}
                                            >
                                              {person.isPresent ? person.name : "Sin asignar"}
                                            </span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="flex items-center gap-3">
                                        <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Sin asignar</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="bg-gray-50 dark:bg-gray-600 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                      <h4 className="text-sm sm:text-md font-medium text-gray-700 dark:text-gray-200">Turno B</h4>
                                    </div>
                                    {shifts.turno_b.length > 0 ? (
                                      shifts.turno_b.map((person) => (
                                        <div key={`turno_b-${person.id}-${person.fecha}`} className="flex flex-col gap-2 mb-3">
                                          {person.fecha && (
                                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                              {new Date(person.fecha.replace(/-/g, '/')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                            </div>
                                          )}
                                          <div className="flex items-center gap-3">
                                            <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                            <span 
                                              className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:text-blue-500"
                                              onClick={() => handlePersonnelClick(person)}
                                            >
                                              {person.isPresent ? person.name : "Sin asignar"}
                                            </span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="flex items-center gap-3">
                                        <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Sin asignar</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="bg-gray-50 dark:bg-gray-600 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                                      <h4 className="text-sm sm:text-md font-medium text-gray-700 dark:text-gray-200">Nocturno</h4>
                                    </div>
                                    {shifts.nocturno.length > 0 ? (
                                      shifts.nocturno.map((person) => (
                                        <div key={`nocturno-${person.id}-${person.fecha}`} className="flex flex-col gap-2 mb-3">
                                          {person.fecha && (
                                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                              {new Date(person.fecha.replace(/-/g, '/')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                            </div>
                                          )}
                                          <div className="flex items-center gap-3">
                                            <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                            <span 
                                              className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:text-blue-500"
                                              onClick={() => handlePersonnelClick(person)}
                                            >
                                              {person.isPresent ? person.name : "Sin asignar"}
                                            </span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="flex items-center gap-3">
                                        <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Sin asignar</span>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )
                      })
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(groupedPersonnel).map(([puesto, shifts]) => {
                          const hasDiurno = shifts.diurno.some((p) => p.isPresent)
                          const hasTurnoB = shifts.turno_b.some((p) => p.isPresent)
                          const hasNocturno = shifts.nocturno.some((p) => p.isPresent)
                          return (
                            <div
                              key={`position-card-${puesto}`}
                              className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow duration-200"
                            >
                              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                                {puesto}
                              </h3>
                              <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-lg border border-gray-100 dark:border-gray-500">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className={cn(
                                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                      hasDiurno ? "bg-yellow-400 border-yellow-500" : "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500"
                                    )}>
                                      {hasDiurno && <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>}
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">Diurno</h4>
                                  </div>
                                  {shifts.diurno.length > 0 ? (
                                    shifts.diurno.map((person) => (
                                      <div key={`diurno-${person.id}-${person.fecha}`} className="flex flex-col gap-2 mb-3">
                                        {person.fecha && (
                                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            {new Date(person.fecha.replace(/-/g, '/')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                          <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                          <span 
                                            className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:text-blue-500"
                                            onClick={() => handlePersonnelClick(person)}
                                          >
                                            {person.isPresent ? person.name : "Sin asignar"}
                                          </span>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                      <span className="text-sm text-gray-600 dark:text-gray-300">Sin asignar</span>
                                    </div>
                                  )}
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-lg border border-gray-100 dark:border-gray-500">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className={cn(
                                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                      hasTurnoB ? "bg-green-400 border-green-500" : "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500"
                                    )}>
                                      {hasTurnoB && <div className="w-2 h-2 bg-green-600 rounded-full"></div>}
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">Turno B</h4>
                                  </div>
                                  {shifts.turno_b.length > 0 ? (
                                    shifts.turno_b.map((person) => (
                                      <div key={`turno_b-${person.id}-${person.fecha}`} className="flex flex-col gap-2 mb-3">
                                        {person.fecha && (
                                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            {new Date(person.fecha.replace(/-/g, '/')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                          <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                          <span 
                                            className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:text-blue-500"
                                            onClick={() => handlePersonnelClick(person)}
                                          >
                                            {person.isPresent ? person.name : "Sin asignar"}
                                          </span>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                      <span className="text-sm text-gray-600 dark:text-gray-300">Sin asignar</span>
                                    </div>
                                  )}
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-lg border border-gray-100 dark:border-gray-500">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className={cn(
                                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                      hasNocturno ? "bg-blue-400 border-blue-500" : "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500"
                                    )}>
                                      {hasNocturno && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">Nocturno</h4>
                                  </div>
                                  {shifts.nocturno.length > 0 ? (
                                    shifts.nocturno.map((person) => (
                                      <div key={`nocturno-${person.id}-${person.fecha}`} className="flex flex-col gap-2 mb-3">
                                        {person.fecha && (
                                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            {new Date(person.fecha.replace(/-/g, '/')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                          <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                          <span 
                                            className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:text-blue-500"
                                            onClick={() => handlePersonnelClick(person)}
                                          >
                                            {person.isPresent ? person.name : "Sin asignar"}
                                          </span>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                      <span className="text-sm text-gray-600 dark:text-gray-300">Sin asignar</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden space-y-6 pb-20">
          {/* Charts */}
          <motion.div
            ref={carruselRef}
            className="overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex space-x-6 py-4 w-max">
              {unidades.map((unit) => (
                <div 
                  key={unit.id} 
                  data-unit-id={unit.id}
                  className="snap-center w-[min(85vw,300px)] flex-shrink-0"
                >
                  <CircularProgress
                    percentage={unit.percentage}
                    isSelected={selectedUnit === unit.id}
                    onClick={() => handleUnitClick(unit.id)}
                    unit={unit}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Personnel List */}
          <div className="pb-24">
            {loadingPersonnel ? (
              <PersonnelListSkeleton />
            ) : (
              <AnimatePresence>
                {Object.entries(groupedPersonnel).map(([position, shifts]) => {
                  const isExpanded = expandedPositions.has(position)
                  const hasDiurno = shifts.diurno.some((p) => p.isPresent)
                  const hasTurnoB = shifts.turno_b.some((p) => p.isPresent)
                  const hasNocturno = shifts.nocturno.some((p) => p.isPresent)

                  return (
                    <motion.div
                      key={`position-group-${position}`}
                      className="bg-white dark:bg-gray-700 rounded-lg shadow-sm mb-4 p-4 mx-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                        onClick={() => togglePositionExpansion(position)}
                        role="button"
                        aria-expanded={isExpanded}
                      >
                        <ChevronDown
                          className={cn(
                            "w-5 h-5 text-gray-500 dark:text-gray-300 transition-transform duration-300",
                            isExpanded ? "rotate-180" : ""
                          )}
                        />
                        <h3 className="text-base font-semibold text-gray-800 dark:text-white flex-1">{position}</h3>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                hasDiurno ? "bg-yellow-400 border-yellow-500" : "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500"
                              )}
                            >
                              {hasDiurno && <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>}
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">Diurno</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                hasTurnoB ? "bg-green-400 border-green-500" : "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500"
                              )}
                            >
                              {hasTurnoB && <div className="w-2 h-2 bg-green-600 rounded-full"></div>}
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">Turno B</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                hasNocturno ? "bg-blue-400 border-blue-500" : "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500"
                              )}
                            >
                              {hasNocturno && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">Nocturno</span>
                          </div>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            className="ml-4 space-y-4 mt-4"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">Diurno</h4>
                              </div>
                              {shifts.diurno.length > 0 ? (
                                shifts.diurno.map((person) => (
                                  <div key={`diurno-${person.id}-${person.fecha}`} className="flex flex-col gap-2 mb-3">
                                    {person.fecha && (
                                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {new Date(person.fecha.replace(/-/g, '/')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                      <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                      <span 
                                        className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:text-blue-500"
                                        onClick={() => handlePersonnelClick(person)}
                                      >
                                        {person.isPresent ? person.name : "Sin asignar"}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center gap-3">
                                  <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                  <span className="text-sm text-gray-600 dark:text-gray-300">Sin asignar</span>
                                </div>
                              )}
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">Turno B</h4>
                              </div>
                              {shifts.turno_b.length > 0 ? (
                                shifts.turno_b.map((person) => (
                                  <div key={`turno_b-${person.id}-${person.fecha}`} className="flex flex-col gap-2 mb-3">
                                    {person.fecha && (
                                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {new Date(person.fecha.replace(/-/g, '/')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                      <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                      <span 
                                        className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:text-blue-500"
                                        onClick={() => handlePersonnelClick(person)}
                                      >
                                        {person.isPresent ? person.name : "Sin asignar"}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center gap-3">
                                  <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                  <span className="text-sm text-gray-600 dark:text-gray-300">Sin asignar</span>
                                </div>
                              )}
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">Nocturno</h4>
                              </div>
                              {shifts.nocturno.length > 0 ? (
                                shifts.nocturno.map((person) => (
                                  <div key={`nocturno-${person.id}-${person.fecha}`} className="flex flex-col gap-2 mb-3">
                                    {person.fecha && (
                                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {new Date(person.fecha.replace(/-/g, '/')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                      <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                      <span 
                                        className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:text-blue-500"
                                        onClick={() => handlePersonnelClick(person)}
                                      >
                                        {person.isPresent ? person.name : "Sin asignar"}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center gap-3">
                                  <User className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                  <span className="text-sm text-gray-600 dark:text-gray-300">Sin asignar</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t shadow-lg z-50">
            <div className="flex justify-around items-center h-16 px-4">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="flex flex-col items-center p-2" aria-label="Abrir filtros">
                    <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    <span className="text-xs mt-1 text-gray-600 dark:text-gray-300">Filtros</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] bg-white dark:bg-gray-800 overflow-y-auto">
                  <motion.div
                    className="p-4 space-y-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Filtros</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="text-sm text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                      >
                        Limpiar filtros
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Negocio</Label>
                        <Select value={negocioId} onValueChange={setNegocioId}>
                          <SelectTrigger className="h-10 bg-white dark:bg-gray-700">
                            <SelectValue placeholder="Seleccionar negocio" />
                          </SelectTrigger>
                          <SelectContent>
                            {negocios
                              .filter(n => n.id_negocio !== undefined)
                              .map(n => (
                                <SelectItem key={n.id_negocio} value={n.id_negocio.toString()}>{n.nombre_negocio}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Unidad</Label>
                        {negocioId && (
                          <Select value={unidadId} onValueChange={setUnidadId}>
                            <SelectTrigger className="h-10 bg-white dark:bg-gray-700">
                              <SelectValue placeholder="Seleccionar unidad de negocio" />
                            </SelectTrigger>
                            <SelectContent>
                              {unidadesRaw
                                .filter(u => u && u.id_unidad !== undefined && u.nombre_unidad !== undefined)
                                .map(u => (
                                  <SelectItem key={u.id_unidad} value={u.id_unidad.toString()}>{u.nombre_unidad}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Puesto</Label>
                        {unidadId && (
                          <Select value={puestoId} onValueChange={setPuestoId}>
                            <SelectTrigger className="h-10 bg-white dark:bg-gray-700">
                              <SelectValue placeholder="Seleccionar puesto" />
                            </SelectTrigger>
                            <SelectContent>
                              {puestos.map(p => (
                                <SelectItem key={p.id_puesto} value={p.id_puesto.toString()}>{p.nombre_puesto}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Día</Label>
                        <Select value={selectedDay} onValueChange={setSelectedDay}>
                          <SelectTrigger className="h-10 bg-white dark:bg-gray-700">
                            <SelectValue placeholder="Día" />
                          </SelectTrigger>
                          <SelectContent>
                            {days.map(day => (
                              <SelectItem key={day} value={day}>{day}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mes</Label>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                          <SelectTrigger className="h-10 bg-white dark:bg-gray-700">
                            <SelectValue placeholder="Mes" />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month, idx) => (
                              <SelectItem key={month} value={month}>{month.padStart(2, "0")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                        <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Año</Label>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="h-10 bg-white dark:bg-gray-700">
                            <SelectValue placeholder="Año" />
                            </SelectTrigger>
                            <SelectContent>
                            {years.map(year => (
                              <SelectItem key={year} value={year}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showPersonnel"
                          checked={showPersonnel}
                          onCheckedChange={(checked) => setShowPersonnel(checked as boolean)}
                        />
                        <Label htmlFor="showPersonnel" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Mostrar Personal
                        </Label>
                      </div>
                    </div>
                  </motion.div>
                </SheetContent>
              </Sheet>

              {unidades.map((unit) => (
                <button
                  key={unit.id}
                  className={cn(
                    "flex flex-col items-center p-2 transition-colors duration-200",
                    selectedUnit === unit.id 
                      ? "text-primary border-t-2 border-primary pt-1" 
                      : "text-gray-500 dark:text-gray-300"
                  )}
                  onClick={() => handleUnitClick(unit.id)}
                  aria-label={`Seleccionar ${unit.name}`}
                >
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full mb-1 transition-transform duration-200",
                      selectedUnit === unit.id && "scale-125"
                    )}
                    style={{ backgroundColor: unit.color }}
                  />
                  <span className={cn(
                    "text-xs font-medium",
                    selectedUnit === unit.id && "text-primary"
                  )}>
                    {unit.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <DetailModal
        isOpen={isCementoModalOpen}
        onClose={() => setIsCementoModalOpen(false)}
        colaboradorId={cementoModalData.colaboradorId}
        fecha={cementoModalData.fecha}
        puestoId={cementoModalData.puestoId}
        tipoTurno={selectedPersonnel?.shift || null}
      />
    </div>
  )
}