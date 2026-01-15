import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

// Use the new Route Segment Config instead of export const config
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds max for uploads

// Helper function to generate date-based filename with numbering for duplicates
const generateDateBasedFileName = (originalFileName: string, existingKeys: string[] = []): string => {
  const today = new Date().toISOString().split('T')[0];
  const fileExtension = originalFileName.split('.').pop() || 
                       originalFileName.includes('.') ? originalFileName.split('.').pop() : 'file';
  
  // Extract base name without extension for comparison
  const baseName = today;
  
  // Find all existing keys that start with today's date
  const existingFilesForDate = existingKeys.filter(key => {
    const fileName = key.split('/').pop() || '';
    return fileName.startsWith(today);
  });
  
  // If no files exist for today, use just the date
  if (existingFilesForDate.length === 0) {
    return `${baseName}.${fileExtension}`;
  }
  
  // Extract numbers from existing files (e.g., "2024-01-15(1).pdf" -> 1)
  const numbers = existingFilesForDate.map(key => {
    const fileName = key.split('/').pop() || '';
    const match = fileName.match(/\((\d+)\)\./);
    return match ? parseInt(match[1]) : 0;
  });
  
  // Find the next available number
  const nextNumber = Math.max(0, ...numbers) + 1;
  return `${baseName}(${nextNumber}).${fileExtension}`;
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
    const files = formData.getAll('files') as File[];
    const contentType = formData.get('contentType') as string;
    const mode = formData.get('mode') as string;
    const key = formData.get('key') as string;
    const bucket = formData.get('bucket') as string;

    if (files.length === 0 || !contentType || !key || !mode) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add file size validation (50MB limit)
    const maxFileSize = 50 * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxFileSize);
    
    if (oversizedFiles.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `The following files exceed the 50MB size limit: ${oversizedFiles.map(f => f.name).join(', ')}` 
        },
        { status: 413 }
      );
    }

    if (mode === 'single') {
      const file = files[0];
      const buffer = await file.arrayBuffer();
      
      // For single mode, use the original filename or generate date-based name
      const fileKey = `${key}/${file.name}`;
      
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: fileKey,
        Body: Buffer.from(buffer),
        ContentType: contentType,
        ACL: 'public-read'
      });
      await s3Client.send(command);
      const endpoint = process.env.STORAGE_ENDPOINT!;
      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully',
        key: fileKey,
        endpoint,
        url: `${endpoint}/${bucket}/${fileKey}`
      });
    } else if (mode === 'multiple') {
      // First, get existing files to check for naming conflicts
      let existingKeys: string[] = [];
      try {
        const listObjects = await s3Client.send(
          new ListObjectsV2Command({ Bucket: bucket, Prefix: key })
        );
        if (listObjects.Contents) {
          existingKeys = listObjects.Contents.map(obj => obj.Key!).filter(Boolean);
        }
      } catch (error) {
        console.log('Could not list existing objects, proceeding with upload...');
      }

      const uploadResults = [];
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        
        // Generate date-based filename
        const dateBasedFileName = generateDateBasedFileName(file.name, existingKeys);
        const fileKey = `${key}/${dateBasedFileName}`;
        
        // Add this new file to existing keys for the next iteration
        existingKeys.push(fileKey);
        
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: fileKey,
          Body: Buffer.from(buffer),
          ContentType: file.type,
          ACL: 'public-read'
        });
        await s3Client.send(command);
        const endpoint = process.env.STORAGE_ENDPOINT!;
        uploadResults.push({
          key: fileKey,
          url: `${endpoint}/${bucket}/${fileKey}`,
          originalName: file.name,
          dateBasedName: dateBasedFileName
        });
      }
      return NextResponse.json({
        success: true,
        message: 'Files uploaded successfully',
        results: uploadResults
      });
    }
  } catch (error) {
    console.error('Error uploading files to S3:', error);
    return NextResponse.json(
      { success: false, message: 'Error uploading files to S3' },
      { status: 500 }
    );
  }
}

// ... rest of your existing GET, DELETE, and PUT methods remain the same ...
export async function GET(req: Request) {
  const url = new URL(req.url);
  const bucket = url.searchParams.get('bucket') as string;
  const fetchOne = url.searchParams.get('fetchOne') as Boolean | null;
  const key = url.searchParams.get('key') as string;
  
  if (fetchOne) {
    if (!bucket || !key) {
      return NextResponse.json(
        { success: false, body: 'Missing bucket or key' },
        { status: 400 }
      );
    }
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      const signedUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: 3600 }
      );
      return NextResponse.json({
        key,
        url: signedUrl
      });
    } catch (error) {
      console.error('Error fetching object:', error);
      if (error instanceof Error && error.name === 'NotFound') {
        return NextResponse.json({
          key,
          url: null
        });
      } else {
        return NextResponse.json(
          { success: false, body: JSON.stringify(error) },
          { status: 500 }
        );
      }
    }
  }

  try {
    const listObjects = await s3Client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: key })
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
        );
        return {
          key: object.Key,
          url: signedUrl
        };
      })
    );

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

export async function PUT(req: NextRequest) {
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
    const files = formData.getAll('files') as File[];
    const contentType = formData.get('contentType') as string;
    const key = formData.get('key') as string;
    const bucket = formData.get('bucket') as string;
    
    if (files.length === 0 || !contentType || !key) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add size validation for PUT as well
    const maxFileSize = 50 * 1024 * 1024;
    const file = files[0];
    
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { 
          success: false, 
          message: `File "${file.name}" exceeds the 50MB size limit` 
        },
        { status: 413 }
      );
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
    console.error('Error uploading file to S3:', error);
    return NextResponse.json(
      { success: false, message: 'Error uploading file to S3' },
      { status: 500 }
    );
  }
}