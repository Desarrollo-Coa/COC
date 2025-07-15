import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const spacesEndpoint = process.env.DO_SPACES_ENDPOINT!;
const s3 = new S3Client({
  region: "us-east-1", // DigitalOcean Spaces usa us-east-1, pero puedes poner cualquier región
  endpoint: spacesEndpoint,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
});

export async function uploadToSpaces(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  const bucket = process.env.DO_SPACES_BUCKET!;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: fileBuffer,
      ACL: "public-read", // o private si quieres control de acceso
      ContentType: mimeType,
    })
  );
  return `${spacesEndpoint.replace(/^https?:\/\//, 'https://')}/${bucket}/${fileName}`;
} 