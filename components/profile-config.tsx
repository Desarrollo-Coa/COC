"use client"

import type React from "react"
import ReportSystem from "@/components/report-system" 

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Sun, Moon, LogOut, Shield, Clock, MapPin, MessageSquare } from "lucide-react"

interface ProfileConfigProps {
  user: string
  id_colaborador: number
  id_puesto: number
  onLogout: () => void
  negocio?: {
    id: number
    nombre: string
  }
  puesto?: {
    id: number
    nombre: string
  }
}

export default function ProfileConfig({ user, id_colaborador, id_puesto, onLogout, negocio, puesto }: ProfileConfigProps) {
  const [profileImage, setProfileImage] = useState<string>("")
  const [selectedShift, setSelectedShift] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
  const [stats, setStats] = useState({ dias_activo: 0 })
  const [turnos, setTurnos] = useState<any[]>([])
  const [loadingTurnos, setLoadingTurnos] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [turnoToConfirm, setTurnoToConfirm] = useState<any>(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [turnoToRemove, setTurnoToRemove] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [showReports, setShowReports] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Actualizar hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Obtener estadísticas del vigilante y foto de perfil
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = document.cookie.split(';').find(cookie => cookie.trim().startsWith('vigilante_token='))?.split('=')[1];
        
        if (token) {
          // Obtener estadísticas
          const response = await fetch('/api/accesos/stats', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Negocio-Hash': window.location.pathname.split('/')[3] // Obtener el hash del negocio de la URL
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setStats(data);
          }

          // Obtener información del usuario incluyendo foto
          const userResponse = await fetch('/api/accesos/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Negocio-Hash': window.location.pathname.split('/')[3]
            }
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.foto_url) {
              setProfileImage(userData.foto_url);
            }
          }
        }
      } catch (error) {
        console.error('Error obteniendo datos del usuario:', error);
      }
    };

    fetchStats();
  }, [])

  // Obtener turnos disponibles
  useEffect(() => {
    const fetchTurnos = async () => {
      try {
        const negocioHash = window.location.pathname.split('/')[3];
        const fecha = new Date().toISOString().split('T')[0];
        const token = document.cookie.split(';').find(cookie => cookie.trim().startsWith('vigilante_token='))?.split('=')[1];
        
        console.log('Fetching turnos con:', { negocioHash, fecha, token: !!token });
        
        const response = await fetch(`/api/accesos/turnos?fecha=${fecha}&negocioHash=${negocioHash}&idPuesto=${id_puesto}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Negocio-Hash': negocioHash
          }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Turnos obtenidos:', data);
          setTurnos(data);
          
          // Verificar si el usuario ya tiene un turno asignado
          const miTurno = data.find((turno: any) => 
            turno.colaborador && turno.colaborador.id === id_colaborador
          );
          console.log('Mi turno encontrado:', miTurno);
          if (miTurno) {
            setSelectedShift(miTurno.id_tipo_turno);
          }
        } else {
          const error = await response.json();
          console.error('Error response:', error);
        }
      } catch (error) {
        console.error('Error obteniendo turnos:', error);
      } finally {
        setLoadingTurnos(false);
      }
    };

    fetchTurnos();
  }, [id_colaborador])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Mostrar loading
      setUploadingPhoto(true)
      setProfileImage('') // Limpiar imagen actual para mostrar loading

      // Crear FormData para subir archivo
      const formData = new FormData()
      formData.append('file', file)

      // Obtener token
      const token = document.cookie.split(';').find(cookie => cookie.trim().startsWith('vigilante_token='))?.split('=')[1]
      
      if (!token) {
        throw new Error('No se encontró el token de autenticación')
      }

      // Subir y actualizar foto en una sola operación
      const response = await fetch('/api/accesos/profile/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar la foto')
      }

      const data = await response.json()
      
      // Actualizar estado local
      setProfileImage(data.url)
      setUploadingPhoto(false)
      
      // Mostrar mensaje de éxito
      console.log('Foto de perfil actualizada exitosamente:', data.url)

    } catch (error: any) {
      console.error('Error actualizando foto de perfil:', error)
      alert(`Error al actualizar foto: ${error.message}`)
      setUploadingPhoto(false)
      
      // Recargar la foto actual desde el servidor
      const token = document.cookie.split(';').find(cookie => cookie.trim().startsWith('vigilante_token='))?.split('=')[1]
      if (token) {
        try {
          const userResponse = await fetch('/api/accesos/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Negocio-Hash': window.location.pathname.split('/')[3]
            }
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.foto_url) {
              setProfileImage(userData.foto_url);
            }
          }
        } catch (reloadError) {
          console.error('Error recargando foto:', reloadError);
        }
      }
    }
  }

  const handleShiftSelection = async (turno: any) => {
    console.log('handleShiftSelection llamado con:', turno);
    console.log('selectedShift actual:', selectedShift);
    console.log('id_colaborador:', id_colaborador);
    
    // Si ya está seleccionado, mostrar confirmación para quitar
    if (selectedShift === turno.id_tipo_turno) {
      console.log('Solicitando confirmación para quitar turno:', turno.id_tipo_turno);
      setTurnoToRemove(turno);
      setShowRemoveConfirm(true);
      return;
    }

    // Si está ocupado por otro, no permitir selección
    if (turno.ocupado && turno.colaborador?.id !== id_colaborador) {
      console.log('Turno ocupado por otro:', turno.colaborador?.id, 'vs', id_colaborador);
      alert('Este turno ya está ocupado por otro vigilante');
      return;
    }

    // Si ya tiene otro turno seleccionado, no permitir seleccionar otro
    if (selectedShift && selectedShift !== turno.id_tipo_turno) {
      console.log('Ya tiene un turno seleccionado:', selectedShift);
      alert('Ya tienes un turno seleccionado. Debes quitar la selección actual antes de seleccionar otro.');
      return;
    }

    // Confirmar selección
    console.log('Confirmando selección del turno:', turno.id_tipo_turno);
    setTurnoToConfirm(turno);
    setShowConfirm(true);
  }

  const confirmShiftSelection = async () => {
    if (!turnoToConfirm) return;

    console.log('confirmShiftSelection iniciado con:', turnoToConfirm);
    console.log('Datos a enviar:', { id_puesto, fecha: new Date().toISOString().split('T')[0], id_tipo_turno: turnoToConfirm.id_tipo_turno, id_colaborador });

    try {
      const fecha = new Date().toISOString().split('T')[0];
      const token = document.cookie.split(';').find(cookie => cookie.trim().startsWith('vigilante_token='))?.split('=')[1];
      const negocioHash = window.location.pathname.split('/')[3];
      
      console.log('Token encontrado:', !!token);
      console.log('Negocio hash:', negocioHash);
      
      // Primero, quitar cualquier turno existente del usuario
      if (selectedShift && selectedShift !== turnoToConfirm.id_tipo_turno) {
        console.log('Quitando turno existente antes de asignar nuevo');
        await removeShift(selectedShift);
      }
      
      const response = await fetch('/api/accesos/asignaciones', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Negocio-Hash': negocioHash
        },
        body: JSON.stringify({
          id_puesto,
          fecha,
          id_tipo_turno: turnoToConfirm.id_tipo_turno,
          id_colaborador
        })
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Response data:', responseData);
        setSelectedShift(turnoToConfirm.id_tipo_turno);
        // Recargar turnos para actualizar estado
        const turnosResponse = await fetch(`/api/accesos/turnos?fecha=${fecha}&negocioHash=${negocioHash}&idPuesto=${id_puesto}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Negocio-Hash': negocioHash
          }
        });
        if (turnosResponse.ok) {
          const data = await turnosResponse.json();
          console.log('Turnos actualizados:', data);
          setTurnos(data);
        }
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        alert(error.error || 'Error al asignar turno');
      }
    } catch (error) {
      console.error('Error asignando turno:', error);
      alert('Error al asignar turno');
    } finally {
      setShowConfirm(false);
      setTurnoToConfirm(null);
    }
  }

  const removeShift = async (idTipoTurno: number) => {
    try {
      console.log('Removiendo turno:', idTipoTurno);
      const fecha = new Date().toISOString().split('T')[0];
      const token = document.cookie.split(';').find(cookie => cookie.trim().startsWith('vigilante_token='))?.split('=')[1];
      const negocioHash = window.location.pathname.split('/')[3];
      
      const response = await fetch('/api/accesos/asignaciones', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Negocio-Hash': negocioHash
        },
        body: JSON.stringify({
          id_puesto,
          fecha,
          id_tipo_turno: idTipoTurno,
          id_colaborador: null // Quitar asignación
        })
      });

      console.log('Remove response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Remove response data:', responseData);
        setSelectedShift(null);
        // Recargar turnos para actualizar estado
        const turnosResponse = await fetch(`/api/accesos/turnos?fecha=${fecha}&negocioHash=${negocioHash}&idPuesto=${id_puesto}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Negocio-Hash': negocioHash
          }
        });
        if (turnosResponse.ok) {
          const data = await turnosResponse.json();
          console.log('Turnos actualizados después de remover:', data);
          setTurnos(data);
        }
      } else {
        const error = await response.json();
        console.error('Error removiendo turno:', error);
        alert(error.error || 'Error al quitar turno');
      }
    } catch (error) {
      console.error('Error removiendo turno:', error);
      alert('Error al quitar turno');
    }
  }

  const confirmRemoveShift = async () => {
    if (!turnoToRemove) return;

    console.log('confirmRemoveShift iniciado con:', turnoToRemove);
    
    try {
      await removeShift(turnoToRemove.id_tipo_turno);
    } catch (error) {
      console.error('Error en confirmRemoveShift:', error);
    } finally {
      setShowRemoveConfirm(false);
      setTurnoToRemove(null);
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getCurrentShiftRecommendation = () => {
    const hour = new Date().getHours()
    return hour >= 6 && hour < 18 ? "diurno" : "nocturno"
  }

  if (showReports) {
    return <ReportSystem user={user} shift={selectedShift === 1 ? "diurno" : selectedShift === 2 ? "nocturno" : ""} onBack={() => setShowReports(false)} />
  }

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="max-w-sm mx-auto">
        {/* Header Compacto */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {negocio?.nombre || "Cliente"}
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-blue-600" />
              <p className="text-blue-600 font-medium text-xs">
                {puesto?.nombre || "Puesto Principal"}
              </p>
            </div>
          </div>
          <Button onClick={onLogout} variant="outline" size="sm" className="rounded-full bg-transparent h-8 w-8 p-0">
            <LogOut className="w-3 h-3" />
          </Button>
        </div>

        {/* User Info Compacto */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
                  {uploadingPhoto ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-600">{getInitials(user)}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-2.5 h-2.5" />
                </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-xs font-bold text-gray-900 mb-0.5">
              {user}
            </h2>
            <div className="text-xs text-gray-600">
              <div>HORA: {currentTime}</div>
              <div>{stats.dias_activo} dias / {new Date().toLocaleDateString('es-ES', { month: 'long' }).toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* Shift Selection Compacto */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Seleccionar Turno
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingTurnos ? (
              <p className="text-center py-2 text-sm">Cargando turnos...</p>
            ) : turnos.length === 0 ? (
              <p className="text-center py-2 text-sm">No hay turnos disponibles.</p>
            ) : (
              turnos.map((turno) => (
                <button
                  key={turno.id_tipo_turno}
                  onClick={() => handleShiftSelection(turno)}
                  className={`w-full p-3 rounded-lg border transition-all ${
                    selectedShift === turno.id_tipo_turno
                      ? "border-yellow-400 bg-yellow-50"
                      : turno.ocupado && turno.colaborador?.id !== id_colaborador
                      ? "border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed"
                      : selectedShift && selectedShift !== turno.id_tipo_turno
                      ? "border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed"
                      : "border-gray-200 hover:border-yellow-300"
                  }`}
                  disabled={
                    turno.ocupado && turno.colaborador?.id !== id_colaborador ||
                    (selectedShift && selectedShift !== turno.id_tipo_turno)
                  }
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedShift === turno.id_tipo_turno ? "bg-yellow-400" : "bg-gray-100"
                      }`}
                    >
                      {turno.id_tipo_turno === 1 ? (
                        <Sun className={`w-4 h-4 ${selectedShift === turno.id_tipo_turno ? "text-white" : "text-gray-600"}`} />
                      ) : (
                        <Moon className={`w-4 h-4 ${selectedShift === turno.id_tipo_turno ? "text-white" : "text-gray-600"}`} />
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {turno.nombre_tipo_turno}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {turno.id_tipo_turno === 1 ? "06:00 - 18:00" : turno.id_tipo_turno === 3 ? "14:00 - 22:00" : "18:00 - 06:00"}
                      </p>
                      {turno.ocupado && turno.colaborador && (
                        <p className="text-xs text-red-600">
                          Ocupado por: {turno.colaborador.nombre}
                        </p>
                      )}
                    </div>
                    {selectedShift === turno.id_tipo_turno && (
                      <Badge className="bg-yellow-400 text-white text-xs">Seleccionado</Badge>
                    )}
                    {turno.ocupado && turno.colaborador?.id !== id_colaborador && (
                      <Badge className="bg-red-400 text-white text-xs">Ocupado</Badge>
                    )}
                    {selectedShift && selectedShift !== turno.id_tipo_turno && (
                      <Badge className="bg-gray-400 text-white text-xs">No disponible</Badge>
                    )}
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Compacto */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="cursor-pointer hover:shadow-sm transition-shadow border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <MapPin className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <h3 className="font-medium text-gray-900 text-xs">Marcar Ubicación</h3>
              <p className="text-xs text-gray-600">Registrar posición</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-sm transition-shadow border-0 shadow-sm" onClick={() => setShowReports(true)}>
            <CardContent className="p-3 text-center">
              <MessageSquare className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <h3 className="font-medium text-gray-900 text-xs">Reportes</h3>
              <p className="text-xs text-gray-600">Comunicación</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Compacto */}
        {selectedShift && (
          <Card className="bg-blue-50 border-blue-200 border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-blue-800 text-sm">Adjuntar fotografía de llegada al puesto</p>
                  <p className="text-xs text-blue-700">Turno {selectedShift} seleccionado - Captura tu llegada</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showConfirm && turnoToConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-xl max-w-sm mx-4">
              <h3 className="text-base font-bold mb-2">Confirmar Selección</h3>
              <p className="text-sm text-gray-800 mb-4">
                ¿Estás seguro de que quieres asignar el turno "{turnoToConfirm.nombre_tipo_turno}"?
                {selectedShift && selectedShift !== turnoToConfirm.id_tipo_turno && (
                  <span className="block text-yellow-600 mt-2 text-xs">
                    ⚠️ Esto reemplazará tu turno actual seleccionado.
                  </span>
                )}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>Cancelar</Button>
                <Button size="sm" onClick={confirmShiftSelection}>Confirmar</Button>
              </div>
            </div>
          </div>
        )}

        {showRemoveConfirm && turnoToRemove && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-xl max-w-sm mx-4">
              <h3 className="text-base font-bold mb-2">Confirmar Eliminación</h3>
              <p className="text-sm text-gray-800 mb-4">
                ¿Estás seguro de que quieres quitar el turno "{turnoToRemove.nombre_tipo_turno}"?
                <span className="block text-red-600 mt-2 text-xs">
                  ⚠️ Esto eliminará tu asignación actual.
                </span>
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowRemoveConfirm(false)}>Cancelar</Button>
                <Button variant="destructive" size="sm" onClick={confirmRemoveShift}>Quitar Turno</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 