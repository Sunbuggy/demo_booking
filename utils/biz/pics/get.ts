import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.STORAGE_REGION!,
  forcePathStyle: true,
  endpoint: process.env.STORAGE_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESSKEY!,
    secretAccessKey: process.env.STORAGE_SECRETKEY!
  }
});

export async function fetchObjects(
  bucket: string,
  mainDir: string,
  subDir: string
) {
  const prefix = `${mainDir}/${subDir}/`;

  try {
    const listObjects = await s3Client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix })
    );
    if (!listObjects.Contents) return { objects: [] };

    const objects = await Promise.all(
      listObjects.Contents.map(async (object) => {
        const signedUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: bucket,
            Key: object.Key
          }),
          { expiresIn: 3600 }
        ); // URL expires in 1 hour
        return {
          key: object.Key,
          url: signedUrl
        };
      })
    );

    // Return the list of pictures with their URLs
    return {
      objects
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching objects:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
