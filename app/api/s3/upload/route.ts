import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';
import { createId } from '@paralleldrive/cuid2';
import formidable from 'formidable';
import fs from 'fs';

const s3Client = new S3Client({
  region: process.env.STORAGE_REGION!,
  forcePathStyle: true,
  endpoint: process.env.STORAGE_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESSKEY!,
    secretAccessKey: process.env.STORAGE_SECRETKEY!
  }
});

export const config = {
  api: {
    bodyParser: false
  }
};

export async function POST(req: NextRequest) {
  if (
    !process.env.STORAGE_ACCESSKEY ||
    !process.env.STORAGE_SECRETKEY ||
    !process.env.STORAGE_REGION ||
    !process.env.STORAGE_ENDPOINT
  ) {
    console.error('Missing AWS credentials');
    return NextResponse.json(
      { success: false, message: 'Missing AWS credentials' },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mainDir = formData.get('mainDir') as string;
    const subDir = formData.get('subDir') as string;
    const bucket = formData.get('bucket') as string;
    const contentType = formData.get('contentType') as string;

    if (!file || !mainDir || !subDir || !bucket || !contentType) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const key = `${mainDir}/${subDir}/${createId()}`;

    // Check if the file already exists
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      console.log('File already exists');
      return NextResponse.json(
        { success: false, message: 'File with the same name already exists' },
        { status: 400 }
      );
    } catch (error) {
      if (error instanceof Error && error.name !== 'NotFound') {
        throw error;
      }
      console.log('File does not exist, uploading...');
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
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      key,
      endpoint,
      url: `${endpoint}/${bucket}/${key}`
    });
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return NextResponse.json(
      { success: false, message: 'Error uploading to S3' },
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

export async function DELETE(req: NextRequest) {
  if (
    !process.env.STORAGE_ACCESSKEY ||
    !process.env.STORAGE_SECRETKEY ||
    !process.env.STORAGE_REGION ||
    !process.env.STORAGE_ENDPOINT
  ) {
    console.error('Missing AWS credentials');
    return NextResponse.json(
      { success: false, message: 'Missing AWS credentials' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const bucket = searchParams.get('bucket');
    const key = searchParams.get('key');

    if (!bucket || !key) {
      return NextResponse.json(
        { success: false, message: 'Missing bucket or key parameter' },
        { status: 400 }
      );
    }

    // Check if the file exists
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFound') {
        return NextResponse.json(
          { success: false, message: 'File not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Delete the file
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    });

    await s3Client.send(deleteCommand);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting file from S3' },
      { status: 500 }
    );
  }
}
