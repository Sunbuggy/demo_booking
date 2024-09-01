import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export async function uploadToS3(
  file: File,
  bucket: string,
  mainDir: string,
  subDir: string
): Promise<string | undefined> {
  const client = new S3Client({
    region: 'us-central-1',
    forcePathStyle: true,
    endpoint: 'https://usc1.contabostorage.com',
    credentials: {
      accessKeyId: '0f9531a556c548b1be28e1c41e1e77eb',
      secretAccessKey: '77205948ff9d2b24d291af4b59cc5539'
    }
  });
  try {
    const key = `${mainDir}/${subDir}/${file.name}`;
    const params = {
      Bucket: bucket,
      Key: key,
      Body: file
    };
    await client.send(new PutObjectCommand(params));
    return `https://usc1.contabostorage.com/a3c408f31c3340aa81c2a89549cb4ebc:sb-fleet/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
  }
}
