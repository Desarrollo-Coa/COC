"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Building2, Users, Eye, EyeOff } from "lucide-react"
import ProfileConfig from "@/components/profile-config"

interface Business {
  id_negocio: number;
  name: string;
  code: string;
  users: string[];
}

interface LoginFormProps {
  negocioHash: string | null;
  business: Business | null;
  onLogin?: (user: string) => void;
}

interface UnidadNegocio {
  id_unidad: number;
  nombre_unidad: string;
}

interface Puesto {
  id_puesto: number;
  nombre_puesto: string;
  id_unidad: number;
}

interface Colaborador {
  id: number;
  nombres: string;
  apellidos: string;
  activo: boolean;
  foto_url?: string;
}

export default function LoginForm({ negocioHash, business, onLogin }: LoginFormProps) {
  const [businessCode, setBusinessCode] = useState("")
  const [selectedUser, setSelectedUser] = useState<Colaborador | null>(null)
  const [userSearch, setUserSearch] = useState("")
  const [showUsers, setShowUsers] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState<"business" | "user" | "unidad" | "puesto" | "perfil">("business")

  // Nuevos estados para unidades, puestos y colaboradores
  const [unidades, setUnidades] = useState<UnidadNegocio[]>([])
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadNegocio | null>(null)
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [selectedPuesto, setSelectedPuesto] = useState<Puesto | null>(null)
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])

  // Cargar unidades cuando se pasa el código
  useEffect(() => {
    const fetchUnidades = async () => {
      if (step === "unidad" && business) {
        try {
          const res = await fetch(`/api/configuracion-unidades-negocio?id_negocio=${business.id_negocio}`);
          const data = await res.json();
          setUnidades(data);
        } catch (error) {
          console.error('Error cargando unidades:', error);
          setUnidades([]);
        }
      }
    };
    
    fetchUnidades();
  }, [step, business])

  // Cargar puestos cuando se selecciona unidad
  useEffect(() => {
    const fetchPuestos = async () => {
      if (step === "puesto" && selectedUnidad) {
        try {
          const res = await fetch(`/api/novedades/puestos?id_unidad=${selectedUnidad.id_unidad}`);
          const data = await res.json();
          setPuestos(data);
        } catch (error) {
          console.error('Error cargando puestos:', error);
          setPuestos([]);
        }
      }
    };
    
    fetchPuestos();
  }, [step, selectedUnidad])

  // Cargar colaboradores al pasar el código
  useEffect(() => {
    const fetchColaboradores = async () => {
      if (step === "user") {
        try {
          const res = await fetch(`/api/colaboradores`);
          const data = await res.json();
          setColaboradores(data);
        } catch (error) {
          console.error('Error cargando colaboradores:', error);
          setColaboradores([]);
        }
      }
    };
    
    fetchColaboradores();
  }, [step])

  const handleBusinessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (business && businessCode === business.code) {
      setStep("user")
      setError("")
    } else {
      setError("Código de negocio incorrecto")
    }
  }

  const handleUserSelect = (user: Colaborador) => {
    setSelectedUser(user)
    setUserSearch(user.nombres + " " + user.apellidos)
    setShowUsers(false)
  }

  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedUser) {
      setStep("unidad")
      setError("")
    } else {
      setError("Usuario no válido")
    }
  }

  const handleUnidadSelect = (unidad: UnidadNegocio) => {
    setSelectedUnidad(unidad)
    setStep("puesto")
    setError("")
  }

  const handlePuestoSelect = (puesto: Puesto) => {
    setSelectedPuesto(puesto)
    setStep("perfil")
    setError("")
  }

  // Filtros de búsqueda
  const filteredUsers = colaboradores.filter((user) =>
    (user.nombres + " " + user.apellidos).toLowerCase().includes(userSearch.toLowerCase())
  )

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Negocio no encontrado</h2>
            <p className="text-gray-600">El hash de negocio proporcionado no es válido.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "perfil" && selectedUser && selectedUnidad && selectedPuesto) {
    return (
      <ProfileConfig
        userData={{
          id: selectedUser.id,
          nombre: selectedUser.nombres,
          apellido: selectedUser.apellidos,
          cedula: "",
          activo: true,
          foto_url: selectedUser.foto_url
        }}
        negocioData={{
          id: business.id_negocio,
          nombre: business.name,
          activo: true
        }}
        puestoData={{
          id_puesto: selectedPuesto.id_puesto,
          nombre_puesto: selectedPuesto.nombre_puesto,
          id_unidad: selectedPuesto.id_unidad
        }}
        onLogout={() => {
          setStep("business")
          setBusinessCode("")
          setSelectedUser(null)
          setSelectedUnidad(null)
          setSelectedPuesto(null)
          localStorage.removeItem("vigilanteShift")
          localStorage.removeItem("vigilanteProfileImage")
        }}
      />
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-sm">
        {/* Header con patrón geométrico */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-t-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white transform rotate-45"></div>
            <div className="absolute top-8 right-8 w-6 h-6 border-2 border-white transform rotate-12"></div>
            <div className="absolute bottom-6 left-8 w-4 h-4 bg-white transform rotate-45"></div>
          </div>
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-8 h-8 text-gray-900" />
            </div>
          </div>
        </div>

        {/* Formulario por pasos */}
        <div className="bg-white rounded-b-3xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {step === "business" && "Acceso"}
              {step === "user" && "Seleccionar Usuario"}
              {step === "unidad" && "Seleccionar Unidad de Negocio"}
              {step === "puesto" && "Seleccionar Puesto"}
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">{business.name}</span>
            </div>
          </div>

          {step === "business" && (
            <form onSubmit={handleBusinessCodeSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="businessCode" className="text-sm font-medium text-gray-700">
                  Código de Negocio
                </Label>
                <div className="relative">
                  <Input
                    id="businessCode"
                    type={showPassword ? "text" : "password"}
                    value={businessCode}
                    onChange={(e) => setBusinessCode(e.target.value)}
                    placeholder="Ingrese el código (ej: ABC123)"
                    className="pr-10 h-12 text-center font-mono text-lg tracking-wider"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
               </div>

              {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</div>}

              <Button
                type="submit"
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium"
              >
                Continuar
              </Button>
            </form>
          )}

          {step === "user" && (
            <form onSubmit={handleUserLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="userSearch" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Buscar Usuario
                </Label>
                <div className="relative">
                  <Input
                    id="userSearch"
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value)
                      setShowUsers(true)
                      setSelectedUser(null)
                    }}
                    onFocus={() => setShowUsers(true)}
                    placeholder="Escriba su nombre..."
                    className="h-12"
                    required
                  />

                  {showUsers && filteredUsers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredUsers.map((user, index) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {(user.nombres + " " + user.apellidos)
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <span className="font-medium text-gray-900">{user.nombres} {user.apellidos}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedUser && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                      {(selectedUser.nombres + " " + selectedUser.apellidos)
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedUser.nombres} {selectedUser.apellidos}</p>
                      <p className="text-sm text-gray-600">Usuario seleccionado</p>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</div>}

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setStep("business")}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                >
                  Atrás
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedUser}
                  className="flex-1 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  Siguiente
                </Button>
              </div>
            </form>
          )}

          {step === "unidad" && (
            <div className="space-y-6">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Seleccione la unidad de negocio
              </Label>
              <div className="space-y-2">
                {unidades.length === 0 && <div className="text-gray-500 text-center">No hay unidades disponibles</div>}
                {unidades.map((unidad) => (
                  <button
                    key={unidad.id_unidad}
                    onClick={() => handleUnidadSelect(unidad)}
                    className={`w-full p-4 rounded-xl border-2 transition-all mb-2 ${selectedUnidad?.id_unidad === unidad.id_unidad ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                  >
                    <span className="font-semibold text-gray-900">{unidad.nombre_unidad}</span>
                  </button>
                ))}
              </div>
              <Button
                type="button"
                onClick={() => setStep("user")}
                variant="outline"
                className="w-full h-12 rounded-xl"
              >
                Atrás
              </Button>
            </div>
          )}

          {step === "puesto" && (
            <div className="space-y-6">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Seleccione el puesto
              </Label>
              <div className="space-y-2">
                {puestos.length === 0 && <div className="text-gray-500 text-center">No hay puestos disponibles</div>}
                {puestos.map((puesto) => (
                  <button
                    key={puesto.id_puesto}
                    onClick={() => handlePuestoSelect(puesto)}
                    className={`w-full p-4 rounded-xl border-2 transition-all mb-2 ${selectedPuesto?.id_puesto === puesto.id_puesto ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                  >
                    <span className="font-semibold text-gray-900">{puesto.nombre_puesto}</span>
                  </button>
                ))}
              </div>
              <Button
                type="button"
                onClick={() => setStep("unidad")}
                variant="outline"
                className="w-full h-12 rounded-xl"
              >
                Atrás
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
