import { NextResponse } from 'next/server';
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.STORAGE_REGION!,
  forcePathStyle: true,
  endpoint: process.env.STORAGE_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESSKEY!,
    secretAccessKey: process.env.STORAGE_SECRETKEY!
  }
});

export async function PUT(req: Request) {
  if (
    !process.env.STORAGE_ACCESSKEY ||
    !process.env.STORAGE_SECRETKEY ||
    !process.env.STORAGE_REGION ||
    !process.env.STORAGE_ENDPOINT
  ) {
    return NextResponse.json(
      { success: false, message: 'Missing AWS credentials' },
      { status: 500 }
    );
  }

  try {
    const { oldKey, newGroupName, bucket } = await req.json();

    if (!oldKey || !newGroupName || !bucket) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const parts = oldKey.split('/');
    if (parts.length < 5) {
      return NextResponse.json(
        { success: false, message: 'Invalid key format' },
        { status: 400 }
      );
    }

    const filename = parts.pop();
    parts[3] = newGroupName;
    const newKey = [...parts, filename].join('/');

    // Copy the file to new location
    const copyCommand = new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${oldKey}`,
      Key: newKey,
      ACL: 'public-read'
    });

    await s3Client.send(copyCommand);

    // Delete the original file
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: oldKey
    });

    await s3Client.send(deleteCommand);

    return NextResponse.json({
      success: true,
      message: 'File renamed successfully',
      newKey
    });
  } catch (error) {
    console.error('Error renaming file:', error);
    return NextResponse.json(
      { success: false, message: 'Error renaming file' },
      { status: 500 }
    );
  }
}