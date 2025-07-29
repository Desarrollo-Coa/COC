"use client";

import React, { useEffect, useState } from 'react';
import { KeyRound, Eye, EyeOff, Trash2, RefreshCw, Building2, Shield, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ui/confirm-dialog';

interface Negocio {
  id_negocio: number;
  nombre_negocio: string;
  activo: boolean;
  codigo_acceso_hash?: string;
}

const NegociosPage: React.FC = () => {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showCodigo, setShowCodigo] = useState<{ [id: number]: boolean }>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  // Estados para el diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  const fetchNegocios = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accesos/negocios');
      const data = await res.json();
      setNegocios(data);
    } catch (error) {
      console.error('Error cargando negocios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNegocios();
  }, []);

  // Función para actualizar un negocio específico en el estado
  const updateNegocioInState = (id_negocio: number, updates: Partial<Negocio>) => {
    setNegocios(prev => prev.map(negocio => 
      negocio.id_negocio === id_negocio 
        ? { ...negocio, ...updates }
        : negocio
    ));
  };

  // Función para remover un código del estado local
  const removeCodigoFromState = (id_negocio: number) => {
    setNegocios(prev => prev.map(negocio => 
      negocio.id_negocio === id_negocio 
        ? { ...negocio, codigo_acceso_hash: undefined }
        : negocio
    ));
    
    // Limpiar estados locales
    setShowCodigo(prev => {
      const nuevo = { ...prev };
      delete nuevo[id_negocio];
      return nuevo;
    });
  };

  const handleGenerarCodigo = async (id_negocio: number) => {
    setGenerating(id_negocio);
    try {
      const res = await fetch(`/api/accesos/negocios/${id_negocio}/codigo`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok && data.codigo) {
        toast.success(`Código generado exitosamente: ${data.codigo}`);
        
        // Actualizar el estado local inmediatamente con el nuevo código
        updateNegocioInState(id_negocio, { 
          codigo_acceso_hash: data.codigo
        });
        setShowCodigo((prev) => ({ ...prev, [id_negocio]: true }));
      } else {
        toast.error(data.error || 'No se pudo generar el código');
      }
    } catch (error) {
      toast.error('Error al generar el código');
    } finally {
      setGenerating(null);
    }
  };

  const handleEliminarCodigo = async (id_negocio: number) => {
    setDeleting(id_negocio);
    try {
      const res = await fetch(`/api/accesos/negocios/${id_negocio}/codigo`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success('Código eliminado correctamente');
        // Actualizar el estado local inmediatamente - remover completamente el código
        removeCodigoFromState(id_negocio);
      } else {
        toast.error(data.error || 'Error al eliminar el código');
      }
    } catch (error) {
      toast.error('Error al eliminar el código');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleShow = (id_negocio: number) => {
    setShowCodigo((prev) => ({ ...prev, [id_negocio]: !prev[id_negocio] }));
  };

  const handleCopyCode = (code: string, id_negocio: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id_negocio);
    toast.success('Código copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Funciones para mostrar diálogos de confirmación
  const showEliminarConfirm = (negocio: Negocio) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Código',
      message: `¿Estás seguro de que quieres eliminar permanentemente el código de acceso para "${negocio.nombre_negocio}"? Esta acción no se puede deshacer.`,
      onConfirm: () => handleEliminarCodigo(negocio.id_negocio),
      type: 'danger'
    });
  };

  const showRegenerarConfirm = (negocio: Negocio) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Regenerar Código',
      message: `¿Estás seguro de que quieres generar un nuevo código para "${negocio.nombre_negocio}"? El código actual será reemplazado.`,
      onConfirm: () => handleGenerarCodigo(negocio.id_negocio),
      type: 'warning'
    });
  };

  const getStatusBadge = (activo: boolean) => {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
        activo 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        {activo ? (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            Activo
          </>
        ) : (
          <>
            <AlertCircle className="w-3 h-3 mr-1" />
            Inactivo
          </>
        )}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Administrar Negocios</h1>
            <p className="text-gray-600">Gestiona los códigos de acceso para cada negocio</p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Negocios</p>
                <p className="text-2xl font-bold text-gray-900">{negocios.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Con Código</p>
                <p className="text-2xl font-bold text-gray-900">
                  {negocios.filter(n => n.codigo_acceso_hash).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {negocios.filter(n => n.activo).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-lg font-medium text-gray-600">Cargando negocios...</span>
            </div>
              </div>
            ) : negocios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay negocios disponibles</h3>
            <p className="text-gray-600 text-center">No se encontraron negocios para gestionar</p>
          </div>
        ) : (
          <div className="h-[600px] flex flex-col">
            {/* Table Header - Fixed */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
              <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <div className="col-span-1">ID</div>
                <div className="col-span-3">Negocio</div>
                <div className="col-span-2">Estado</div>
                <div className="col-span-4">Código de Acceso</div>
                <div className="col-span-2">Acciones</div>
              </div>
            </div>
            
            {/* Table Body - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-100">
                      {negocios.map((negocio) => (
                  <div key={negocio.id_negocio} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          #{negocio.id_negocio}
                            </span>
                      </div>
                      
                      <div className="col-span-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <Building2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900 break-words min-w-0">{negocio.nombre_negocio}</span>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        {getStatusBadge(negocio.activo)}
                      </div>
                      
                      <div className="col-span-4">
                        {negocio.codigo_acceso_hash ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 min-w-0">
                              <span className="font-mono text-sm select-all break-all text-gray-700">
                                {showCodigo[negocio.id_negocio] ? negocio.codigo_acceso_hash : '••••••••'}
                                </span>
                            </div>
                                <button
                                  onClick={() => handleToggleShow(negocio.id_negocio)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                                  title={showCodigo[negocio.id_negocio] ? 'Ocultar código' : 'Mostrar código'}
                                >
                                  {showCodigo[negocio.id_negocio] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                              onClick={() => handleCopyCode(negocio.codigo_acceso_hash!, negocio.id_negocio)}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
                              title="Copiar código"
                            >
                              {copiedId === negocio.id_negocio ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">Sin código</div>
                        )}
                      </div>
                      
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          {negocio.codigo_acceso_hash ? (
                            <>
                                <button
                                onClick={() => showEliminarConfirm(negocio)}
                                disabled={deleting === negocio.id_negocio}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Eliminar código"
                                >
                                {deleting === negocio.id_negocio ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                                </button>
                                <button
                                onClick={() => showRegenerarConfirm(negocio)}
                                disabled={generating === negocio.id_negocio}
                                className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Regenerar código"
                              >
                                {generating === negocio.id_negocio ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <KeyRound className="w-4 h-4" />
                                )}
                                </button>
                            </>
                            ) : (
                              <button
                                onClick={() => handleGenerarCodigo(negocio.id_negocio)}
                                disabled={generating === negocio.id_negocio}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Generar código de acceso"
                              >
                              {generating === negocio.id_negocio ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <KeyRound className="w-4 h-4" />
                              )}
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default NegociosPage;