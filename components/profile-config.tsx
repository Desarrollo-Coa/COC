"use client"

import type React from "react"
import ReportSystem from "@/components/report-system" // Import ReportSystem component

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Sun, Moon, LogOut, Shield, Clock, MapPin, MessageSquare } from "lucide-react"

interface ProfileConfigProps {
  user: string
  id_colaborador: number
  id_puesto: number
  onLogout: () => void
}

export default function ProfileConfig({ user, id_colaborador, id_puesto, onLogout }: ProfileConfigProps) {
  const [profileImage, setProfileImage] = useState<string>("")
  const [selectedShift, setSelectedShift] = useState<"diurno" | "nocturno" | "">("")
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [showReports, setShowReports] = useState(false)

  // Actualizar hora cada segundo
  useState(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(interval)
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setProfileImage(result)
        localStorage.setItem("vigilanteProfileImage", result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleShiftSelection = async (shift: "diurno" | "nocturno") => {
    setSelectedShift(shift)
    localStorage.setItem("vigilanteShift", shift)

    // Lógica para registrar el cumplido
    const id_tipo_turno = shift === "diurno" ? 1 : 2
    const fecha = new Date().toISOString().split("T")[0]
    try {
      const res = await fetch("/api/cumplidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_puesto,
          fecha,
          id_tipo_turno,
          id_colaborador
        })
      })
      const data = await res.json()
      if (!data.success) {
        alert(data.error || "Error al registrar el turno")
      }
    } catch (e) {
      alert("Error de red al registrar el turno")
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
    return <ReportSystem user={user} shift={selectedShift} onBack={() => setShowReports(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">¡Hola {user.split(" ")[0]}!</h1>
            <p className="text-gray-600 text-sm">Buen día</p>
          </div>
          <Button onClick={onLogout} variant="outline" size="icon" className="rounded-full bg-transparent">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="mb-6 bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white/30">
                  {profileImage ? (
                    <img
                      src={profileImage || "/placeholder.svg"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">{getInitials(user)}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <h2 className="text-xl font-bold mb-1">{user}</h2>
              <p className="text-blue-100 text-sm mb-4">Vigilante de Seguridad</p>

              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold">24</div>
                  <div className="text-xs text-blue-100">Días activo</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">156</div>
                  <div className="text-xs text-blue-100">Horas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">98%</div>
                  <div className="text-xs text-blue-100">Puntualidad</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Time */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">{currentTime}</p>
                  <p className="text-sm text-gray-600">Hora actual</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Turno {getCurrentShiftRecommendation()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Shift Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Seleccionar Turno
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => handleShiftSelection("diurno")}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedShift === "diurno"
                  ? "border-yellow-400 bg-yellow-50"
                  : "border-gray-200 hover:border-yellow-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedShift === "diurno" ? "bg-yellow-400" : "bg-gray-100"
                  }`}
                >
                  <Sun className={`w-6 h-6 ${selectedShift === "diurno" ? "text-white" : "text-gray-600"}`} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Turno Diurno</h3>
                  <p className="text-sm text-gray-600">06:00 - 18:00</p>
                </div>
                {selectedShift === "diurno" && <Badge className="ml-auto bg-yellow-400 text-white">Seleccionado</Badge>}
              </div>
            </button>

            <button
              onClick={() => handleShiftSelection("nocturno")}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedShift === "nocturno" ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedShift === "nocturno" ? "bg-blue-400" : "bg-gray-100"
                  }`}
                >
                  <Moon className={`w-6 h-6 ${selectedShift === "nocturno" ? "text-white" : "text-gray-600"}`} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Turno Nocturno</h3>
                  <p className="text-sm text-gray-600">18:00 - 06:00</p>
                </div>
                {selectedShift === "nocturno" && <Badge className="ml-auto bg-blue-400 text-white">Seleccionado</Badge>}
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 text-sm">Marcar Ubicación</h3>
              <p className="text-xs text-gray-600">Registrar posición</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowReports(true)}>
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 text-sm">Reportes</h3>
              <p className="text-xs text-gray-600">Comunicación</p>
            </CardContent>
          </Card>
        </div>

        {/* Status */}
        {selectedShift && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-semibold text-green-800">Sistema Configurado</p>
                  <p className="text-sm text-green-700">Turno {selectedShift} seleccionado - Listo para trabajar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
