"use client"
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Copy, CheckCircle, Link as LinkIcon, Building2, RefreshCw, Share2 } from 'lucide-react';

interface LinkNegocio {
  id_negocio: number;
  nombre_negocio: string;
  link: string;
}

export default function LinksPage() {
  const [links, setLinks] = useState<LinkNegocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = () => {
    setLoading(true);
    fetch('/api/accesos/links')
      .then(res => res.json())
      .then(data => {
        setLinks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleCopy = (link: string, id_negocio: number) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id_negocio);
    toast.success('Link copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (link: string, nombre_negocio: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Link de acceso - ${nombre_negocio}`,
          text: `Link de acceso para el negocio: ${nombre_negocio}`,
          url: link,
        });
        toast.success('Link compartido exitosamente');
      } catch (error) {
        console.log('Error al compartir:', error);
      }
    } else {
      // Fallback para navegadores que no soportan Web Share API
      handleCopy(link, 0);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
            <LinkIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Links de Acceso</h1>
            <p className="text-gray-600">Comparte los links de acceso con los vigilantes</p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Links</p>
                <p className="text-2xl font-bold text-gray-900">{links.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Negocios Activos</p>
                <p className="text-2xl font-bold text-gray-900">{links.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accesos Seguros</p>
                <p className="text-2xl font-bold text-gray-900">{links.length}</p>
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
              <span className="text-lg font-medium text-gray-600">Cargando links...</span>
            </div>
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <LinkIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay links disponibles</h3>
            <p className="text-gray-600 text-center">No se encontraron links de acceso para mostrar</p>
          </div>
        ) : (
          <div className="h-[600px] flex flex-col">
            {/* Table Header - Fixed */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 px-6 py-4">
              <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <div className="col-span-1">ID</div>
                <div className="col-span-3">Negocio</div>
                <div className="col-span-6">Link de Acceso</div>
                <div className="col-span-2">Acciones</div>
              </div>
            </div>
            
            {/* Table Body - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-100">
                {links.map((item) => (
                  <div key={item.id_negocio} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          #{item.id_negocio}
                        </span>
                      </div>
                      
                      <div className="col-span-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <Building2 className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="font-medium text-gray-900 break-words min-w-0">{item.nombre_negocio}</span>
                        </div>
                      </div>
                      
                      <div className="col-span-6">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 min-w-0">
                            <span className="font-mono text-sm text-gray-700 select-all break-all">
                              {item.link}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(item.link, item.id_negocio)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                            title="Copiar link"
                          >
                            {copiedId === item.id_negocio ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleShare(item.link, item.nombre_negocio)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
                            title="Compartir link"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0"
                            title="Abrir link"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </a>
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

      {/* Instructions */}
      <div className="mt-8 max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Instrucciones de Uso</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Copy className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Copiar Link</h4>
              <p className="text-sm text-gray-600">Haz clic en el ícono de copiar para copiar el link al portapapeles</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Compartir</h4>
              <p className="text-sm text-gray-600">Usa el botón de compartir para enviar el link por cualquier medio</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <LinkIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Abrir Link</h4>
              <p className="text-sm text-gray-600">Abre el link en una nueva pestaña para verificar que funciona</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 