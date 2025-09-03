/**
 * Utilidad para agregar marca de agua usando Canvas API del navegador
 * Elimina la dependencia de APIs externas
 */

export interface WatermarkOptions {
  text?: string;
  color?: string;
  fontSize?: number;
  position?: 'southwest' | 'southeast' | 'northwest' | 'northeast' | 'center';
  shadowColor?: string;
  shadowOpacity?: number;
  timestamp?: string;
  fecha?: string;
}

export const DEFAULT_WATERMARK_OPTIONS: WatermarkOptions = {
  text: 'FORTOX',
  color: 'white',
  fontSize: 16,
  position: 'southwest',
  shadowColor: 'black',
  shadowOpacity: 0.8
};

/**
 * Agrega marca de agua a una imagen usando Canvas API
 */
export async function addWatermarkToImage(
  imageFile: File,
  options: WatermarkOptions = {}
): Promise<{ dataUrl: string; file: File }> {
  const config = { ...DEFAULT_WATERMARK_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('No se pudo obtener contexto del canvas'));
      return;
    }

    img.onload = () => {
      // Configurar canvas con las dimensiones de la imagen
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Dibujar la imagen original
      ctx.drawImage(img, 0, 0);
      
      // Configurar estilo del texto
      ctx.font = `bold ${config.fontSize}px Arial, sans-serif`;
      ctx.fillStyle = config.color!;
      ctx.strokeStyle = config.shadowColor!;
      ctx.lineWidth = 2;
      
      // Configurar sombra
      ctx.shadowColor = config.shadowColor!;
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      // Preparar texto de marca de agua
      const watermarkText = config.text!;
      const timestampText = config.timestamp || '';
      const fechaText = config.fecha || '';
      
      // Medir texto para posicionamiento
      const textMetrics = ctx.measureText(watermarkText);
      const timestampMetrics = ctx.measureText(timestampText);
      const fechaMetrics = ctx.measureText(fechaText);
      
      // Calcular posición
      const padding = 20;
      const bottomPadding = 40; // Margen inferior adicional
      let x: number, y: number;
      
      // Detectar orientación para ajustar posición automáticamente
      const isLandscape = canvas.width > canvas.height;
      const finalPosition = isLandscape ? 'southwest' : 'northwest' as WatermarkOptions['position'];
      
      switch (finalPosition) {
        case 'southwest':
          x = padding;
          y = canvas.height - bottomPadding;
          break;
        case 'southeast':
          x = canvas.width - Math.max(textMetrics.width, timestampMetrics.width, fechaMetrics.width) - padding;
          y = canvas.height - bottomPadding;
          break;
        case 'northwest':
          x = padding;
          y = canvas.height / 2; // Centro vertical
          break;
        case 'northeast':
          x = canvas.width - Math.max(textMetrics.width, timestampMetrics.width, fechaMetrics.width) - padding;
          y = canvas.height / 2; // Centro vertical
          break;
        case 'center':
          x = (canvas.width - textMetrics.width) / 2;
          y = canvas.height / 2;
          break;
        default:
          x = padding;
          y = canvas.height - bottomPadding;
      }
      
      // Dibujar texto principal
      ctx.fillText(watermarkText, x, y);
      
      // Dibujar timestamp y fecha en la misma línea si existen
      if (timestampText || fechaText) {
        ctx.font = `${config.fontSize! - 2}px Arial, sans-serif`;
        const combinedText = [timestampText, fechaText].filter(Boolean).join(' - ');
        ctx.fillText(combinedText, x, y + config.fontSize! + 5);
      }
      
      // Convertir canvas a blob
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Error al generar imagen con marca de agua'));
          return;
        }
        
        const watermarkedFile = new File([blob], 'watermarked-image.jpg', { 
          type: 'image/jpeg' 
        });
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        resolve({ dataUrl, file: watermarkedFile });
      }, 'image/jpeg', 0.9);
    };
    
    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };
    
    // Cargar la imagen
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Función simplificada para usar con la configuración actual
 */
export async function addWatermarkWithCurrentConfig(
  imageFile: File,
  timestamp: string,
  fecha: string
): Promise<{ dataUrl: string; file: File }> {
  return addWatermarkToImage(imageFile, {
    text: 'FORTOX',
    color: 'white',
    fontSize: 16,
    position: 'southwest',
    shadowColor: 'black',
    shadowOpacity: 0.8,
    timestamp,
    fecha
  });
}
