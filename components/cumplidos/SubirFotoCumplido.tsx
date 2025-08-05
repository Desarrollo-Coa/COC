"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import Webcam from 'react-webcam'
import { useImageOptimizer } from '@/lib/imageOptimizer'

// Función para agregar marca de agua directamente en la imagen
const addWatermarkToImage = async (imageFile: File, watermarkText: string): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Configurar canvas con el tamaño de la imagen
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Dibujar la imagen original
      ctx?.drawImage(img, 0, 0);
      
      // Configurar el texto de marca de agua
      if (ctx) {
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.textAlign = 'left';
        
        // Posición de la marca de agua (esquina inferior izquierda)
        const x = 20;
        const y = img.height - 20;
        
        // Dibujar texto con sombra
        ctx.strokeText(watermarkText, x, y);
        ctx.fillText(watermarkText, x, y);
        
        // Agregar fecha y hora
        const timestamp = new Date().toLocaleString('es-ES');
        ctx.font = 'bold 16px Arial';
        ctx.strokeText(timestamp, x, y - 30);
        ctx.fillText(timestamp, x, y - 30);
      }
      
      // Convertir canvas a blob
      canvas.toBlob((blob) => {
        if (blob) {
          const watermarkedFile = new File([blob], 'watermarked-image.jpg', { type: 'image/jpeg' });
          resolve(watermarkedFile);
        } else {
          reject(new Error('Error al procesar imagen'));
        }
      }, 'image/jpeg', 0.9);
    };
    
    img.onerror = () => reject(new Error('Error al cargar imagen'));
    img.src = URL.createObjectURL(imageFile);
  });
};

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
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
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

      const response = await fetch(`/api/cumplidos/archivos/${idCumplido}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      setCurrentTime(new Date().toLocaleTimeString())
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

      // Agregar marca de agua directamente en la imagen
      try {
        console.log('🎨 [MOBILE] Agregando marca de agua directamente');
        const watermarkedFile = await addWatermarkToImage(optimizedFile, 'FORTOX');
        const dataUrl = URL.createObjectURL(watermarkedFile);
        
        console.log('✅ [MOBILE] Marca de agua agregada exitosamente');
        setPreviewUrl(dataUrl);
        setWatermarkedImage(watermarkedFile);
        setShowCamera(false);
      } catch (watermarkError) {
        console.warn('⚠️ [MOBILE] Error agregando marca de agua directa:', watermarkError);
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

      const apiResponse = await fetch('/api/cumplidos/archivos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
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