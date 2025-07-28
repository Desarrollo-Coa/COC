import { useEffect, useState } from 'react';
import ColaboradorAutocomplete from './ColaboradorAutocomplete';

interface Option { value: string | number; label: string; }
interface SelectCascadaProps {
  value: {
    colaborador: any | null;
    negocio: Option | null;
    unidad: Option | null;
    puesto: Option | null;
  };
  onChange: (val: any) => void;
}

export default function SelectCascada({ value, onChange }: SelectCascadaProps) {
  const [negocios, setNegocios] = useState<Option[]>([]);
  const [unidades, setUnidades] = useState<Option[]>([]);
  const [puestos, setPuestos] = useState<Option[]>([]);

  useEffect(() => {
    const fetchNegocios = async () => {
      try {
        const res = await fetch('/api/negocios')
        const data = await res.json()
        setNegocios(data.map((n: any) => ({ value: n.id_negocio, label: n.nombre_negocio })))
      } catch (error) {
        console.error('Error al cargar negocios:', error)
      }
    }
    fetchNegocios()
  }, []);

  useEffect(() => {
    const fetchUnidades = async () => {
      if (value.negocio) {
        try {
          const res = await fetch(`/api/settings/unidades-negocio?id_negocio=${value.negocio.value}`)
          const data = await res.json()
          setUnidades(data.map((u: any) => ({ value: u.id_unidad, label: u.nombre_unidad })))
        } catch (error) {
          console.error('Error al cargar unidades:', error)
          setUnidades([])
        }
      } else {
        setUnidades([]);
        onChange({ ...value, unidad: null, puesto: null });
      }
    }
    fetchUnidades()
  }, [value.negocio]);

  useEffect(() => {
    const fetchPuestos = async () => {
      if (value.unidad) {
        try {
          const res = await fetch(`/api/puestos?id_unidad=${value.unidad.value}`)
          const data = await res.json()
          setPuestos(data.map((p: any) => ({ value: p.id_puesto, label: p.nombre_puesto })))
        } catch (error) {
          console.error('Error al cargar puestos:', error)
          setPuestos([])
        }
      } else {
        setPuestos([]);
        onChange({ ...value, puesto: null });
      }
    }
    fetchPuestos()
  }, [value.unidad]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium mb-1">Colaborador</label>
        <ColaboradorAutocomplete
          value={value.colaborador}
          onChange={colab => onChange({ ...value, colaborador: colab })}
          placeholder="Buscar colaborador"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Negocio</label>
        <select
          className="w-full border rounded p-2"
          value={value.negocio?.value || ''}
          onChange={e => onChange({ ...value, negocio: negocios.find(n => n.value == e.target.value), unidad: null, puesto: null })}
        >
          <option value="">Seleccione un negocio</option>
          {negocios.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Unidad de Negocio</label>
        <select
          className="w-full border rounded p-2"
          value={value.unidad?.value || ''}
          onChange={e => onChange({ ...value, unidad: unidades.find(u => u.value == e.target.value), puesto: null })}
          disabled={!value.negocio}
        >
          <option value="">Seleccione una unidad</option>
          {unidades.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Puesto</label>
        <select
          className="w-full border rounded p-2"
          value={value.puesto?.value || ''}
          onChange={e => onChange({ ...value, puesto: puestos.find(p => p.value == e.target.value) })}
          disabled={!value.unidad}
        >
          <option value="">Seleccione un puesto</option>
          {puestos.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
    </div>
  );
} 