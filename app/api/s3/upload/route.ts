import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';
import { createId } from '@paralleldrive/cuid2';

const s3Client = new S3Client({
  region: process.env.STORAGE_REGION!,
  forcePathStyle: true,
  endpoint: process.env.STORAGE_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESSKEY!,
    secretAccessKey: process.env.STORAGE_SECRETKEY!
  }
});

export async function POST(req: Request) {
  // Precheck for AWS credentials
  if (
    !process.env.STORAGE_ACCESSKEY ||
    !process.env.STORAGE_SECRETKEY ||
    !process.env.STORAGE_REGION ||
    !process.env.STORAGE_ENDPOINT
  ) {
    console.error('Missing AWS credentials');
    return NextResponse.json(
      { success: false, body: 'Missing AWS credentials' },
      { status: 500 }
    );
  }
  const { mainDir, subDir, bucket, contentType } = await req.json();
  const key = `${mainDir}/${subDir}/${createId()}`;

  try {
    // Check if the file already exists
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      console.log('File already exists');
      return NextResponse.json(
        { success: false, message: 'File with the same name already exists' },
        { status: 400 }
      );
    } catch (error) {
      //  if it is type error...
      if (error instanceof Error && error.name === 'NotFound') {
        console.log('File does not exist, uploading...');
      }
    }
    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: bucket,
      Key: key,
      Conditions: [
        ['content-length-range', 0, 10485760], // up to 10 MB
        ['starts-with', '$Content-Type', contentType]
      ],
      Fields: {
        acl: 'public-read',
        'Content-Type': contentType
      },
      Expires: 600 // Seconds before the presigned post expires. 3600 by default.
    });
    const endpoint = process.env.STORAGE_ENDPOINT!;
    return NextResponse.json({
      message: `file Uploaded`,
      key,
      endpoint,
      url,
      fields
    });
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return NextResponse.json(
      { success: false, body: JSON.stringify(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bucket = url.searchParams.get('bucket');
  const mainDir = url.searchParams.get('mainDir');
  const subDir = url.searchParams.get('subDir');
  const prefix = `${mainDir}/${subDir}/`;

  if (!bucket || !mainDir || !subDir) {
    return NextResponse.json(
      { success: false, body: 'Missing bucket or key' },
      { status: 400 }
    );
  }

  try {
    const listObjects = await s3Client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix })
    );
    if (!listObjects.Contents) return NextResponse.json({ objects: [] });

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
    return NextResponse.json({
      objects
    });
  } catch (error) {
    console.error('Error fetching objects:', error);
    return NextResponse.json(
      { success: false, body: JSON.stringify(error) },
      { status: 500 }
    );
  }
}
