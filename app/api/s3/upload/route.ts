import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dayjs from 'dayjs';
import { NextRequest, NextResponse } from 'next/server';

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
  const { file, mainDir, subDir, bucket } = await req.json();
  const key = `${mainDir}/${subDir}/${file.name}_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`;

  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: file.data,
        ACL: 'public-read',
        ContentType: file.type
      }
    });

    await upload.done();

    const endpoint = s3Client.config.endpoint;
    const url = `${endpoint}/${bucket}/${key}`;
    return NextResponse.json({
      message: `file Uploaded`,
      url,
      key
    });
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return NextResponse.json(
      { success: false, body: JSON.stringify(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const bucket = searchParams.get('bucket') as string;
  const key = searchParams.get('key') as string;

  try {
    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key
      })
    );

    return NextResponse.json({
      url
    });
  } catch (error) {
    console.error('Error getting file from S3:', error);
    return NextResponse.json(
      { success: false, body: JSON.stringify(error) },
      { status: 500 }
    );
  }
}
