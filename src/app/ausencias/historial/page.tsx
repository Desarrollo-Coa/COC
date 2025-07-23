'use client';
import { useEffect, useState } from 'react';

function formatFecha(fecha: string) {
  if (!fecha) return '';
  if (fecha.includes('T')) return fecha.split('T')[0];
  return fecha;
}

export default function HistorialAusenciasPage() {
  const [ausencias, setAusencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ausencias')
      .then(res => res.json())
      .then(data => setAusencias(data))
      .catch(e => setError('Error al cargar ausencias'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Historial de Ausencias</h1>
      {loading ? (
        <div>Cargando ausencias...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : ausencias.length === 0 ? (
        <div>No hay ausencias registradas.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-2 border">Colaborador</th>
                <th className="px-2 py-2 border">Negocio</th>
                <th className="px-2 py-2 border">Unidad de Negocio</th>
                <th className="px-2 py-2 border">Puesto</th>
                <th className="px-2 py-2 border">Tipo</th>
                <th className="px-2 py-2 border">Fecha inicial</th>
                <th className="px-2 py-2 border">Fecha final</th>
                <th className="px-2 py-2 border">Días</th>
                <th className="px-2 py-2 border">Descripción</th>
                <th className="px-2 py-2 border">Archivos</th>
              </tr>
            </thead>
            <tbody>
              {ausencias.map((a) => (
                <tr key={a.id_ausencia} className="border-b">
                  <td className="px-2 py-2 border">{a.nombre_colaborador} {a.apellido_colaborador}</td>
                  <td className="px-2 py-2 border">{a.nombre_negocio}</td>
                  <td className="px-2 py-2 border">{a.nombre_unidad}</td>
                  <td className="px-2 py-2 border">{a.nombre_puesto}</td>
                  <td className="px-2 py-2 border">{a.nombre_tipo_ausencia}</td>
                  <td className="px-2 py-2 border">{formatFecha(a.fecha_inicio)}</td>
                  <td className="px-2 py-2 border">{formatFecha(a.fecha_fin)}</td>
                  <td className="px-2 py-2 border">
                    {a.fecha_inicio && a.fecha_fin
                      ? Math.ceil((new Date(a.fecha_fin).getTime() - new Date(a.fecha_inicio).getTime()) / (1000 * 60 * 60 * 24)) + 1
                      : '-'}
                  </td>
                  <td className="px-2 py-2 border max-w-xs whitespace-pre-line">{a.descripcion}</td>
                  <td className="px-2 py-2 border">
                    {a.archivos && a.archivos.length > 0 ? (
                      <ul className="list-disc ml-4">
                        {a.archivos.map((f: any) => (
                          <li key={f.id_archivo}>
                            <a href={f.url_archivo} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                              {f.nombre_archivo}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">Sin archivos</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}