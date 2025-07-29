"use client";
import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels"; 
import { useAuth } from '@/hooks/useAuth';
import * as ExcelJS from 'exceljs';
import { RadialBarChart, RadialBar, PolarGrid, PolarRadiusAxis, Label } from 'recharts'; 
import { CartesianGrid, LabelList, Line as RechartsLine, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, TooltipProps } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import Skeleton from '@/components/ui/skeleton';
import { toast } from 'sonner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  ChartDataLabels
);

const PALETA = ["#9966CC", "#00AFA3", "#1A4A96"];  

// Paleta extendida para más zonas
const PALETA_BARRAS = [
  '#00AFA3', '#1A4A96', '#9966CC', '#FFBB28', '#FF8042', '#FF6384', '#36A2EB', '#4BC0C0', '#F77825', '#8BC34A', '#E91E63', '#FF9800', '#607D8B', '#795548', '#9C27B0', '#3F51B5', '#009688', '#CDDC39', '#FFC107', '#FF5722'
];

const formatearFecha = (fecha: string) => {
  if (!fecha) return "";
  const fechaParte = fecha.split('T')[0];
  const [year, month, day] = fechaParte.split('-');
  return `${day}/${month}/${year}`;
};

const obtenerUltimos7Dias = () => {
  const hoy = new Date();
  const fechaFin = new Date(hoy);
  const fechaInicio = new Date(hoy);
  
  // La fecha fin es hoy
  fechaFin.setHours(23, 59, 59, 999);
  
  // La fecha inicio es 7 días atrás
  fechaInicio.setDate(hoy.getDate() - 6); // -6 para incluir hoy + 6 días anteriores = 7 días total
  fechaInicio.setHours(0, 0, 0, 0);
  
  return {
    desde: fechaInicio.toISOString().split('T')[0],
    hasta: fechaFin.toISOString().split('T')[0]
  };
};

const BATCH_SIZE = 1000; // Aumentamos el tamaño del lote ya que ahora es más eficiente

// Utilidad para formatear a yyyy-mm-dd para el input date
const toInputDate = (fecha: string) => {
  // fecha viene en formato yyyy-mm-dd o yyyy-mm-ddTHH:MM:SSZ
  return fecha.split('T')[0];
};

