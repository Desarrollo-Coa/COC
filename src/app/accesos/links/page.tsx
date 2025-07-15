"use client"
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

interface LinkNegocio {
  id_negocio: number;
  nombre_negocio: string;
  link: string;
}

export default function LinksPage() {
  const [links, setLinks] = useState<LinkNegocio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/accesos/links')
      .then(res => res.json())
      .then(data => {
        setLinks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copiado al portapapeles');
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-blue-900">Links de Acceso</h1>
        <div className="bg-white rounded-2xl shadow-lg p-0 md:p-6 overflow-x-auto">
          {loading ? (
            <div className="text-center text-gray-400 py-16 text-lg">Cargando links...</div>
          ) : links.length === 0 ? (
            <div className="text-center text-gray-400 py-16 text-lg">No hay links disponibles</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider rounded-tl-2xl">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Negocio</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider rounded-tr-2xl">Link de Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {links.map((item) => (
                  <tr key={item.id_negocio} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-blue-900 whitespace-nowrap">{item.id_negocio}</td>
                    <td className="px-4 py-3 text-blue-900 whitespace-normal break-words max-w-[200px]">{item.nombre_negocio}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[260px] md:max-w-[400px] select-all text-xs bg-gray-100 px-2 py-1 rounded-lg">
                          {item.link}
                        </span>
                        <button
                          className="text-blue-700 hover:text-blue-900 p-1 rounded"
                          onClick={() => handleCopy(item.link)}
                          title="Copiar link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
} 