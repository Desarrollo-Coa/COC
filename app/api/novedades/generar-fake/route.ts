import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const { cantidad } = await req.json();
  const hoy = new Date();
  const año = hoy.getFullYear();

  // Fechas desde 1 enero hasta 11 julio
  const fechas: string[] = [];
  for (let mes = 1; mes <= 7; mes++) {
    const diasEnMes = mes === 7 ? 11 : new Date(año, mes, 0).getDate();
    for (let dia = 1; dia <= diasEnMes; dia++) {
      fechas.push(`${año}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`);
    }
  }

  // Obtener datos reales
  const [puestosRows] = await pool.query("SELECT id_puesto FROM puestos");
  const [tiposRows] = await pool.query("SELECT id_tipo_evento FROM tipos_evento");
  const [usuariosRows] = await pool.query("SELECT id FROM users");

  const puestos = puestosRows as any[];
  const tipos = tiposRows as any[];
  const usuarios = usuariosRows as any[];

  let consecutivo = 100000 + Math.floor(Math.random() * 10000);
  let total = 0;

  for (const fecha of fechas) {
    for (let i = 0; i < cantidad; i++) {
      const id_puesto = puestos[Math.floor(Math.random() * puestos.length)].id_puesto;
      const id_tipo_evento = tipos[Math.floor(Math.random() * tipos.length)].id_tipo_evento;
      const id_usuario = usuarios[Math.floor(Math.random() * usuarios.length)].id;
      const hora = `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:00`;
      const descripcion = `Novedad generada aleatoriamente (${fecha})`;
      const gestion = "Gestión automática de prueba";
      const evento_critico = Math.random() < 0.2 ? 1 : 0;

      await pool.query(
        `INSERT INTO novedades (id_usuario, id_puesto, consecutivo, fecha_hora_novedad, id_tipo_evento, descripcion, gestion, evento_critico)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_usuario, id_puesto, consecutivo++, `${fecha} ${hora}`, id_tipo_evento, descripcion, gestion, evento_critico]
      );
      total++;
    }
  }

  return NextResponse.json({ message: `¡Se generaron ${total} novedades!` });
} 