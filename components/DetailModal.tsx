import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface Reporte {
  reporte: string; // R1, R2, etc.
  hora: string;
  valor: number;
  nota: string | null;
}

interface DetailData {
  colaborador: { nombre: string, foto_url?: string };
  puesto: string;
  fecha: string;
  reportes: any;
  nota: string;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  colaboradorId: string | null;
  fecha: string | null;
  puestoId: number | null;
  tipoTurno?: string | null;
}

export function DetailModal({ isOpen, onClose, colaboradorId, fecha, puestoId, tipoTurno }: DetailModalProps) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportesArray, setReportesArray] = useState<Reporte[]>([]);

  useEffect(() => {
    if (!isOpen || !colaboradorId || !fecha || !puestoId) return;
    setLoading(true);
    setError(null);
    setData(null);
    setReportesArray([]);
    const fetchData = async () => {
      // Incluir tipoTurno en la petición si está definido
      const url = `/api/reporte-comunicacion/por-colaborador?colaboradorId=${colaboradorId}&fecha=${fecha}&puestoId=${puestoId}` + (tipoTurno ? `&tipoTurno=${tipoTurno}` : "");
      
      try {
        const res = await fetch(url);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Error al cargar los datos");
        }
        const d = await res.json();
        setData(d);
        // Procesar reportes: convertir objeto a array de Reporte
        if (d.reportes && typeof d.reportes === 'object') {
          const arr: Reporte[] = [];
          Object.entries(d.reportes).forEach(([reporteKey, horasObj]: [string, any]) => {
            if (horasObj && typeof horasObj === 'object') {
              Object.entries(horasObj).forEach(([hora, valorObj]: [string, any]) => {
                arr.push({
                  reporte: reporteKey,
                  hora,
                  valor: typeof valorObj === 'object' && valorObj !== null && 'valor' in valorObj ? valorObj.valor : valorObj,
                  nota: typeof valorObj === 'object' && valorObj !== null && 'nota' in valorObj ? valorObj.nota : null
                });
              });
            }
          });
          setReportesArray(arr);
        } else {
          setReportesArray([]);
        }
      } catch (e: any) {
        console.error('Error fetching data:', e);
        setError(e.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isOpen, colaboradorId, fecha, puestoId, tipoTurno]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>Detalle de Reportes</DialogTitle>
        </VisuallyHidden>
        <div className="bg-gray-800 text-white rounded-t-lg flex flex-col items-center p-6">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-2 overflow-hidden">
            {data?.colaborador?.foto_url ? (
              <img
                src={data.colaborador.foto_url}
                alt={data.colaborador.nombre}
                className="w-24 h-24 object-cover rounded-full border-2 border-blue-300"
              />
            ) : (
              <BarChart2 className="w-12 h-12 text-blue-600" />
            )}
          </div>
          <div className="text-center text-white font-semibold text-lg">{data?.colaborador?.nombre || (loading ? <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" /> : "-")}</div>
          <div className="text-sm opacity-75">{data?.puesto || (loading ? <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /> : "-")}</div>
          <div className="text-sm opacity-75">{data?.fecha ? (() => {
            const [year, month, day] = data.fecha.split('-');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            });
          })() : (loading ? <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /> : "-")}</div>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="space-y-4">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="bg-white rounded-lg border">
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-24 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4">{error}</div>
          ) : data ? (
            <>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Reportes de Comunicación</h3>
                <div className="bg-white rounded-lg border">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Reporte</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Hora</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">Valor</th>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-600">Novedad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportesArray && reportesArray.length > 0 ? (
                        reportesArray.map((reporte, idx) => (
                          <tr key={`${reporte.reporte}-${reporte.hora}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">{reporte.reporte}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{reporte.hora}</td>
                            <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">{reporte.valor}</td>
                            <td className="px-4 py-2 text-center">
                              {reporte.nota ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <Info className="w-4 h-4 text-blue-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs">{reporte.nota}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-sm text-center text-gray-500">
                            No hay reportes registrados para este día
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Notas</h3>
                <div className="p-3 border rounded-md bg-gray-50 min-h-[60px]">
                  <p className="whitespace-pre-wrap text-gray-700 text-sm">
                    {data.nota || ''}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 p-8">
              Seleccione un colaborador para ver los detalles de sus reportes.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DetailModal; 