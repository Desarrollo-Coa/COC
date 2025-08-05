import { NextRequest, NextResponse } from 'next/server';

// Configuración del watermark en el backend 
const WATERMARK_CONFIG = {
  DEFAULT_TEXT: 'FORTOX',
  DEFAULT_COLOR: 'white',
  DEFAULT_FONT_SIZE: '16',
  DEFAULT_POSITION: 'southwest',
  DEFAULT_SHADOW_COLOR: 'black',
  DEFAULT_SHADOW_OPACITY: '0.8'
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const text = formData.get('text') as string;
    const color = formData.get('color') as string;
    const fontSize = formData.get('fontSize') as string;
    const position = formData.get('position') as string;
    const shadowColor = formData.get('shadowColor') as string;
    const shadowOpacity = formData.get('shadowOpacity') as string;
    const timestamp = formData.get('timestamp') as string;
    const fecha = formData.get('fecha') as string;

    if (!image) {
      return NextResponse.json({ error: 'No se proporcionó imagen' }, { status: 400 });
    }

    // Usar valores por defecto si no se proporcionan (como canvas service)
    const finalText = text || WATERMARK_CONFIG.DEFAULT_TEXT;
    const finalColor = color || WATERMARK_CONFIG.DEFAULT_COLOR;
    const finalFontSize = fontSize || WATERMARK_CONFIG.DEFAULT_FONT_SIZE;
    const finalPosition = position || WATERMARK_CONFIG.DEFAULT_POSITION;
    const finalShadowColor = shadowColor || WATERMARK_CONFIG.DEFAULT_SHADOW_COLOR;
    const finalShadowOpacity = shadowOpacity || WATERMARK_CONFIG.DEFAULT_SHADOW_OPACITY;

    // Crear FormData para enviar al servidor watermark
    const watermarkFormData = new FormData();
    watermarkFormData.append('image', image);
    watermarkFormData.append('text', finalText);
    watermarkFormData.append('color', finalColor);
    watermarkFormData.append('fontSize', finalFontSize);
    watermarkFormData.append('position', finalPosition);
    watermarkFormData.append('shadowColor', finalShadowColor);
    watermarkFormData.append('shadowOpacity', finalShadowOpacity);
    watermarkFormData.append('timestamp', timestamp || '');
    watermarkFormData.append('fecha', fecha || '');

    // Llamar al servidor watermark desde el servidor (sin problemas de Mixed Content)
    const watermarkUrl = process.env.WATERMARK_API_URL;
    const apiKey = process.env.WATERMARK_API_KEY;

    if (!watermarkUrl) {
      return NextResponse.json({ error: 'URL del servidor watermark no configurada' }, { status: 500 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 });
    }

    const response = await fetch(`${watermarkUrl}/watermark`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey
      },
      body: watermarkFormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error del servidor watermark:', response.status, errorText);
      return NextResponse.json({ 
        error: `Error del servidor watermark: ${response.status}` 
      }, { status: response.status });
    }

    // Obtener la imagen con marca de agua
    const watermarkedImageBuffer = await response.arrayBuffer();
    
    // Devolver la imagen con marca de agua
    return new NextResponse(watermarkedImageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="watermarked-image.jpg"'
      }
    });

  } catch (error) {
    console.error('Error procesando watermark:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
} 