export async function generateStatsChartCementos(
  estadisticas: any[],
  tipoNovedad: string,
  sede: string,
  zona: string
): Promise<string> {
  try {
    const response = await fetch(`${process.env.CANVAS_SERVICE_URL}/api/generate-stats-chart-cementos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        estadisticas,
        tipoNovedad,
        sede,
        zona
      })
    });

    if (!response.ok) {
      throw new Error('Error al generar el gráfico');
    }

    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error('Error llamando al servicio de Canvas para Cementos:', error);
    throw error;
  }
} 