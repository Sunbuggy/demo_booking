import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export async function uploadObjects(
  s3Client: S3Client,
  file: File,
  bucket: string,
  mainDir: string,
  subDir: string,
  contentType: string,
  pic_key: string,
  mode: string
) {
  try {
    if (!file || !mainDir || !bucket || !contentType) {
      throw new Error('Missing required fields');
    }

    if (mode === 'single') {
      let key;
      if (subDir) {
        key = `${mainDir}/${subDir}/${pic_key}`;
      } else {
        key = `${mainDir}/${pic_key}`;
      }

      const buffer = await file.arrayBuffer();
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(buffer),
        ContentType: contentType,
        ACL: 'public-read'
      });

      await s3Client.send(command);
      const endpoint = process.env.STORAGE_ENDPOINT!;
      return {
        success: true,
        message: 'File uploaded successfully',
        key,
        endpoint,
        url: `${endpoint}/${bucket}/${key}`
      };
    }
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    return {
      success: false,
      message: 'Error uploading file to S3'
    };
  }
}
