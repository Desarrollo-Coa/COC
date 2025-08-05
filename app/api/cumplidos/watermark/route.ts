import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    // Verificar token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener la imagen del form data
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const timestamp = formData.get('timestamp') as string

    if (!imageFile) {
      return NextResponse.json({ error: 'No se proporcionó imagen' }, { status: 400 })
    }

    // Validar tipo de archivo
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 })
    }

    // Convertir File a Buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

    // Obtener la hora actual si no se proporciona
    const currentTime = timestamp || new Date().toLocaleTimeString()

    try {
      // Obtener dimensiones de la imagen
      const imageInfo = await sharp(imageBuffer).metadata();
      const imageWidth = imageInfo.width || 800;
      const imageHeight = imageInfo.height || 600;

      // Calcular tamaño del texto basado en las dimensiones de la imagen
      const fontSize = Math.max(Math.min(imageWidth * 0.04, 32), 16);
      const textWidth = `FORTOX - ${currentTime}`.length * fontSize * 0.6;
      const textHeight = fontSize * 1.2;

      // Crear marca de agua con Sharp usando SVG dinámico
      const svgText = `
        <svg width="${textWidth + 20}" height="${textHeight + 10}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="black" flood-opacity="0.8"/>
            </filter>
          </defs>
          <text x="10" y="${fontSize + 5}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" 
                 fill="white" filter="url(#shadow)">
            FORTOX - ${currentTime}
          </text>
        </svg>
      `;

      const watermarkedImage = await sharp(imageBuffer)
        .resize(800, 600, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .composite([{
          input: Buffer.from(svgText),
          gravity: 'southwest',
          top: 10,
          left: 10
        }])
        .jpeg({ quality: 80 })
        .toBuffer()

      // Devolver la imagen con marca de agua
      return new NextResponse(watermarkedImage, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': 'attachment; filename="watermarked-image.jpg"'
        }
      })

    } catch (sharpError) {
      console.error('Error procesando imagen con Sharp:', sharpError)
      
      // Fallback: devolver la imagen original sin marca de agua
      const originalImage = await sharp(imageBuffer)
        .resize(800, 600, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 80 })
        .toBuffer()

      return new NextResponse(originalImage, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': 'attachment; filename="original-image.jpg"'
        }
      })
    }

  } catch (error) {
    console.error('Error procesando marca de agua:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 