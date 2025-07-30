'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, User, Eye, EyeOff, AlertCircle, Building2, MapPin, ChevronDown } from 'lucide-react';

interface LoginFormProps {
  negocioHash: string;
  business: {
    id_negocio: number;
    nombre_negocio: string;
  };
}

interface Puesto {
  id_puesto: number;
  nombre_puesto: string;
  nombre_unidad: string;
}

export default function LoginForm({ negocioHash, business }: LoginFormProps) {
  const [cedula, setCedula] = useState('');
  const [codigoAcceso, setCodigoAcceso] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [selectedPuesto, setSelectedPuesto] = useState<Puesto | null>(null);
  const [showPuestosDropdown, setShowPuestosDropdown] = useState(false);
  const [loadingPuestos, setLoadingPuestos] = useState(false);
  const router = useRouter();

  // Función para obtener token de cookies
  const getTokenFromCookies = () => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('vigilante_token='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  };

  // Función para guardar token en cookies
  const setTokenInCookies = (token: string) => {
    document.cookie = `vigilante_token=${token}; path=/; max-age=${12 * 60 * 60}; SameSite=Strict`;
  };

  // Función para eliminar token de cookies
  const removeTokenFromCookies = () => {
    document.cookie = 'vigilante_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  // Verificar sesión existente al cargar
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = getTokenFromCookies();
        
        if (token) {
          const response = await fetch('/api/accesos/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Negocio-Hash': negocioHash
            }
          });
          
          if (response.ok) {
            // Si ya tiene sesión activa, redirigir a principal
            router.push(`/accesos/login/${negocioHash}/principal`);
            return;
          } else {
            // Token inválido, limpiar
            removeTokenFromCookies();
          }
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
      } finally {
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, [negocioHash, router]);

  // Cargar puestos disponibles al montar el componente
  useEffect(() => {
    const loadPuestos = async () => {
      setLoadingPuestos(true);
      try {
        const response = await fetch(`/api/accesos/puestos?negocioHash=${negocioHash}`);
        
        if (response.ok) {
          const data = await response.json();
          setPuestos(data);
          // Seleccionar el primer puesto por defecto
          if (data.length > 0) {
            setSelectedPuesto(data[0]);
          }
        } else {
          console.error('Error cargando puestos:', await response.json());
        }
      } catch (error) {
        console.error('Error cargando puestos:', error);
      } finally {
        setLoadingPuestos(false);
      }
    };

    loadPuestos();
  }, [negocioHash]);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.puesto-dropdown')) {
        setShowPuestosDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPuesto) {
      setError('Debes seleccionar un puesto');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/accesos/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cedula,
          codigo_acceso: codigoAcceso,
          negocio_hash: negocioHash
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Asignar el puesto seleccionado al usuario
        const fecha = new Date().toISOString().split('T')[0];
        const asignacionResponse = await fetch('/api/accesos/asignaciones', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`,
            'X-Negocio-Hash': negocioHash
          },
          body: JSON.stringify({
            id_puesto: selectedPuesto.id_puesto,
            fecha: fecha,
            id_tipo_turno: 1, // Turno diurno por defecto
            id_colaborador: null // Se asignará automáticamente desde el token
          })
        });

        if (asignacionResponse.ok) {
          // Guardar token en cookies
          setTokenInCookies(data.token);
          
          // Guardar puesto en cookies
          document.cookie = `vigilante_puesto=${encodeURIComponent(JSON.stringify(selectedPuesto))}; path=/; max-age=${12 * 60 * 60}; SameSite=Strict`;
          
          // Redirigir a la página principal
          router.push(`/accesos/login/${negocioHash}/principal`);
        } else {
          const errorData = await asignacionResponse.json();
          setError(errorData.error || 'Error al asignar puesto');
        }
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras verifica la sesión
  if (checkingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="w-full max-w-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-t-3xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white transform rotate-45"></div>
              <div className="absolute top-8 right-8 w-6 h-6 border-2 border-white transform rotate-12"></div>
              <div className="absolute bottom-6 left-8 w-4 h-4 bg-white transform rotate-45"></div>
            </div>
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-8 h-8 text-gray-900 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-b-3xl p-8 shadow-xl">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verificando sesión...</h1>
              <p className="text-gray-600">Cargando tu perfil</p>
            </div>
          </div>
        </div>
      </div>
    );
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

        {/* Contenido principal */}
        <div className="bg-white rounded-b-3xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Registro Operativo
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">{business.nombre_negocio}</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            )}

            {/* Cédula o Placa Input */}
            <div>
              <label htmlFor="cedula" className="block text-sm font-medium text-gray-700 mb-2">
                Cédula o Placa
              </label>
              <input
                type="text"
                id="cedula"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ingresa tu cédula o placa"
                required
              />
            </div>

            {/* Código de Acceso Input */}
            <div>
              <label htmlFor="codigoAcceso" className="block text-sm font-medium text-gray-700 mb-2">
                Código de Acceso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="codigoAcceso"
                  value={codigoAcceso}
                  onChange={(e) => setCodigoAcceso(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ingresa el código de acceso"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Puesto Selection */}
            <div>
              <label htmlFor="puesto" className="block text-sm font-medium text-gray-700 mb-2">
                Puesto de Trabajo
              </label>
              <div className="relative puesto-dropdown">
                <button
                  type="button"
                  onClick={() => setShowPuestosDropdown(!showPuestosDropdown)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className={selectedPuesto ? "text-gray-900" : "text-gray-500"}>
                      {selectedPuesto ? `${selectedPuesto.nombre_puesto} - ${selectedPuesto.nombre_unidad}` : "Selecciona un puesto"}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showPuestosDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {showPuestosDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {loadingPuestos ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Cargando puestos...
                      </div>
                    ) : puestos.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No hay puestos disponibles
                      </div>
                    ) : (
                      puestos.map((puesto) => (
                        <button
                          key={puesto.id_puesto}
                          type="button"
                          onClick={() => {
                            setSelectedPuesto(puesto);
                            setShowPuestosDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{puesto.nombre_puesto}</div>
                          <div className="text-sm text-gray-600">{puesto.nombre_unidad}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedPuesto}
              className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-3 px-6 rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>

            {/* Info Card */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Información</h3>
                  <p className="text-sm text-blue-700">
                    Si no tienes acceso, contacta a la central de operaciones para obtener tus credenciales.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 