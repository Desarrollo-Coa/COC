import { useEffect, useState, useRef } from 'react';

interface AusenciaFormProps {
  seleccion: any;
  onResumen: (data: any) => void;
  disabled?: boolean;
}

export default function AusenciaForm({ seleccion, onResumen, disabled }: AusenciaFormProps) {
  const [tiposAusencia, setTiposAusencia] = useState<any[]>([]);
  const [tipoAusencia, setTipoAusencia] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [dias, setDias] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/tipos-ausencia')
      .then(res => res.json())
      .then(data => setTiposAusencia(data));
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      if (fin >= inicio) {
        const diffTime = Math.abs(fin.getTime() - inicio.getTime());
        setDias(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      } else {
        setDias(0);
      }
    } else {
      setDias(0);
    }
  }, [fechaInicio, fechaFin]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    // Validar tipo y tamaño
    for (const file of files) {
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        setError('Solo se permiten archivos PDF, JPG o PNG');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('El tamaño máximo por archivo es 10 MB');
        return;
      }
    }
    setError(null);
    setArchivos(prev => [...prev, ...files]);
    // Limpiar el input para permitir volver a subir el mismo archivo si se elimina
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoAusencia || !fechaInicio || !fechaFin || dias <= 0) {
      setError('Completa todos los campos y verifica las fechas');
      return;
    }
    if (new Date(fechaInicio) > new Date(fechaFin)) {
      setError('La fecha de inicio debe ser menor o igual a la fecha final');
      return;
    }
    setError(null);
    onResumen({
      ...seleccion,
      tipoAusencia,
      fechaInicio,
      fechaFin,
      dias,
      descripcion,
      archivos,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium mb-1">Tipo de ausencia</label>
        <select
          className="w-full border rounded p-2"
          value={tipoAusencia}
          onChange={e => setTipoAusencia(e.target.value)}
          disabled={disabled}
        >
          <option value="">Seleccione un tipo</option>
          {tiposAusencia.map((t: any) => (
            <option key={t.id_tipo_ausencia} value={t.id_tipo_ausencia}>{t.nombre_tipo_ausencia}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Fecha inicial</label>
          <input type="date" className="w-full border rounded p-2" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} disabled={disabled} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha final</label>
          <input type="date" className="w-full border rounded p-2" value={fechaFin} onChange={e => setFechaFin(e.target.value)} disabled={disabled} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Días ausente</label>
        <input type="text" className="w-full border rounded p-2 bg-gray-100" value={dias} readOnly />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <textarea className="w-full border rounded p-2" value={descripcion} onChange={e => setDescripcion(e.target.value)} disabled={disabled} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Soporte (PDF, JPG, PNG, máx 10MB)</label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          disabled={disabled}
        />
        {archivos.length > 0 && (
          <ul className="mt-2 text-xs text-gray-600">
            {archivos.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                {f.name} ({(f.size/1024/1024).toFixed(2)} MB)
                <button
                  type="button"
                  className="ml-2 text-red-500 hover:text-red-700 text-xs font-bold"
                  onClick={() => handleRemoveFile(i)}
                  aria-label={`Quitar archivo ${f.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={disabled}>Previsualizar resumen</button>
    </form>
  );
} 