import { useEffect, useState } from 'react';

interface Colaborador {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  placa: string;
  activo: boolean;
  foto_url?: string;
}

interface ColaboradorAutocompleteProps {
  value: Colaborador | null;
  onChange: (colaborador: Colaborador | null) => void;
  placeholder?: string;
}

export default function ColaboradorAutocomplete({ value, onChange, placeholder }: ColaboradorAutocompleteProps) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [input, setInput] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [filtered, setFiltered] = useState<Colaborador[]>([]);

  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        const res = await fetch('/api/colaboradores');
        const data = await res.json();
        setColaboradores(data);
      } catch (error) {
        console.error('Error cargando colaboradores:', error);
      }
    };
    
    fetchColaboradores();
  }, []);

  useEffect(() => {
    if (input.length === 0) {
      setFiltered([]);
      return;
    }
    const lower = input.toLowerCase();
    setFiltered(
      colaboradores.filter(c =>
        c.nombre.toLowerCase().includes(lower) ||
        c.apellido.toLowerCase().includes(lower) ||
        c.cedula.toLowerCase().includes(lower) ||
        (c.placa || '').toLowerCase().includes(lower)
      )
    );
  }, [input, colaboradores]);

  useEffect(() => {
    if (value) {
      setInput(`${value.nombre} ${value.apellido} (${value.placa || value.cedula})`);
    } else {
      setInput('');
    }
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        className="w-full border rounded p-2"
        placeholder={placeholder || 'Buscar colaborador'}
        value={input}
        onChange={e => {
          setInput(e.target.value);
          setShowOptions(true);
          onChange(null);
        }}
        onFocus={() => setShowOptions(true)}
        autoComplete="off"
      />
      {showOptions && filtered.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full mt-1 max-h-48 overflow-auto rounded shadow">
          {filtered.map(c => (
            <li
              key={c.id}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm"
              onClick={() => {
                onChange(c);
                setShowOptions(false);
              }}
            >
              {c.nombre} {c.apellido} — Placa: {c.placa || '-'} — Cédula: {c.cedula}
            </li>
          ))}
        </ul>
      )}
      {showOptions && input && filtered.length === 0 && (
        <div className="absolute z-10 bg-white border w-full mt-1 rounded shadow px-3 py-2 text-gray-500 text-sm">No se encontraron resultados</div>
      )}
    </div>
  );
} 