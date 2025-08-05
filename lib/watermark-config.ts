// Configuración de la API de Watermark
export const WATERMARK_CONFIG = {
  // URL de la API independiente
  API_URL: process.env.NEXT_PUBLIC_WATERMARK_API_URL,
  
  // API Key para autenticación
  API_KEY: process.env.NEXT_PUBLIC_WATERMARK_API_KEY,
  
  // Configuración por defecto de la marca de agua
  DEFAULT_TEXT: 'FORTOX',
  DEFAULT_COLOR: 'white',
  DEFAULT_FONT_SIZE: '16',
  DEFAULT_POSITION: 'southwest',
  DEFAULT_SHADOW_COLOR: 'black',
  DEFAULT_SHADOW_OPACITY: '0.8'
}

// Función para obtener la URL completa del endpoint
export const getWatermarkApiUrl = () => {
  return `${WATERMARK_CONFIG.API_URL}/watermark`
}

// Función para obtener los headers de autenticación
export const getWatermarkHeaders = () => {
  if (!WATERMARK_CONFIG.API_KEY) {
    throw new Error('API key no configurada. Configura NEXT_PUBLIC_WATERMARK_API_KEY en .env');
  }
  return {
    'x-api-key': WATERMARK_CONFIG.API_KEY
  }
} 