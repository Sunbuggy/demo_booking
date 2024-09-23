import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  HeadObjectCommand
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
  fetchOne?: boolean,
  key?: string
) {
  if (fetchOne) {
    if (!bucket || !key) {
      return {
        success: false,
        error: {
          message: 'Missing required fields'
        }
      };
    }
    try {
      await s3Client
        .send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
        .then((data) => {})
        .catch((error) => {
          // console.error('send_error', error);
        });

      // If the object exists, generate a signed URL
      const signedUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: 3600 }
      );
      return {
        key,
        url: signedUrl
      };
    } catch (error) {
      if (error instanceof Error)
        if (error.name === 'NotFound') {
          // If the object does not exist, return null
          return {
            key,
            url: null
          };
        } else {
          if (error instanceof Error) {
            console.error('Error fetching objects:', error);
            return {
              success: false,
              error: error.message
            };
          }
        }
    }
  }

  try {
    const listObjects = await s3Client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: key })
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
