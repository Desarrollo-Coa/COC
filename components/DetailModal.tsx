import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart2, MessageSquare, Play, Pause, Volume2, Clock, MapPin } from "lucide-react";
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
  id_cumplido?: number;
  cumplido_latitud?: number;
  cumplido_longitud?: number;
}

interface ChatMessage {
  id: string;
  contenido: string;
  tipo_mensaje: string;
  audio_url?: string;
  fecha_creacion: string;
  hora_mensaje: string;
  latitud?: number;
  longitud?: number;
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
  const [cumplidoPhoto, setCumplidoPhoto] = useState<string | null>(null);
  const [cumplidoCoords, setCumplidoCoords] = useState<{latitud: number, longitud: number} | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Función para abrir ubicación en nueva ventana
  const openLocation = (latitud: number, longitud: number) => {
    const url = `https://www.google.com/maps?q=${latitud},${longitud}`;
    window.open(url, '_blank');
  };

  // Función para obtener iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Función para cargar el chat del día
  const fetchChatMessages = async (idCumplido: number) => {
    try {
      setLoadingChat(true);
      
      const tokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('vigilante_token='));
      let token = null;
      if (tokenCookie) {
        try {
          const sessionData = JSON.parse(tokenCookie.split('=')[1]);
          token = sessionData.token;
        } catch (error) {
          console.error('Error parsing session data:', error);
        }
      }

      const response = await fetch(`/api/comunicacion/mensajes?idCumplido=${idCumplido}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(data.mensajes || []);
      } else {
        console.error('Error cargando chat:', response.status);
        setChatMessages([]);
      }
    } catch (error) {
      console.error('Error cargando chat:', error);
      setChatMessages([]);
    } finally {
      setLoadingChat(false);
    }
  };

  // Función para reproducir audio
  const playAudio = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlaying(false);
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    
    audio.play();
    setCurrentAudio(audio);
  };

  const pauseAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
    }
  };

  // Función para formatear hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-ES", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false
    });
  };

  // Función para obtener la foto del cumplido
  const fetchCumplidoPhoto = async (idCumplido: number) => {
    try {
      console.log('🔍 Iniciando búsqueda de foto para cumplido:', idCumplido);
      
      const tokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('vigilante_token='));
      let token = null;
      if (tokenCookie) {
        try {
          const sessionData = JSON.parse(tokenCookie.split('=')[1]);
          token = sessionData.token;
        } catch (error) {
          console.error('Error parsing session data:', error);
        }
      }

      console.log('🔑 Token obtenido:', !!token);

      const response = await fetch(`/api/cumplidos/archivos/${idCumplido}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📸 Data de la foto:', data);
        
        if (data.foto && data.foto.url) {
          console.log('✅ Foto encontrada:', data.foto.url);
          setCumplidoPhoto(data.foto.url);
          
          // Guardar coordenadas si están disponibles
          if (data.foto.latitud && data.foto.longitud) {
            setCumplidoCoords({
              latitud: data.foto.latitud,
              longitud: data.foto.longitud
            });
          } else {
            setCumplidoCoords(null);
          }
        } else {
          console.log('❌ No se encontró foto en la respuesta');
          setCumplidoPhoto(null);
          setCumplidoCoords(null);
        }
      } else {
        console.error('❌ Error en la respuesta:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error data:', errorData);
        setCumplidoPhoto(null);
      }
    } catch (error) {
      console.error('❌ Error cargando foto del cumplido:', error);
      setCumplidoPhoto(null);
    }
  };

  useEffect(() => {
    if (!isOpen || !colaboradorId || !fecha || !puestoId) return;
    setLoading(true);
    setError(null);
    setData(null);
    setReportesArray([]);
    setCumplidoPhoto(null);
    setCumplidoCoords(null);
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
        console.log('📊 Datos recibidos del backend:', d);
        setData(d);
        
        // Obtener la foto del cumplido si hay un id_cumplido
        if (d.id_cumplido) {
          console.log('🔍 Buscando foto para cumplido ID:', d.id_cumplido);
          await fetchCumplidoPhoto(d.id_cumplido);
        } else {
          console.log('❌ No se encontró id_cumplido en la respuesta');
        }
        
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
          <DialogDescription>
            Información detallada de los reportes de comunicación del colaborador
          </DialogDescription>
        </VisuallyHidden>
                {cumplidoPhoto ? (
          // CON FOTO DE CUMPLIDO: Foto de cumplido como background, perfil abajo
          <>
            <div 
              className="text-white rounded-t-lg flex flex-col items-center p-6 relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              style={{
                backgroundImage: `url(${cumplidoPhoto})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
                minHeight: '200px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onClick={() => window.open(cumplidoPhoto, '_blank')}
              title="Hacer clic para ver la imagen completa"
            >
              {/* La foto de cumplido queda libre de texto */}
            </div>
            
            {/* Sección del perfil del colaborador debajo */}
            <div className="bg-white p-4 flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-blue-300 flex-shrink-0">
                {data?.colaborador?.foto_url ? (
                  <img
                    src={data.colaborador.foto_url}
                    alt={data.colaborador.nombre}
                    className="w-16 h-16 object-cover rounded-full"
                  />
                ) : (
                  <span className="text-sm font-bold text-blue-600">
                    {data?.colaborador?.nombre ? getInitials(data.colaborador.nombre) : "U"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-base">{data?.colaborador?.nombre || (loading ? <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" /> : "-")}</div>
                <div className="text-xs text-gray-600">{data?.puesto || (loading ? <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /> : "-")}</div>
              </div>
              {/* Icono de ubicación para la foto de cumplido */}
              {cumplidoPhoto && cumplidoCoords && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openLocation(cumplidoCoords.latitud, cumplidoCoords.longitud)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ver ubicación de la foto</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </>
        ) : (
          // SIN FOTO DE CUMPLIDO: Foto del colaborador centrada
          <div className="bg-gray-800 text-white rounded-t-lg flex flex-col items-center p-6">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4 overflow-hidden border-2 border-blue-300">
              {data?.colaborador?.foto_url ? (
                <img
                  src={data.colaborador.foto_url}
                  alt={data.colaborador.nombre}
                  className="w-24 h-24 object-cover rounded-full"
                />
              ) : (
                <span className="text-xl font-bold text-blue-600">
                  {data?.colaborador?.nombre ? getInitials(data.colaborador.nombre) : "U"}
                </span>
              )}
            </div>
            <div className="text-center text-white font-semibold text-lg">{data?.colaborador?.nombre || (loading ? <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" /> : "-")}</div>
            <div className="text-sm opacity-75 text-white">{data?.puesto || (loading ? <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /> : "-")}</div>
            <div className="text-sm opacity-75 text-white mt-2">{data?.fecha ? (() => {
              const [year, month, day] = data.fecha.split('-');
              return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              });
            })() : (loading ? <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /> : "-")}</div>
          </div>
        )}
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">Reportes de Comunicación</h3>
                  {data?.id_cumplido && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowChat(!showChat);
                              if (!showChat && data.id_cumplido) {
                                fetchChatMessages(data.id_cumplido);
                              }
                            }}
                            className="flex items-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Chat del día
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver mensajes y audios del día</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
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
              
              {/* Sección del Chat */}
              {showChat && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Chat del día</h3>
                  </div>
                  
                  {loadingChat ? (
                    <div className="bg-white rounded-lg border p-4">
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="flex-1">
                              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : chatMessages.length > 0 ? (
                    <div className="bg-white rounded-lg border max-h-64 overflow-y-auto">
                      <div className="p-4 space-y-3">
                        {chatMessages.map((message) => (
                          <div key={message.id} className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              {message.tipo_mensaje === 'audio' ? (
                                <Volume2 className="w-4 h-4 text-blue-600" />
                              ) : (
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500">
                                  {formatTime(message.fecha_creacion)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-700">
                                {message.tipo_mensaje === 'audio' ? (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => isPlaying ? pauseAudio() : playAudio(message.audio_url!)}
                                        className="h-6 w-6 p-0"
                                      >
                                        {isPlaying ? (
                                          <Pause className="w-3 h-3" />
                                        ) : (
                                          <Play className="w-3 h-3" />
                                        )}
                                      </Button>
                                    </div>
                                    {/* Icono de ubicación para audio */}
                                    {message.latitud && message.longitud && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => openLocation(message.latitud!, message.longitud!)}
                                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                                            >
                                              <MapPin className="w-3 h-3" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Ver ubicación del audio</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <p className="text-gray-700 flex-1 min-w-0">{message.contenido}</p>
                                    {/* Icono de ubicación para mensaje de texto */}
                                    {message.latitud && message.longitud && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => openLocation(message.latitud!, message.longitud!)}
                                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 flex-shrink-0"
                                            >
                                              <MapPin className="w-3 h-3" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Ver ubicación del mensaje</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border p-6 text-center">
                      <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No hay mensajes para mostrar</p>
                    </div>
                  )}
                </div>
              )}
              
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