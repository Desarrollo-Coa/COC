import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const rawEndpoint = process.env.DO_SPACES_ENDPOINT!;
const spacesEndpoint = rawEndpoint.startsWith('http') ? rawEndpoint : `https://${rawEndpoint}`;
const s3 = new S3Client({
  region: "us-east-1",
  endpoint: spacesEndpoint,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
});

/**
 * Borra un archivo de DigitalOcean Spaces.
 * @param key Ruta completa del archivo dentro del bucket (ej: 'modulos/rutas/archivo.jpg')
 */
export async function deleteFromSpaces(key: string): Promise<void> {
  const bucket = process.env.DO_SPACES_BUCKET!;
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
} 