export default function MarcacionesMitraPage() {
  const [clientes, setClientes] = useState<{ id_cliente: number, nombre_cliente: string }[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [data, setData] = useState([]);
  const [filtroZonaDia, setFiltroZonaDia] = useState<string>("");
  const [filtroZonaHora, setFiltroZonaHora] = useState<string>("");
  const [tipoAnalisisTendencia, setTipoAnalisisTendencia] = useState<'diario' | 'horas'>('diario');
  const [horasAnalisis, setHorasAnalisis] = useState<number>(4);
  const [filtroZonaTendencia, setFiltroZonaTendencia] = useState<string>("");
  const [filtroTurno, setFiltroTurno] = useState<'diurno' | 'nocturno' | '24horas'>('24horas');
  const [modalData, setModalData] = useState<{
    show: boolean;
    title: string;
    data: any[];
  }>({
    show: false,
    title: "",
    data: []
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [previewData, setPreviewData] = useState<{
    total: number;
    fechas: { fecha: string; count: number }[];
    zonas: { zona: string; count: number }[];
    horas: { hora: string; count: number }[];
    headers: string[];
    rows: string[][];
  } | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const { user, isAuthenticated } = useAuth();
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [todosLosPuntos, setTodosLosPuntos] = useState<string[]>([]);
  const [resultados, setResultados] = useState<{exitos: any[], errores: any[], total: number, exitosos: number, conError: number} | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsClient(true);
      const ultimos7Dias = obtenerUltimos7Dias();
      setDesde(ultimos7Dias.desde);
      setHasta(ultimos7Dias.hasta);
      
      // Cargar clientes
      try {
        const res = await fetch('/api/clientes');
        const data = await res.json();
        setClientes(data);
        if (data.length > 0) setClienteSeleccionado(data[0].id_cliente);
      } catch (error) {
        console.error('Error cargando clientes:', error);
      }
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    const loadMarcaciones = async () => {
      if (desde && hasta && clienteSeleccionado) {
        try {
          const res = await fetch(`/api/marcaciones?desde=${desde}&hasta=${hasta}&id_cliente=${clienteSeleccionado}`);
          const data = await res.json();
          setData(data);
        } catch (error) {
          console.error('Error cargando marcaciones:', error);
        }
      }
    };
    
    loadMarcaciones();
  }, [desde, hasta, clienteSeleccionado]);

  // Cargar todos los puntos de marcación al inicio
  useEffect(() => {
    const fetchPuntos = async () => {
      if (!clienteSeleccionado) return;
      try {
        const res = await fetch(`/api/marcaciones/nombres?id_cliente=${clienteSeleccionado}`);
        const data = await res.json();
        setTodosLosPuntos(data.map((row: any) => row.punto_marcacion));
      } catch (e) {
        setTodosLosPuntos([]);
      }
    };
    fetchPuntos();
  }, [clienteSeleccionado]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  const filtrarPorTurno = (data: any[]) => {
    if (filtroTurno === '24horas') return data;
    
    return data.filter((item: any) => {
      const hora = parseInt(item.hora_marcacion?.split(':')[0] || '0');
      if (filtroTurno === 'diurno') {
        return hora >= 6 && hora < 18;
      } else { // nocturno
        return hora >= 18 || hora < 6;
      }
    });
  };

  const dataFiltrada = filtrarPorTurno(data);
  const fechas = [...new Set(dataFiltrada.map((d: any) => d.fecha))].sort();
  const fechasFormateadas = fechas.map(f => formatearFecha(f));
  const marcacionesPorDia = fechas.map(f => dataFiltrada.filter((d: any) => d.fecha === f).length);

  const zonas = Array.from(new Set(dataFiltrada.map((d: any) => d.punto_marcacion)));
  const marcacionesPorZona = zonas.map(z => dataFiltrada.filter((d: any) => d.punto_marcacion === z).length);
  const maxMarcacionesZona = marcacionesPorZona.length > 0 ? Math.max(...marcacionesPorZona) : 0;
  const sugeridoMaxZona = Math.ceil(maxMarcacionesZona * 1.3);

  const horas = Array.from({length: 24}, (_, i) => {
    const hora = (i + 6) % 24;
    return hora.toString().padStart(2, '0');
  });
  const horasFormateadas = horas.map(h => `${h}:00`);
  const marcacionesPorHora = horas.map(h => dataFiltrada.filter((d: any) => (d.hora_marcacion ? d.hora_marcacion.slice(0,2) : "") === h).length);

  const totalMarcaciones = dataFiltrada.length;
  const diasFiltrados = desde && hasta ? Math.max(1, (new Date(hasta).getTime() - new Date(desde).getTime()) / (1000 * 60 * 60 * 24) + 1) : 0;
  
  // Análisis de datos
  const promedioMarcacionesPorDia = totalMarcaciones / diasFiltrados;
  
  // Calcular promedio de marcaciones por hora
  const promedioMarcacionesPorHora = totalMarcaciones / 24;
  const horasPico = horasFormateadas.filter((_, i) => marcacionesPorHora[i] > promedioMarcacionesPorHora);
  
  // Calcular zona con menos marcaciones
  const zonasConMenosMarcaciones = zonas
    .map(zona => ({
      zona,
      count: dataFiltrada.filter((d: any) => d.punto_marcacion === zona).length
    }))
    .sort((a, b) => a.count - b.count)
    .slice(0, 1) // Tomar solo la zona con menos marcaciones
    .map(z => `${z.zona} (${z.count})`);

  let zonaTop = "";
  let maxMarcaciones = 0;
  if (zonas.length > 0) {
    const conteo = zonas.map(z => ({ z, c: dataFiltrada.filter((d: any) => d.punto_marcacion === z).length }));
    conteo.forEach(({ z, c }) => {
      if (c > maxMarcaciones) {
        maxMarcaciones = c;
        zonaTop = z;
      }
    });
  }

  // Definir metas especiales por punto de marcación
  const metasPorPunto: Record<string, number> = {
    'galeria #18': 1,
    // Puedes agregar más puntos especiales aquí si lo necesitas
  };
  const metaDefault = 3;

  const totalEsperado = zonas.reduce((acc, zona) => {
    const meta = metasPorPunto[zona] || metaDefault;
    return acc + meta * diasFiltrados;
  }, 0);

  // Días con incumplimiento (menos del 100% en alguna zona)
  const diasIncumplidos = fechas.filter(fecha => {
    // Para cada punto, verifica si cumplió su meta ese día
    return zonas.some(zona => {
      const meta = metasPorPunto[zona] || metaDefault;
      const realizadas = dataFiltrada.filter((d: any) => d.punto_marcacion === zona && d.fecha === fecha).length;
      return realizadas < meta;
    });
  });

  // Cálculo de cumplimiento estricto por punto (usando todos los puntos)
  const cumplimientoPorZona = zonas.map(zona => {
    const meta = metasPorPunto[zona] || metaDefault;
    const realizadas = dataFiltrada.filter((d: any) => d.punto_marcacion === zona).length;
    return Math.min(100, (realizadas / (meta * diasFiltrados)) * 100);
  });
  const porcentajeCumplimientoEstricto = cumplimientoPorZona.length > 0
    ? cumplimientoPorZona.reduce((a, b) => a + b, 0) / cumplimientoPorZona.length
    : 0;

  // Calcular el porcentaje de cumplimiento por día (usando todos los puntos)
  const porcentajePorDia: Record<string, number> = {};
  fechas.forEach(fecha => {
    const cumplimientos = zonas.map(zona => {
      const meta = metasPorPunto[zona] || metaDefault;
      const realizadas = dataFiltrada.filter((d: any) => d.punto_marcacion === zona && d.fecha === fecha).length;
      return Math.min(100, (realizadas / meta) * 100);
    });
    porcentajePorDia[fecha] = cumplimientos.length > 0 ? (cumplimientos.reduce((a, b) => a + b, 0) / cumplimientos.length) : 0;
  });

  const handleBarClick = (chart: any, elements: any[], type: 'dia' | 'zona' | 'hora') => {
    if (elements.length === 0) return;
    
    const index = elements[0].index;
    let filteredData: any[] = [];
    let title = "";

    switch (type) {
      case 'dia':
        const fecha = fechas[index];
        filteredData = dataFiltrada.filter((d: any) => {
          const matchesFecha = d.fecha === fecha;
          const matchesZona = filtroZonaDia ? d.punto_marcacion === filtroZonaDia : true;
          return matchesFecha && matchesZona;
        });
        title = `Marcaciones del día ${formatearFecha(fecha)}${filtroZonaDia ? ` en ${filtroZonaDia}` : ''}`;
        break;
      case 'zona':
        const zona = zonas[index];
        filteredData = dataFiltrada.filter((d: any) => d.punto_marcacion === zona);
        title = `Marcaciones en ${zona}`;
        break;
      case 'hora':
        const hora = horas[index];
        filteredData = dataFiltrada.filter((d: any) => {
          const matchesHora = d.hora_marcacion?.slice(0,2) === hora;
          const matchesZona = filtroZonaHora ? d.punto_marcacion === filtroZonaHora : true;
          return matchesHora && matchesZona;
        });
        title = `Marcaciones a las ${hora}:00${filtroZonaHora ? ` en ${filtroZonaHora}` : ''}`;
        break;
    }

    setModalData({
      show: true,
      title,
      data: filteredData
    });
  };

  const closeModal = () => {
    setModalData(prev => ({ ...prev, show: false }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError("");
    setImportSuccess("");
    setPreviewData(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data as ArrayBuffer);
          const worksheet = workbook.getWorksheet(1);
          
          if (!worksheet) {
            setImportError("No se encontró ninguna hoja en el archivo");
            return;
          }

          const jsonData: string[][] = [];
          worksheet.eachRow((row, rowNumber) => {
            const rowData: string[] = [];
            row.eachCell((cell, colNumber) => {
              rowData[colNumber - 1] = cell.value?.toString() || '';
            });
            jsonData.push(rowData);
          });

          // Validar el formato del archivo
          if (jsonData.length < 2) {
            setImportError("El archivo está vacío o no tiene el formato correcto");
            return;
          }

          // Procesar los datos y generar los inserts
          const inserts = [];
          const rows: string[][] = [];
          const headers = ['ID Origen', 'Punto de Marcación', 'Usuario', 'Fecha', 'Hora', 'Nombre Guarda'];

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as string[];

            // Columnas: A:Id, D:Punto de Marcacion, E:Usuario, F:Fecha Marcacion, G:Horamarcación, I:NombreGuarda
            const id_origen = row[0];
            const punto = row[3];
            const usuario = row[4];
            const fecha = row[5];
            let hora = row[6];
            const nombre = row[8];

            // Validar y formatear la fecha
            let fechaInsert = '';
            if (fecha && typeof fecha === 'string') {
              // Intentar convertir a yyyy-mm-dd
              const partes = fecha.split(/[\/\-]/);
              if (partes.length === 3) {
                let [d, m, y] = partes;
                if (y.length === 4) fechaInsert = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                else if (d.length === 4) fechaInsert = `${d}-${m.padStart(2, '0')}-${y.padStart(2, '0')}`;
                else fechaInsert = fecha;
              } else {
                fechaInsert = fecha;
              }
            }

            // Validar y formatear la hora
            if (hora && typeof hora === 'string') {
              if (!hora.includes(':')) {
                hora = hora.replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3');
              }
              const [h, m, s] = hora.split(':');
              if (h && m && s) {
                hora = `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`;
              }
              if (!hora.match(/^\d{2}:\d{2}:\d{2}$/)) continue;
            } else {
              continue;
            }

            if (id_origen && punto && usuario && fechaInsert && hora && nombre) {
              inserts.push({
                id_cliente: clienteSeleccionado,
                id_origen,
                punto_marcacion: punto,
                fecha: fechaInsert,
                hora_marcacion: hora,
                usuario,
                nombre
              });
              rows.push([id_origen, punto, usuario, fechaInsert, hora, nombre]);
            }
          }

          if (inserts.length === 0) {
            setImportError("No se encontraron datos válidos para importar. Revise el formato del archivo.");
            return;
          }

          // Procesar datos para el resumen
          const fechas = [...new Set(rows.map(row => row[3]))].sort();
          const zonas = [...new Set(rows.map(row => row[1]))];
          const horas = Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'));

          const marcacionesPorDia = fechas.map(fecha => ({
            fecha,
            count: rows.filter(row => row[3] === fecha).length
          }));

          const marcacionesPorZona = zonas.map(zona => ({
            zona,
            count: rows.filter(row => row[1] === zona).length
          }));

          const marcacionesPorHora = horas.map(hora => ({
            hora,
            count: rows.filter(row => row[4].startsWith(hora)).length
          }));

          setPreviewData({
            total: inserts.length,
            fechas: marcacionesPorDia,
            zonas: marcacionesPorZona,
            horas: marcacionesPorHora,
            headers,
            rows: rows.slice(0, 10) // Solo mostrar las primeras 10 filas en el preview
          });

          setImportData(inserts);
          setShowImportModal(true);
          toast.success(`Archivo cargado exitosamente. ${inserts.length} registros encontrados.`);

        } catch (error) {
          console.error('Error procesando archivo:', error);
          setImportError("Error al procesar el archivo. Asegúrese de que sea un archivo Excel válido.");
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error leyendo archivo:', error);
      setImportError("Error al leer el archivo.");
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportError("");
    setImportSuccess("");
    setResultados(null);

    try {
                const totalInserts = importData;
      let allExitos: any[] = [];
      let allErrores: any[] = [];
      let startTime = Date.now();

      // Procesar cada lote secuencialmente
      for (let i = 0; i < totalInserts.length; i += BATCH_SIZE) {
        const batch = totalInserts.slice(i, i + BATCH_SIZE);
        const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(totalInserts.length / BATCH_SIZE);

        try {
          const response = await fetch('/api/marcaciones/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inserts: batch }),
          });

          if (!response.ok) {
            throw new Error('Error al importar el lote de datos');
          }

          const result = await response.json();
          
          // Acumular resultados
          if (result.exitos) allExitos = allExitos.concat(result.exitos);
          if (result.errores) allErrores = allErrores.concat(result.errores);

          const processedCount = allExitos.length + allErrores.length;
          const progress = Math.round((processedCount / totalInserts.length) * 100);
          setImportProgress(progress);

          // Calcular velocidad y tiempo estimado
          const elapsedTime = (Date.now() - startTime) / 1000; // en segundos
          const recordsPerSecond = processedCount / elapsedTime;
          const remainingRecords = totalInserts.length - processedCount;
          const estimatedTimeRemaining = remainingRecords / recordsPerSecond;

          setImportSuccess(
            `Procesando lote ${currentBatch} de ${totalBatches} (${progress}%)\n` +
            `Exitosos: ${allExitos.length} | Con error: ${allErrores.length}\n` +
            `Velocidad: ${Math.round(recordsPerSecond)} registros/segundo\n` +
            `Tiempo restante estimado: ${Math.round(estimatedTimeRemaining)} segundos`
          );

        } catch (error) {
          console.error('Error importando lote:', error);
          throw new Error(`Error al importar el lote ${currentBatch} de ${totalBatches}. Se ha cancelado la importación.`);
        }
      }

      setImportProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      
      // Guardar resultados finales
      setResultados({
        exitos: allExitos,
        errores: allErrores,
        total: totalInserts.length,
        exitosos: allExitos.length,
        conError: allErrores.length
      });

      setImportSuccess(
        `Procesamiento completado\n` +
        `Total de registros: ${totalInserts.length}\n` +
        `Exitosos: ${allExitos.length} | Con error: ${allErrores.length}\n` +
        `Tiempo total: ${totalTime} segundos\n` +
        `Velocidad promedio: ${Math.round(totalInserts.length / Number(totalTime))} registros/segundo`
      );

      // Actualizar datos si hay registros exitosos
      if (allExitos.length > 0 && desde && hasta && clienteSeleccionado) {
        try {
          const res = await fetch(`/api/marcaciones?desde=${desde}&hasta=${hasta}&id_cliente=${clienteSeleccionado}`);
          const newData = await res.json();
          setData(newData);
        } catch (error) {
          console.error('Error actualizando datos después de importación:', error);
        }
      }

      // No cerrar el modal automáticamente, mostrar el reporte
      setPreviewData(null);

    } catch (error) {
      console.error('Error importando datos:', error);
      setImportError(error instanceof Error ? error.message : "Error al importar los datos. Se ha cancelado la importación.");
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  // Mostrar selector de cliente
  const selectorCliente = (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">Cliente</label>
      {clientes.length === 0 ? (
        <Skeleton className="h-10 w-64" />
      ) : (
        <select
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          value={clienteSeleccionado ?? ''}
          onChange={e => setClienteSeleccionado(Number(e.target.value))}
        >
          {clientes.map(c => (
            <option key={c.id_cliente} value={c.id_cliente}>{c.nombre_cliente}</option>
          ))}
        </select>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-0 py-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0 px-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marcaciones Mitra Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">Visualización y análisis de marcaciones de los últimos 7 días</p>
          </div>
          <div className="flex items-center gap-6 w-full md:w-auto">
            {selectorCliente}
            <div className="flex flex-col">
              <label htmlFor="filtroTurno" className="text-sm font-medium text-gray-700 mb-1">
                Filtro por Turno
              </label>
              <select
                id="filtroTurno"
                value={filtroTurno}
                onChange={(e) => setFiltroTurno(e.target.value as 'diurno' | 'nocturno' | '24horas')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="24horas">24 Horas</option>
                <option value="diurno">Turno Diurno (06:00 - 17:59)</option>
                <option value="nocturno">Turno Nocturno (18:00 - 05:59)</option>
              </select>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span>Importar Marcaciones</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters and Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-8 px-6">
          {/* Filters Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-2">
              <div>
                <label htmlFor="desde" className="block text-xs font-medium text-gray-700 mb-1">Fecha Inicio</label>
                <input
                  id="desde"
                  type="date"
                  className="w-full px-2 py-1 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  value={desde}
                  onChange={e => setDesde(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="hasta" className="block text-xs font-medium text-gray-700 mb-1">Fecha Fin</label>
                <input
                  id="hasta"
                  type="date"
                  className="w-full px-2 py-1 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  value={hasta}
                  onChange={e => setHasta(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          {totalMarcaciones > 0 && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-gray-500">Total Marcaciones</h3>
                  <span className="p-1 bg-blue-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
                <div className="relative h-24 mt-2 flex items-center justify-center">
                  <div className="flex items-center justify-center">
                    <RadialBarChart
                      width={120}
                      height={120}
                      data={[{ value: Math.round(totalMarcaciones), fill: PALETA[0] }]}
                      startAngle={0}
                      endAngle={360}
                      innerRadius={45}
                      outerRadius={60}
                    >
                      <PolarGrid gridType="circle" radialLines={false} stroke="none" />
                      <RadialBar
                        dataKey="value"
                        background
                        cornerRadius={10}
                      />
                      <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                        <Label
                          content={({ viewBox }) => {
                            const { cx, cy } = viewBox as { cx: number; cy: number };
                            return (
                              <text
                                x={cx}
                                y={cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-lg font-bold text-gray-900"
                              >
                                {Math.round(totalMarcaciones)}
                              </text>
                            );
                          }}
                        />
                      </PolarRadiusAxis>
                    </RadialBarChart>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-gray-500">Días Analizados</h3>
                  <span className="p-1 bg-green-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
                <div className="relative h-24 mt-2 flex items-center justify-center">
                  <div className="flex items-center justify-center">
                    <RadialBarChart
                      width={120}
                      height={120}
                      data={[{ value: diasFiltrados, fill: PALETA[1] }]}
                      startAngle={0}
                      endAngle={360}
                      innerRadius={35}
                      outerRadius={50}
                    >
                      <PolarGrid gridType="circle" radialLines={false} stroke="none" />
                      <RadialBar
                        dataKey="value"
                        background
                        cornerRadius={10}
                      />
                      <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                        <Label
                          content={({ viewBox }) => {
                            const { cx, cy } = viewBox as { cx: number; cy: number };
                            return (
                              <text
                                x={cx}
                                y={cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-lg font-bold text-gray-900"
                              >
                                {diasFiltrados}
                              </text>
                            );
                          }}
                        />
                      </PolarRadiusAxis>
                    </RadialBarChart>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-gray-500">Promedio Diario</h3>
                  <span className="p-1 bg-purple-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  </span>
                </div>
                <div className="relative h-24 mt-2 flex items-center justify-center">
                  <div className="flex items-center justify-center">
                    <RadialBarChart
                      width={120}
                      height={120}
                      data={[{ value: Math.round(promedioMarcacionesPorDia), fill: PALETA[2] }]}
                      startAngle={0}
                      endAngle={360}
                      innerRadius={35}
                      outerRadius={50}
                    >
                      <PolarGrid gridType="circle" radialLines={false} stroke="none" />
                      <RadialBar
                        dataKey="value"
                        background
                        cornerRadius={10}
                      />
                      <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                        <Label
                          content={({ viewBox }) => {
                            const { cx, cy } = viewBox as { cx: number; cy: number };
                            return (
                              <text
                                x={cx}
                                y={cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-lg font-bold text-gray-900"
                              >
                                {Math.round(promedioMarcacionesPorDia)}
                              </text>
                            );
                          }}
                        />
                      </PolarRadiusAxis>
                    </RadialBarChart>
                  </div>
                </div>
              </div>
              {/* Card de Zona Top y Zona Menos juntos */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-gray-500">Zona Top / Zona Menos</h3>
                  <span className="p-1 bg-orange-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <div>
                    <span className="text-xs text-gray-500">Zona Top:</span>
                    <TooltipProvider>
                      <UiTooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm font-bold text-gray-900 truncate cursor-pointer">{zonaTop}</p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>{zonaTop}</span>
                        </TooltipContent>
                      </UiTooltip>
                    </TooltipProvider>
                    <p className="text-xs text-gray-500">{maxMarcaciones} marcaciones</p>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div>
                    <span className="text-xs text-gray-500">Zona Menos:</span>
                    <TooltipProvider>
                      <UiTooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm font-bold text-gray-900 truncate cursor-pointer">{zonasConMenosMarcaciones[0]}</p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>{zonasConMenosMarcaciones[0]}</span>
                        </TooltipContent>
                      </UiTooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              {/* Card de Cumplimiento (%) en la posición de Zona Menos */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-gray-500">Cumplimiento (%)</h3>
                  <span className="p-1 bg-indigo-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V6h2v4z" />
                    </svg>
                  </span>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-gray-900">{porcentajeCumplimientoEstricto.toFixed(1)}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, porcentajeCumplimientoEstricto)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {totalMarcaciones} de {totalEsperado} marcaciones esperadas
                  </div>
                </div>
              </div>
              {/* Card de Días Incumplidos (antes Horas Pico) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-gray-500">Días sin cumplimiento total</h3>
                  <span className="p-1 bg-yellow-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
                <div className="mt-1 flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {diasIncumplidos.length === 0 ? (
                    <span className="text-xs text-gray-500"></span>
                  ) : (
                    diasIncumplidos.map((fecha, idx) => (
                      <button
                        key={fecha}
                        className="text-xs text-red-600 hover:underline text-left px-1 py-0.5 rounded transition-colors flex justify-between items-center"
                        onClick={() => {
                          const inputDate = toInputDate(fecha);
                          setDesde(inputDate);
                          setHasta(inputDate);
                        }}
                      >
                        <span>{formatearFecha(fecha)}</span>
                        <span className="ml-2 text-xs text-gray-500">{porcentajePorDia[fecha].toFixed(1)}%</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Charts Section */}
        <div className="space-y-8">
          {/* Primera fila: Gráfico de Marcaciones por Zona (ancho completo) */}
          <div className="grid grid-cols-1 gap-8">
            {/* Gráfico de Marcaciones por Zona */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Marcaciones por Zona</h3>
              <p className="text-sm text-gray-600 mb-6">Visualiza la distribución de marcaciones por punto de control, ayudando a identificar las zonas más y menos frecuentadas por el personal de seguridad.</p>
              <div className="h-[20rem]">
                <Bar
                  data={{
                    labels: zonas,
                    datasets: [{
                      label: "Marcaciones",
                      data: marcacionesPorZona,
                      backgroundColor: zonas.map((_, i) => PALETA_BARRAS[i % PALETA_BARRAS.length]),
                      borderRadius: 4
                    }]
                  }}
                  options={{
                    onClick: (_, elements) => handleBarClick(_, elements, 'zona'),
                    plugins: { 
                      legend: { display: false }, 
                      datalabels: { anchor: 'end', align: 'end', color: '#1e293b', font: { weight: 'bold', size: 16 } },
                      tooltip: {
                        callbacks: {
                          label: (context) => `Click para ver detalles`
                        }
                      }
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'x',
                    scales: { 
                      x: { 
                        ticks: { 
                          color: '#374151',
                          maxRotation: 45,
                          minRotation: 45
                        },
                        grid: {
                          display: true
                        }
                      }, 
                      y: { 
                        ticks: { color: '#374151' },
                        grid: {
                          display: true
                        },
                        suggestedMax: sugeridoMaxZona,
                        beginAtZero: true
                      } 
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Segunda fila: Gráficos de Marcaciones por Hora y por Día (dos columnas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Gráfico de Marcaciones por Hora */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Marcaciones por Hora</h3>
                <select
                  value={filtroZonaHora}
                  onChange={(e) => setFiltroZonaHora(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las zonas</option>
                  {zonas.map((zona) => (
                    <option key={zona} value={zona}>{zona}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-gray-600 mb-6">Presenta la frecuencia de marcaciones por hora durante el rango de dias seleccionado, permitiendo analizar los horarios con mayor actividad de revistas y patrones de vigilancia.</p>
              <div className="h-[20rem]">
                <Bar
                  data={{
                    labels: horasFormateadas,
                    datasets: [{
                      label: "Marcaciones",
                      data: horas.map(h => 
                        filtroZonaHora 
                          ? dataFiltrada.filter((d: any) => d.hora_marcacion?.slice(0,2) === h && d.punto_marcacion === filtroZonaHora).length
                          : dataFiltrada.filter((d: any) => d.hora_marcacion?.slice(0,2) === h).length
                      ),
                      backgroundColor: PALETA[2],
                      borderRadius: 4
                    }]
                  }}
                  options={{
                    onClick: (_, elements) => handleBarClick(_, elements, 'hora'),
                    plugins: { 
                      legend: { display: false }, 
                      datalabels: { anchor: 'end', align: 'end', color: '#1e293b', font: { weight: 'bold', size: 16 } },
                      tooltip: {
                        callbacks: {
                          label: (context) => `Click para ver detalles`
                        }
                      }
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { 
                      x: { 
                        ticks: { color: '#374151' },
                        grid: {
                          display: true
                        }
                      }, 
                      y: { 
                        ticks: { color: '#374151' },
                        suggestedMax: Math.max(...horas.map(h => 
                          filtroZonaHora 
                            ? dataFiltrada.filter((d: any) => d.hora_marcacion?.slice(0,2) === h && d.punto_marcacion === filtroZonaHora).length
                            : dataFiltrada.filter((d: any) => d.hora_marcacion?.slice(0,2) === h).length
                        )) * 1.2,
                        beginAtZero: true,
                        grid: {
                          display: true
                        }
                      } 
                    }
                  }}
                />
              </div>
            </div>

            {/* Gráfico de Marcaciones por Día */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Marcaciones por Día</h3>
                <div className="flex gap-4">
                  <select
                    value={filtroZonaDia}
                    onChange={(e) => setFiltroZonaDia(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas las zonas</option>
                    {zonas.map((zona) => (
                      <option key={zona} value={zona}>{zona}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">Muestra el número total de marcaciones registradas cada día en el período seleccionado, permitiendo identificar los días con mayor y menor actividad de revistas.</p>
              <div className="h-[20rem]">
                <Bar
                  data={{
                    labels: fechasFormateadas,
                    datasets: [{
                      label: "Marcaciones",
                      data: fechas.map(f => 
                        filtroZonaDia 
                          ? dataFiltrada.filter((d: any) => d.fecha === f && d.punto_marcacion === filtroZonaDia).length
                          : dataFiltrada.filter((d: any) => d.fecha === f).length
                      ),
                      backgroundColor: PALETA[0],
                      borderRadius: 4
                    }]
                  }}
                  options={{
                    onClick: (_, elements) => handleBarClick(_, elements, 'dia'),
                    plugins: { 
                      legend: { display: false }, 
                      datalabels: { anchor: 'end', align: 'end', color: '#1e293b', font: { weight: 'bold', size: 16 } },
                      tooltip: {
                        callbacks: {
                          label: (context) => `Click para ver detalles`
                        }
                      }
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'x',
                    scales: { 
                      x: { 
                        ticks: { 
                          color: '#374151',
                          maxRotation: 90,
                          minRotation: 90
                        },
                        grid: {
                          display: true
                        }
                      }, 
                      y: { 
                        ticks: { color: '#374151' },
                        suggestedMax: Math.max(...fechas.map(f => 
                          filtroZonaDia 
                            ? dataFiltrada.filter((d: any) => d.fecha === f && d.punto_marcacion === filtroZonaDia).length
                            : dataFiltrada.filter((d: any) => d.fecha === f).length
                        )) * 1.2,
                        beginAtZero: true,
                        grid: {
                          display: true
                        }
                      } 
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Detalles */}
        {modalData.show && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <div 
              className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{modalData.title}</h3>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punto de Marcación</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Guarda</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {modalData.data.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatearFecha(item.fecha)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.hora_marcacion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.punto_marcacion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.nombre}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Importación */}
        {showImportModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => !isImporting && !resultados && setShowImportModal(false)}
          >
            <div 
              className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Importar Marcaciones</h3>
                  {clienteSeleccionado && (
                    <div className="text-xs text-blue-700 font-semibold mt-1">
                      Cliente seleccionado: {clientes.find(c => c.id_cliente === clienteSeleccionado)?.nombre_cliente} (ID: {clienteSeleccionado})
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => !isImporting && !resultados && setShowImportModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  disabled={isImporting}
                >
                  ✕
                </button>
              </div>

              {isImporting && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Importando datos...</h3>
                    <p className="text-gray-600 mb-4">Por favor espere mientras se procesan los registros</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                        style={{ 
                          width: `${importProgress}%`,
                          willChange: 'width'
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{importProgress}% completado</p>
                  </div>
                </div>
              )}
              
              {!previewData && !resultados ? (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Asegúrese de que su archivo Excel o CSV contenga las siguientes columnas en este orden:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 mb-4">
                    <li><b>Id</b> (columna <b>A</b>) — ID original del registro</li>
                    <li><b>Punto de Marcación</b> (columna <b>D</b>)</li>
                    <li><b>Usuario</b> (columna <b>E</b>)</li>
                    <li><b>Fecha Marcación</b> (columna <b>F</b>) — ej: 25/12/2023 o 2023-12-25</li>
                    <li><b>Hora Marcación</b> (columna <b>G</b>) — formato HH:MM:SS, ej: 14:35:00</li>
                    <li><b>Nombre Guarda</b> (columna <b>I</b>)</li>
                  </ul>
                  <p className="text-xs text-gray-500 mb-4">
                    Nota: El archivo debe tener al menos estas columnas, aunque puede tener otras adicionales. El sistema tomará automáticamente las columnas correctas según el formato esperado.
                  </p>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-block"
                    >
                      Seleccionar Archivo
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      Formatos soportados: CSV, Excel (.xlsx, .xls)
                    </p>
                  </div>
                </div>
              ) : previewData && !resultados ? (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium">Vista previa de datos</h4>
                    <div className="space-x-2">
                      <button
                        onClick={() => setPreviewData(null)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmImport}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Confirmar Importación
                      </button>
                    </div>
                  </div>

                  {/* Resumen de datos */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h5 className="text-sm font-medium text-gray-500">Total de Marcaciones</h5>
                        <p className="text-2xl font-bold text-gray-900">{previewData.total}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h5 className="text-sm font-medium text-gray-500">Período</h5>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatearFecha(previewData.fechas[0]?.fecha || '')} - {formatearFecha(previewData.fechas[previewData.fechas.length - 1]?.fecha || '')}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h5 className="text-sm font-medium text-gray-500">Días con Marcaciones</h5>
                        <p className="text-2xl font-bold text-gray-900">{previewData.fechas.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Gráficos */}
                  <div className="grid grid-cols-1 gap-6 mb-6">
                    {/* Gráfico por Día */}
                    <div className="bg-white rounded-xl shadow-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Marcaciones por Día</h3>
                      <div className="h-64">
                        <Bar
                          data={{
                            labels: previewData.fechas.map((d: any) => formatearFecha(d.fecha)),
                            datasets: [{
                              label: "Marcaciones",
                              data: previewData.fechas.map((d: any) => d.count),
                              backgroundColor: PALETA[0],
                              borderRadius: 4
                            }]
                          }}
                          options={{
                            plugins: { 
                              legend: { display: false },
                              datalabels: { anchor: 'end', align: 'end', color: '#1e293b', font: { weight: 'bold', size: 16 } }
                            },
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: { 
                              x: { 
                                ticks: { 
                                  color: '#374151',
                                  maxRotation: 90,
                                  minRotation: 90
                                } 
                              }, 
                              y: { ticks: { color: '#374151' } } 
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Gráfico por Zona */}
                    <div className="bg-white rounded-xl shadow-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Marcaciones por Zona</h3>
                      <div className="h-64">
                        <Bar
                          data={{
                            labels: previewData.zonas.map((z: any) => z.zona),
                            datasets: [{
                              label: "Marcaciones",
                              data: previewData.zonas.map((z: any) => z.count),
                              backgroundColor: PALETA[1],
                              borderRadius: 4
                            }]
                          }}
                          options={{
                            plugins: { 
                              legend: { display: false },
                              datalabels: { anchor: 'end', align: 'end', color: '#1e293b', font: { weight: 'bold', size: 16 } }
                            },
                            responsive: true,
                            maintainAspectRatio: false,
                            indexAxis: 'y',
                            scales: { x: { ticks: { color: '#374151' } }, y: { ticks: { color: '#374151' } } }
                          }}
                        />
                      </div>
                    </div>

                    {/* Gráfico por Hora */}
                    <div className="bg-white rounded-xl shadow-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Marcaciones por Hora</h3>
                      <div className="h-64">
                        <Bar
                          data={{
                            labels: previewData.horas.map((h: any) => h.hora),
                            datasets: [{
                              label: "Marcaciones",
                              data: previewData.horas.map((h: any) => h.count),
                              backgroundColor: PALETA[2],
                              borderRadius: 4
                            }]
                          }}
                          options={{
                            plugins: { 
                              legend: { display: false },
                              datalabels: { anchor: 'end', align: 'end', color: '#1e293b', font: { weight: 'bold', size: 16 } }
                            },
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: { 
                              x: { 
                                ticks: { 
                                  color: '#374151',
                                  maxRotation: 90,
                                  minRotation: 90
                                } 
                              }, 
                              y: { ticks: { color: '#374151' } } 
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tabla de datos */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {previewData.headers.map((header, index) => (
                            <th
                              key={index}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {importError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                  {importError}
                </div>
              )}

              {importSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
                  {importSuccess}
                </div>
              )}

              {/* Reporte de Errores */}
              {resultados && (
                <div className="mt-6">
                  <div className="flex gap-4">
                    {/* Left Section: Reporte de Errores */}
                    <div className="w-1/3 bg-white rounded-xl shadow-md p-4 flex flex-col gap-4 overflow-y-auto max-h-[60dvh]">
                      <div>
                        <span className="text-lg font-semibold text-red-700 block mb-2">REPORTE DE ERRORES</span>
                        {resultados.errores.length === 0 ? (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center justify-center shadow-md">
                            <span className="text-green-700 text-lg font-semibold">¡Importación exitosa!</span>
                            <span className="text-green-900 text-2xl font-bold mt-2">{resultados.exitosos} marcaciones insertadas correctamente.</span>
                          </div>
                        ) : (
                          <>
                            <div className="overflow-x-auto w-full">
                              <table className="min-w-[300px] w-full text-xs border border-red-200 bg-white rounded-xl">
                                <thead className="bg-red-100">
                                  <tr>
                                    <th className="px-3 py-2 border-b border-red-200 text-left">ID Origen</th>
                                    <th className="px-3 py-2 border-b border-red-200 text-left">Error</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {resultados.errores.map((err, i) => (
                                    <tr key={i} className="hover:bg-red-50">
                                      <td className="px-3 py-2 font-mono text-red-900">{err.id_origen}</td>
                                      <td className="px-3 py-2 text-red-800 max-w-xs truncate" style={{maxWidth: '16rem'}} title={err.error}>{err.error}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="mt-4 text-gray-700 text-sm">
                              Total exitosos: <b>{resultados.exitosos}</b> | Total con error: <b>{resultados.conError}</b>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Section: Tabla de Registros Exitosos */}
                    <div className="w-2/3 bg-white rounded-xl shadow border border-gray-200 overflow-x-auto" style={{ height: '60dvh' }}> 
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                          <tr>
                            <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">ID Origen</th>
                            <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Punto de Marcación</th>
                            <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Usuario</th>
                            <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Fecha</th>
                            <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Hora</th>
                            <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Nombre Guarda</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultados.exitos.map((row, i) => (
                            <tr key={i} className="hover:bg-green-50 transition">
                              <td className="px-3 py-2 font-mono text-green-900">{row.id_origen}</td>
                              <td className="px-3 py-2">{row.punto_marcacion}</td>
                              <td className="px-3 py-2">{row.usuario}</td>
                              <td className="px-3 py-2">{formatearFecha(row.fecha)}</td>
                              <td className="px-3 py-2">{row.hora_marcacion}</td>
                              <td className="px-3 py-2">{row.nombre}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        setPreviewData(null);
                        setResultados(null);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}