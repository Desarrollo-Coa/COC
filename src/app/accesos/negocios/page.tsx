"use client";

import React, { useEffect, useState } from 'react';
import { KeyRound, Eye, EyeOff, Ban, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const [codigoPlano, setCodigoPlano] = useState<{ [id: number]: string }>({});
  const [showCodigo, setShowCodigo] = useState<{ [id: number]: boolean }>({});
  const [showHash, setShowHash] = useState<{ [id: number]: boolean }>({});

  const fetchNegocios = () => {
    setLoading(true);
    fetch('/api/accesos/negocios')
      .then(res => res.json())
      .then(data => {
        setNegocios(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchNegocios();
  }, []);

  const handleGenerarCodigo = async (id_negocio: number) => {
    setGenerating(id_negocio);
    try {
      const res = await fetch(`/api/accesos/negocios/${id_negocio}/generar-codigo`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.codigo) {
        toast.success(`Código generado: ${data.codigo}`);
        setCodigoPlano((prev) => ({ ...prev, [id_negocio]: data.codigo }));
        setShowCodigo((prev) => ({ ...prev, [id_negocio]: false }));
        setTimeout(() => {
          setCodigoPlano((prev) => {
            const nuevo = { ...prev };
            delete nuevo[id_negocio];
            return nuevo;
          });
          setShowCodigo((prev) => {
            const nuevo = { ...prev };
            delete nuevo[id_negocio];
            return nuevo;
          });
        }, 10000); // 10 segundos
        fetchNegocios();
      } else {
        toast.error('No se pudo generar el código');
      }
    } catch {
      toast.error('Error al generar el código');
    } finally {
      setGenerating(null);
    }
  };

  const handleDesactivarCodigo = async (id_negocio: number) => {
    try {
      await fetch(`/api/accesos/negocios/${id_negocio}/codigo`, { method: 'PUT' });
      toast.success('Código desactivado');
      fetchNegocios();
    } catch {
      toast.error('Error al desactivar el código');
    }
  };

  const handleEliminarCodigo = async (id_negocio: number) => {
    try {
      await fetch(`/api/accesos/negocios/${id_negocio}/codigo`, { method: 'DELETE' });
      toast.success('Código eliminado');
      fetchNegocios();
    } catch {
      toast.error('Error al eliminar el código');
    }
  };

  const handleToggleShow = (id_negocio: number) => {
    setShowCodigo((prev) => ({ ...prev, [id_negocio]: !prev[id_negocio] }));
  };

  const handleToggleShowHash = (id_negocio: number) => {
    setShowHash((prev) => ({ ...prev, [id_negocio]: !prev[id_negocio] }));
  };

  return (
    <div className="min-h-0 max-h-[100dvh] h-[100dvh] flex flex-col bg-gradient-to-br from-gray-100 to-blue-100">
      <div className="flex-1 flex flex-col justify-start items-center w-full overflow-y-auto">
        <div className="w-full max-w-5xl px-2 sm:px-4 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-blue-900 tracking-tight">Administrar Negocios</h1>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12 sm:py-16">
                <div className="animate-pulse text-gray-500 text-lg font-medium">Cargando negocios...</div>
              </div>
            ) : negocios.length === 0 ? (
              <div className="flex items-center justify-center py-12 sm:py-16">
                <div className="text-gray-500 text-lg font-medium">No hay negocios disponibles</div>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <div className="max-h-[85vh] overflow-y-auto">
                  <table className="w-full min-w-[500px] table-auto">
                    <thead className="bg-blue-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider sm:rounded-tl-2xl">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider sm:rounded-tr-2xl">Código</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {negocios.map((negocio) => (
                        <tr key={negocio.id_negocio} className="hover:bg-blue-50 transition-colors duration-200">
                          <td className="px-4 py-3 text-sm font-semibold text-blue-900 whitespace-nowrap">{negocio.id_negocio}</td>
                          <td className="px-4 py-3 text-sm text-blue-900 break-words max-w-[200px] sm:max-w-none whitespace-normal">{negocio.nombre_negocio}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-3 py-1 text-xs font-bold rounded-full shadow-sm ${
                                negocio.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {negocio.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-700 max-w-[150px] sm:max-w-[200px] truncate">
                            {codigoPlano[negocio.id_negocio] ? (
                              <span className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-900 px-2 py-1 rounded-lg font-bold select-all">
                                  {showCodigo[negocio.id_negocio] ? codigoPlano[negocio.id_negocio] : '•••••'}
                                </span>
                                <button
                                  className="text-blue-700 hover:text-blue-900 p-1 rounded"
                                  onClick={() => handleToggleShow(negocio.id_negocio)}
                                  title={showCodigo[negocio.id_negocio] ? 'Ocultar código' : 'Mostrar código'}
                                >
                                  {showCodigo[negocio.id_negocio] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                  className="text-yellow-600 hover:text-yellow-800 p-1 rounded"
                                  onClick={() => handleDesactivarCodigo(negocio.id_negocio)}
                                  title="Desactivar código"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-800 p-1 rounded"
                                  onClick={() => handleEliminarCodigo(negocio.id_negocio)}
                                  title="Eliminar código"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  className="text-blue-700 hover:text-blue-900 p-1 rounded"
                                  onClick={() => handleGenerarCodigo(negocio.id_negocio)}
                                  title="Actualizar código"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>
                              </span>
                            ) : negocio.codigo_acceso_hash ? (
                              <span className="flex items-center gap-2">
                                <span className="bg-gray-100 px-2 py-1 rounded-lg select-all">
                                  {showHash[negocio.id_negocio] ? negocio.codigo_acceso_hash : '•••••'}
                                </span>
                                <button
                                  className="text-blue-700 hover:text-blue-900 p-1 rounded"
                                  onClick={() => handleToggleShowHash(negocio.id_negocio)}
                                  title={showHash[negocio.id_negocio] ? 'Ocultar código' : 'Mostrar código'}
                                >
                                  {showHash[negocio.id_negocio] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                  className="text-yellow-600 hover:text-yellow-800 p-1 rounded"
                                  onClick={() => handleDesactivarCodigo(negocio.id_negocio)}
                                  title="Desactivar código"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-800 p-1 rounded"
                                  onClick={() => handleEliminarCodigo(negocio.id_negocio)}
                                  title="Eliminar código"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  className="text-blue-700 hover:text-blue-900 p-1 rounded"
                                  onClick={() => handleGenerarCodigo(negocio.id_negocio)}
                                  title="Actualizar código"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>
                              </span>
                            ) : (
                              <button
                                className="flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold px-2 py-1 rounded transition disabled:opacity-60"
                                onClick={() => handleGenerarCodigo(negocio.id_negocio)}
                                disabled={generating === negocio.id_negocio}
                                title="Generar código de acceso"
                              >
                                <KeyRound className="w-4 h-4" />
                                {generating === negocio.id_negocio ? 'Generando...' : 'Generar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NegociosPage;