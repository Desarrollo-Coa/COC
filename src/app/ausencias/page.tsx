// Página principal de ausencias
'use client';
import { useState } from 'react';
import AusenciaForm from '@/components/ausencias/AusenciaForm';
import AusenciaResumen from '@/components/ausencias/AusenciaResumen';
import SelectCascada from '@/components/ausencias/SelectCascada';
import { toast } from 'sonner';
import HistorialAusenciasPage from './historial/page';

export default function AusenciasPage() {
  const [tab, setTab] = useState<'registro' | 'historial'>('registro');
  const [seleccion, setSeleccion] = useState({
    colaborador: null,
    negocio: null,
    unidad: null,
    puesto: null,
  });
  const [formData, setFormData] = useState<any>(null);
  const [showResumen, setShowResumen] = useState(false);

  // Cuando se confirma el resumen, enviar al backend
  const handleConfirmar = async (data: any) => {
    try {
      // Obtener el id del usuario autenticado
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (!userRes.ok || !userData?.id) {
        throw new Error('No se pudo obtener el usuario autenticado');
      }
      const formData = new FormData();
      formData.append('id_colaborador', data.colaborador.id);
      formData.append('id_puesto', data.puesto.value);
      formData.append('id_tipo_ausencia', data.tipoAusencia);
      formData.append('fecha_inicio', data.fechaInicio);
      formData.append('fecha_fin', data.fechaFin);
      formData.append('descripcion', data.descripcion);
      formData.append('id_usuario_registro', userData.id);
      if (data.archivos && data.archivos.length > 0) {
        for (const archivo of data.archivos) {
          formData.append('archivos', archivo);
        }
      }
      const res = await fetch('/api/ausencias', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al registrar la ausencia');
      }
      toast.success('Ausencia registrada correctamente');
      setShowResumen(false);
      setFormData(null);
      setSeleccion({ colaborador: null, negocio: null, unidad: null, puesto: null });
    } catch (e: any) {
      toast.error(e.message || 'Error al registrar la ausencia');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Ausencias</h1>
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${tab === 'registro' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('registro')}
        >
          Registrar Ausencia
        </button>
        <button
          className={`px-4 py-2 rounded ${tab === 'historial' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('historial')}
        >
          Historial
        </button>
      </div>
      {tab === 'registro' ? (
        !showResumen ? (
          <>
            <SelectCascada value={seleccion} onChange={setSeleccion} />
            <AusenciaForm
              seleccion={seleccion}
              onResumen={(data) => {
                setFormData(data);
                setShowResumen(true);
              }}
              disabled={!(seleccion.colaborador && seleccion.negocio && seleccion.unidad && seleccion.puesto)}
            />
          </>
        ) : (
          <AusenciaResumen
            seleccion={seleccion}
            formData={formData}
            onEditar={() => setShowResumen(false)}
            onConfirmar={handleConfirmar}
          />
        )
      ) : (
        <HistorialAusenciasPage />
      )}
    </div>
  );
} 