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
  }, [])

  const capture = useCallback(async () => {
    try {
      if (!webcamRef.current) return

      const imageSrc = webcamRef.current.getScreenshot()
      if (!imageSrc) return

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
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200
      });
      setOptimizedImage(optimizedFile);

      // Crear un canvas para agregar la marca de agua
      const canvas = document.createElement('canvas')
      const img = new Image()
      
      // Configurar crossOrigin para evitar problemas de CORS en móviles
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            console.error('No se pudo obtener el contexto del canvas')
            return
          }

          // Dibujar la imagen original
          ctx.drawImage(img, 0, 0)

          // Configurar estilo para la marca de agua
          const fontSize = Math.max(Math.min(canvas.width * 0.04, 36), 16) // Tamaño responsivo con mínimo
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)' // Más opaco para mejor visibilidad
          ctx.font = `bold ${fontSize}px Arial, sans-serif`
          ctx.textAlign = 'left'
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)' // Sombra más opaca
          ctx.lineWidth = Math.max(fontSize * 0.1, 1) // Grosor proporcional

          // Agregar FORTOX y hora actual
          const watermarkText = `FORTOX - ${currentTime}`
          const padding = Math.max(canvas.width * 0.02, 15) // Padding responsivo
          const textY = canvas.height - padding
          
          // Ajustes específicos para móviles
          if (isMobile()) {
            // En móviles, hacer el texto más grande y más visible
            ctx.fillStyle = 'rgba(255, 255, 255, 1)' // Completamente opaco
            ctx.strokeStyle = 'rgba(0, 0, 0, 1)' // Sombra completamente opaca
            ctx.lineWidth = Math.max(fontSize * 0.15, 2) // Línea más gruesa
          }
          
          // Dibujar sombra del texto
          ctx.strokeText(watermarkText, padding, textY)
          // Dibujar texto
          ctx.fillText(watermarkText, padding, textY)
          
          // Convertir canvas a URL de datos y a File
          let quality = 0.9
          if (isMobile()) {
            quality = 0.8 // Calidad más baja en móviles para mejor rendimiento
          }
          const watermarkedDataUrl = canvas.toDataURL('image/jpeg', quality)
          setPreviewUrl(watermarkedDataUrl)
          
          // Convertir data URL a File para subir
          const byteString = atob(watermarkedDataUrl.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const watermarkedBlob = new Blob([ab], { type: 'image/jpeg' });
          const watermarkedFile = new File([watermarkedBlob], 'webcam-photo-watermarked.jpg', { type: 'image/jpeg' });
          setWatermarkedImage(watermarkedFile);
          
          setShowCamera(false)

          // Obtener ubicación
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setCoords({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                })
              },
              (error) => {
                console.error('Error obteniendo ubicación:', error)
              }
            )
          }
        } catch (error) {
          console.error('Error procesando imagen con marca de agua:', error)
          // Fallback: usar la imagen sin marca de agua
          setPreviewUrl(imageSrc)
          setWatermarkedImage(optimizedFile)
          setShowCamera(false)
        }
      }

      img.onerror = (error) => {
        console.error('Error cargando imagen:', error)
        // Fallback: usar la imagen sin marca de agua
        setPreviewUrl(imageSrc)
        setWatermarkedImage(optimizedFile)
        setShowCamera(false)
      }

      img.src = imageSrc
    } catch (error) {
      console.error('Error al capturar imagen:', error);
    }
  }, [currentTime, optimizeAndPreview]);

  const handleSubmit = async () => {
    if (!previewUrl || !watermarkedImage) return
    
    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('file', watermarkedImage)
      formData.append('idCumplido', idCumplido.toString())
      formData.append('descripcion', descripcion)
      
      if (coords) {
        formData.append('latitud', coords.lat.toString())
        formData.append('longitud', coords.lng.toString())
      }

      // Obtener token
      const tokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('vigilante_token='))
      let token = null
      if (tokenCookie) {
        try {
          const sessionData = JSON.parse(tokenCookie.split('=')[1]);
          token = sessionData.token;
        } catch (error) {
          console.error('Error parsing session data:', error)
        }
      }

      const apiResponse = await fetch('/api/cumplidos/archivos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!apiResponse.ok) {
        const error = await apiResponse.json()
        throw new Error(error.error || 'Error al subir la foto')
      }

      // Limpiar formulario
      setPreviewUrl(null)
      setDescripcion('')
      setShowCamera(false)
      setWatermarkedImage(null)
      setOptimizedImage(null)
      
      // Recargar foto existente para mostrar la foto recién subida
      console.log('Debug: Recargando foto existente después de subir para idCumplido:', idCumplido)
      await fetchExistingPhoto()
      
      // Notificar éxito
      onSuccess?.()

    } catch (error) {
      console.error('Error:', error)
      alert('Error al subir la foto')
    } finally {
      setUploading(false)
    }
  }

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode
  }

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

          {/* Descripción opcional */}
          <Textarea
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="resize-none"
          />

          {/* Botón de subida */}
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