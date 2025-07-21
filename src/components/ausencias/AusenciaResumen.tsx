interface AusenciaResumenProps {
  seleccion: any;
  formData: any;
  onEditar: () => void;
  onConfirmar: (data: any) => void;
}

export default function AusenciaResumen({ seleccion, formData, onEditar, onConfirmar }: AusenciaResumenProps) {
  if (!formData) return null;
  return (
    <div className="bg-white rounded shadow p-6">
      <h2 className="text-xl font-bold mb-4">Resumen de Ausencia</h2>
      <div className="mb-4">
        <strong>Colaborador:</strong> {seleccion.colaborador?.label}<br />
        <strong>Negocio:</strong> {seleccion.negocio?.label}<br />
        <strong>Unidad de Negocio:</strong> {seleccion.unidad?.label}<br />
        <strong>Puesto:</strong> {seleccion.puesto?.label}<br />
        <strong>Tipo de ausencia:</strong> {formData.tipoAusencia}<br />
        <strong>Fecha inicial:</strong> {formData.fechaInicio}<br />
        <strong>Fecha final:</strong> {formData.fechaFin}<br />
        <strong>Días ausente:</strong> {formData.dias}<br />
        <strong>Descripción:</strong> <span className="whitespace-pre-line">{formData.descripcion}</span><br />
        <strong>Archivos:</strong>
        <ul className="list-disc ml-6">
          {formData.archivos && formData.archivos.length > 0 ? (
            formData.archivos.map((f: File, i: number) => (
              <li key={i}>{f.name} ({(f.size/1024/1024).toFixed(2)} MB)</li>
            ))
          ) : (
            <li>No se adjuntaron archivos</li>
          )}
        </ul>
      </div>
      <div className="flex gap-4">
        <button className="bg-gray-300 px-4 py-2 rounded" onClick={onEditar}>Editar</button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => onConfirmar(formData)}>Confirmar y guardar</button>
      </div>
    </div>
  );
} 