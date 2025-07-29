import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: 'nyc3',
  endpoint: 'https://nyc3.digitaloceanspaces.com',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY || '',
    secretAccessKey: process.env.DO_SPACES_SECRET || '',
  },
});

async function deleteOldPhoto(placa: string): Promise<boolean> {
  try {
    // Obtener la URL de la foto actual
    const [currentPhoto] = await pool.query<RowDataPacket[]>(
      "SELECT foto_url FROM colaboradores WHERE placa = ?",
      [placa]
    );

    const currentPhotoUrl = (currentPhoto as any)[0]?.foto_url;
    console.log('🔍 Verificando foto actual:', currentPhotoUrl);

    if (currentPhotoUrl) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: 'archivos-grupo-argos',
            Key: `colaboradores/${placa}.webp`,
          })
        );
        console.log('✅ Foto eliminada exitosamente');
        return true;
      } catch (deleteError) {
        console.error('❌ Error al eliminar foto:', deleteError);
        return false;
      }
    } else {
      console.log('ℹ️ No hay foto anterior para eliminar');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al obtener/eliminar foto anterior:', error);
    return false;
  }
}

// GET - Obtener todos los colaboradores o buscar por texto (paginado)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = "SELECT id, nombre, apellido, cedula, placa, activo, foto_url, fecha_creacion, fecha_actualizacion FROM colaboradores";
    let countQuery = "SELECT COUNT(*) as total FROM colaboradores";
    let params: any[] = [];
    let countParams: any[] = [];
    if (search) {
      query += ` WHERE nombre LIKE ? OR apellido LIKE ? OR placa LIKE ? OR cedula LIKE ? OR CONCAT(nombre, ' ', apellido) LIKE ? OR CONCAT(apellido, ' ', nombre) LIKE ?`;
      countQuery += ` WHERE nombre LIKE ? OR apellido LIKE ? OR placa LIKE ? OR cedula LIKE ? OR CONCAT(nombre, ' ', apellido) LIKE ? OR CONCAT(apellido, ' ', nombre) LIKE ?`;
      params = [
        `%${search}%`, // nombre
        `%${search}%`, // apellido
        `%${search}%`, // placa
        `%${search}%`, // cedula
        `%${search}%`, // nombre + apellido
        `%${search}%`  // apellido + nombre
      ];
      countParams = [...params];
    }
    query += " ORDER BY nombre, apellido LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [colaboradores] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    let total = 0;
    if (Array.isArray(countResult) && (countResult as any[]).length > 0) {
      total = (countResult as any[])[0].total || 0;
    }
    return NextResponse.json({ data: colaboradores, total });
  } catch (error) {
    console.error("Error al obtener colaboradores:", error);
    return NextResponse.json(
      { error: "Error al obtener colaboradores" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo colaborador
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cedula, placa, nombre, apellido, foto_url } = body;

    // Validar campos requeridos
    if (!cedula || !nombre || !apellido) {
      return NextResponse.json(
        { error: "Faltan campos requeridos. Por favor complete: cédula, nombre y apellido." },
        { status: 400 }
      );
    }

    // Validar que la cédula sea solo numérica
    if (!/^\d+$/.test(cedula)) {
      return NextResponse.json(
        { error: "La cédula debe contener solo números" },
        { status: 400 }
      );
    }

    // Si hay placa, validar que sea solo numérica
    if (placa && !/^\d+$/.test(placa)) {
      return NextResponse.json(
        { error: "La placa debe contener solo números" },
        { status: 400 }
      );
    }

    // Convertir nombre y apellido a mayúsculas
    const nombreMayus = nombre.toUpperCase();
    const apellidoMayus = apellido.toUpperCase();

    // Validar unicidad de cédula
    const [existingCedula] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM colaboradores WHERE cedula = ?",
      [cedula]
    );
    if ((existingCedula as any)[0]) {
      return NextResponse.json(
        { error: `La cédula ${cedula} ya está registrada en el sistema.` },
        { status: 400 }
      );
    }

    // Validar unicidad de placa si se envía
    if (placa) {
      const [existingPlaca] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM colaboradores WHERE placa = ?",
        [placa]
      );
      if ((existingPlaca as any)[0]) {
        return NextResponse.json(
          { error: `La placa ${placa} ya está registrada en el sistema.` },
          { status: 400 }
        );
      }
    }

    // Insertar el nuevo colaborador
    const [result] = await pool.query(
      "INSERT INTO colaboradores (nombre, apellido, cedula, placa, activo) VALUES (?, ?, ?, ?, ?)",
      [nombreMayus, apellidoMayus, cedula, placa || null, true]
    );

    return NextResponse.json({ 
      message: "Colaborador creado exitosamente",
      colaborador: { nombre: nombreMayus, apellido: apellidoMayus, cedula, placa, activo: true }
    });
  } catch (error: any) {
    console.error("Error al crear colaborador:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear colaborador" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar colaborador
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, cedula, placa, nombre, apellido, activo, foto_url } = body;

    if (!id || !cedula || !nombre || !apellido) {
      return NextResponse.json(
        { error: "Faltan campos requeridos. Por favor complete: id, cédula, nombre y apellido." },
        { status: 400 }
      );
    }

    if (!/^\d+$/.test(cedula)) {
      return NextResponse.json(
        { error: "La cédula debe contener solo números" },
        { status: 400 }
      );
    }
    if (placa && !/^\d+$/.test(placa)) {
      return NextResponse.json(
        { error: "La placa debe contener solo números" },
        { status: 400 }
      );
    }

    const nombreMayus = nombre.toUpperCase();
    const apellidoMayus = apellido.toUpperCase();

    // Validar unicidad de cédula (excepto el propio)
    const [existingCedula] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM colaboradores WHERE cedula = ? AND id != ?",
      [cedula, id]
    );
    if ((existingCedula as any)[0]) {
      return NextResponse.json(
        { error: `La cédula ${cedula} ya está registrada en el sistema.` },
        { status: 400 }
      );
    }
    // Validar unicidad de placa (excepto el propio)
    if (placa) {
      const [existingPlaca] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM colaboradores WHERE placa = ? AND id != ?",
        [placa, id]
      );
      if ((existingPlaca as any)[0]) {
        return NextResponse.json(
          { error: `La placa ${placa} ya está registrada en el sistema.` },
          { status: 400 }
        );
      }
    }

    // Actualizar colaborador
    const [updateResult] = await pool.query(
      "UPDATE colaboradores SET nombre = ?, apellido = ?, cedula = ?, placa = ?, activo = ? WHERE id = ?",
      [nombreMayus, apellidoMayus, cedula, placa || null, activo, id]
    );

    return NextResponse.json({ 
      message: "Colaborador actualizado exitosamente"
    });
  } catch (error) {
    console.error("❌ Error al actualizar colaborador:", error);
    return NextResponse.json(
      { error: "Error al actualizar colaborador" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar colaborador
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placa = searchParams.get("placa");

    if (!placa) {
      return NextResponse.json(
        { error: "Se requiere la placa del colaborador" },
        { status: 400 }
      );
    }

    // Buscar el id del colaborador por placa
    const [colRows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM colaboradores WHERE placa = ?",
      [placa]
    );
    const colaborador = (colRows as any)[0];
    if (!colaborador) {
      return NextResponse.json(
        { error: "Colaborador no encontrado. No se realizó ninguna eliminación." },
        { status: 404 }
      );
    }
    const colaboradorId = colaborador.id;

    // Verificar registros en cumplidos
    const [registrosCumplidos] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM cumplidos WHERE id_colaborador = ?",
      [colaboradorId]
    );
    if ((registrosCumplidos[0] as any).count > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar el colaborador porque tiene registros en cumplidos" },
        { status: 400 }
      );
    }

    // Eliminar foto si aplica
    await deleteOldPhoto(placa);

    // Eliminar colaborador
    await pool.query("DELETE FROM colaboradores WHERE placa = ?", [placa]);

    return NextResponse.json({ 
      message: `Colaborador con placa ${placa} eliminado exitosamente.`
    });
  } catch (error) {
    console.error("❌ Error al eliminar colaborador:", error);
    return NextResponse.json(
      { error: "Error al eliminar colaborador" },
      { status: 500 }
    );
  }
} 