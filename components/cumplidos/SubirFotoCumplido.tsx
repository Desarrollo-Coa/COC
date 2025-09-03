"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import Webcam from 'react-webcam'
import { useImageOptimizer } from '@/lib/imageOptimizer'
import { addWatermarkWithCurrentConfig } from '@/utils/watermarkUtils'

interface SubirFotoCumplidoProps {
  idCumplido: number
  onSuccess?: () => void
  isActive?: boolean
}

export default function SubirFotoCumplido({ idCumplido, onSuccess, isActive = false }: SubirFotoCumplidoProps) {
  const [uploading, setUploading] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString("es-ES", { 
    hour: "2-digit", 
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }))
  const webcamRef = useRef<Webcam>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const { optimizeAndPreview } = useImageOptimizer()
  const [optimizedImage, setOptimizedImage] = useState<File | null>(null)
  const [watermarkedImage, setWatermarkedImage] = useState<File | null>(null)
  const [existingPhoto, setExistingPhoto] = useState<{ url: string; descripcion: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  // Detectar si es dispositivo móvil
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // Función para cargar foto existente
  const fetchExistingPhoto = async () => {
    try {
      // No enviar token en header, dejar que el middleware lo maneje desde cookies
      const response = await fetch(`/api/cumplidos/archivos/${idCumplido}`, {
        credentials: 'include' // Asegurar que se envíen las cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.foto) {
          setExistingPhoto({
            url: data.foto.url,
            descripcion: data.foto.descripcion
          });
        } else {
          setExistingPhoto(null);
        }
      }
    } catch (error) {
      console.error('Error cargando foto existente:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar foto existente al montar el componente
  useEffect(() => {
    if (isActive) {
      fetchExistingPhoto();
    } else {
      setLoading(false);
    }
  }, [idCumplido, isActive]);

  // Actualizar hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("es-ES", { 
        hour: "2-digit", 
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }))
    }, 1000)
    return () => clearInterval(interval)
  }, []);

  const capture = useCallback(async () => {
    try {
      if (!webcamRef.current) {
        console.error('Webcam ref no disponible');
        return;
      }

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        console.error('No se pudo capturar la imagen');
        return;
      }

      // Mostrar indicador de procesamiento
      setUploading(true);

      // Convertir data URL a File
      const byteString = atob(imageSrc.split(',')[1]);
      const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: 'image/jpeg' });
      const file = new File([blob], 'webcam-photo.jpg', { type: 'image/jpeg' });

      // Optimizar la imagen con configuración más agresiva para móviles
      const { optimizedFile, previewUrl: optimizedPreviewUrl } = await optimizeAndPreview(file, {
        maxSizeMB: isMobile() ? 0.2 : 0.4, // Tamaño aún menor para móviles
        maxWidthOrHeight: isMobile() ? 640 : 800 // Resolución más baja
      });
      setOptimizedImage(optimizedFile);

      // Función para agregar marca de agua localmente (sin dependencia externa)
      const addWatermarkLocally = async (imageFile: File): Promise<{ dataUrl: string; file: File }> => {
        try {
          console.log('🎨 [MOBILE] Agregando marca de agua localmente:', {
            size: imageFile.size,
            type: imageFile.type,
            name: imageFile.name
          });
          
          const fecha = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          
          const result = await addWatermarkWithCurrentConfig(imageFile, currentTime, fecha);
          
          console.log('✅ [MOBILE] Marca de agua agregada localmente:', {
            size: result.file.size,
            type: result.file.type
          });
          
          return result;
        } catch (error) {
          console.error('❌ [MOBILE] Error agregando marca de agua localmente:', error);
          throw error;
        }
      };

      // Obtener ubicación primero (antes del procesamiento de imagen)
      const getLocation = (): Promise<{ lat: number; lng: number } | null> => {
        return new Promise((resolve) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const coords = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                setCoords(coords);
                resolve(coords);
              },
              (error) => {
                console.error('Error obteniendo ubicación:', error);
                resolve(null);
              },
              {
                timeout: 5000, // 5 segundos de timeout
                enableHighAccuracy: false, // Mejor compatibilidad en Android
                maximumAge: 60000 // Cache de 1 minuto
              }
            );
          } else {
            resolve(null);
          }
        });
      };

      // Obtener ubicación y luego procesar imagen
      await getLocation();

      // Intentar agregar marca de agua con fallback
      try {
        const { dataUrl, file } = await addWatermarkLocally(optimizedFile);
        console.log('🎯 [MOBILE] Estableciendo vista previa con marca de agua');
        setPreviewUrl(dataUrl);
        setWatermarkedImage(file);
        setShowCamera(false);
      } catch (watermarkError) {
        console.warn('⚠️ [MOBILE] No se pudo agregar marca de agua, usando imagen sin marca:', watermarkError);
        // Fallback: usar imagen sin marca de agua
        console.log('🎯 [MOBILE] Estableciendo vista previa sin marca de agua');
        setPreviewUrl(optimizedPreviewUrl);
        setWatermarkedImage(optimizedFile);
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Error al capturar imagen:', error);
      setShowCamera(false);
    } finally {
      setUploading(false);
    }
  }, [currentTime, optimizeAndPreview]);

  const handleSubmit = async () => {
    if (!previewUrl || !watermarkedImage) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', watermarkedImage);
      formData.append('idCumplido', idCumplido.toString());
      formData.append('descripcion', descripcion);

      if (coords) {
        formData.append('latitud', coords.lat.toString());
        formData.append('longitud', coords.lng.toString());
      }

      // No enviar token en header, dejar que el middleware lo maneje desde cookies
      const apiResponse = await fetch('/api/cumplidos/archivos', {
        method: 'POST',
        credentials: 'include', // Asegurar que se envíen las cookies
        body: formData
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.json();
        throw new Error(error.error || 'Error al subir la foto');
      }

      setPreviewUrl(null);
      setDescripcion('');
      setShowCamera(false);
      setWatermarkedImage(null);
      setOptimizedImage(null);

      await fetchExistingPhoto();
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const videoConstraints = {
    width: { ideal: isMobile() ? 640 : 1280 }, // Resolución más baja para móviles
    height: { ideal: isMobile() ? 480 : 720 },
    facingMode: facingMode
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isActive) {
    return (
      <Card className="border-0 shadow-sm bg-gray-50">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Selecciona un turno para poder subir una foto</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (existingPhoto) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="relative w-full max-h-80 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img 
                src={existingPhoto.url} 
                alt="Foto de llegada" 
                className="w-full h-full object-contain max-h-full"
              />
            </div>
            {existingPhoto.descripcion && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">{existingPhoto.descripcion}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-4">
          {showCamera ? (
            <div className="relative w-full max-h-80 bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-contain max-h-full"
                onUserMediaError={(error) => {
                  console.error('Error accediendo a la cámara:', error);
                  setShowCamera(false);
                }}
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                <Button 
                  onClick={capture}
                  variant="default"
                  size="sm"
                  disabled={uploading}
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    'Capturar'
                  )}
                </Button>
                <Button 
                  onClick={toggleCamera}
                  variant="outline"
                  size="sm"
                  className="bg-white/80 hover:bg-white"
                  disabled={uploading}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => setShowCamera(false)}
                  variant="destructive"
                  size="sm"
                  disabled={uploading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : previewUrl ? (
            <div className="relative w-full max-h-80 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img 
                src={previewUrl} 
                alt="Vista previa" 
                className="w-full h-full object-contain max-h-full"
                onLoad={() => console.log('✅ [MOBILE] Imagen de vista previa cargada correctamente')}
                onError={(e) => console.error('❌ [MOBILE] Error cargando imagen de vista previa:', e)}
              />
              <button
                onClick={() => {
                  setPreviewUrl(null);
                  setWatermarkedImage(null);
                  setOptimizedImage(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => setShowCamera(true)}
              className="w-full max-h-80 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <div className="text-center">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Tomar foto de llegada</p>
              </div>
            </div>
          )}

          <Textarea
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="resize-none"
          />

          <Button
            onClick={handleSubmit}
            disabled={!previewUrl || !watermarkedImage || uploading}
            className="w-full"
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Subiendo...</span>
              </div>
            ) : (
              'Subir Foto'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}