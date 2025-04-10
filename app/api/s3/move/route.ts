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

export async function POST(req: Request) {
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
    const { sourceKey, destinationKey, bucket } = await req.json();

    if (!sourceKey || !destinationKey || !bucket) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Copy the file to new location
    const copyCommand = new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${sourceKey}`,
      Key: destinationKey,
      ACL: 'public-read'
    });

    await s3Client.send(copyCommand);

    // Delete the original file
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: sourceKey
    });

    await s3Client.send(deleteCommand);

    return NextResponse.json({
      success: true,
      message: 'File moved successfully',
      newKey: destinationKey
    });
  } catch (error) {
    console.error('Error moving file:', error);
    return NextResponse.json(
      { success: false, message: 'Error moving file' },
      { status: 500 }
    );
  }
}