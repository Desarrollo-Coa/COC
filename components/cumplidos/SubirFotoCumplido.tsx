"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import Webcam from 'react-webcam'
import { useImageOptimizer } from '@/lib/imageOptimizer'

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

      // Convertir data URL a File
      const byteString = atob(imageSrc.split(',')[1]);
      const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const file = new File([blob], 'webcam-photo.jpg', { type: 'image/jpeg' });

      // Optimizar la imagen
      const { optimizedFile, previewUrl: optimizedPreviewUrl } = await optimizeAndPreview(file, {
        maxSizeMB: isMobile() ? 0.3 : 0.5, // Menor tamaño para móviles
        maxWidthOrHeight: isMobile() ? 800 : 1200 // Menor resolución para móviles
      });
      setOptimizedImage(optimizedFile);

      // Crear un canvas para agregar la marca de agua
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.error('No se pudo obtener el contexto del canvas');
            setPreviewUrl(optimizedPreviewUrl);
            setWatermarkedImage(optimizedFile);
            setShowCamera(false);
            return;
          }

          // Dibujar la imagen original
          ctx.drawImage(img, 0, 0);

          // Configurar estilo para la marca de agua
          const fontSize = Math.max(Math.min(canvas.width * 0.05, 24), 14); // Tamaño más pequeño
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.textAlign = 'left';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
          ctx.lineWidth = Math.max(fontSize * 0.1, 1);

          // Agregar FORTOX y hora actual
          const watermarkText = `FORTOX - ${currentTime}`;
          const padding = Math.max(canvas.width * 0.02, 10);
          const textY = canvas.height - padding;

          // Dibujar sombra y texto
          ctx.strokeText(watermarkText, padding, textY);
          ctx.fillText(watermarkText, padding, textY);

          // Convertir canvas a URL de datos y a File
          const quality = isMobile() ? 0.7 : 0.9; // Menor calidad en móviles
          const watermarkedDataUrl = canvas.toDataURL('image/jpeg', quality);
          setPreviewUrl(watermarkedDataUrl);

          // Convertir data URL a File
          const byteString = atob(watermarkedDataUrl.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const watermarkedBlob = new Blob([ab], { type: 'image/jpeg' });
          const watermarkedFile = new File([watermarkedBlob], 'webcam-photo-watermarked.jpg', { type: 'image/jpeg' });
          setWatermarkedImage(watermarkedFile);

          setShowCamera(false);

          // Obtener ubicación
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setCoords({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                });
              },
              (error) => {
                console.error('Error obteniendo ubicación:', error);
              }
            );
          }
        } catch (error) {
          console.error('Error procesando imagen con marca de agua:', error);
          setPreviewUrl(optimizedPreviewUrl);
          setWatermarkedImage(optimizedFile);
          setShowCamera(false);
        }
      };

      img.onerror = (error) => {
        console.error('Error cargando imagen:', error);
        setPreviewUrl(optimizedPreviewUrl);
        setWatermarkedImage(optimizedFile);
        setShowCamera(false);
      };

      img.src = optimizedPreviewUrl; // Usar la URL optimizada
    } catch (error) {
      console.error('Error al capturar imagen:', error);
      setShowCamera(false);
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
            <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={existingPhoto.url} 
                alt="Foto de llegada" 
                className="w-full h-full object-cover"
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
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover"
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
                >
                  Capturar
                </Button>
                <Button 
                  onClick={toggleCamera}
                  variant="outline"
                  size="sm"
                  className="bg-white/80 hover:bg-white"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => setShowCamera(false)}
                  variant="destructive"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : previewUrl ? (
            <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={previewUrl} 
                alt="Vista previa" 
                className="w-full h-full object-cover"
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
              className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
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