'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { S3Client, PutObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';

// 1. Initialize S3 Client (Contabo)
const s3Client = new S3Client({
  region: process.env.STORAGE_REGION || 'default',
  endpoint: process.env.STORAGE_ENDPOINT, // e.g. https://eu2.contabostorage.com
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESSKEY!,
    secretAccessKey: process.env.STORAGE_SECRETKEY!
  }
});

export async function uploadUserPhoto(photoDataUrl: string) {
  const supabase = await createClient();
  
  // 1. Authenticate User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  try {
    // 2. AUTO-DETECT BUCKET
    // Since we don't have a bucket name in ENV, we ask Contabo for one.
    const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
    
    if (!Buckets || Buckets.length === 0) {
      throw new Error("No Storage Buckets found in your Contabo account.");
    }

    // We use the first available bucket
    const bucketName = Buckets[0].Name;
    if (!bucketName) throw new Error("Bucket name could not be resolved.");

    // 3. Prepare File
    const base64Data = photoDataUrl.split(';base64,').pop();
    if (!base64Data) throw new Error('Invalid image data');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const fileName = `license-photos/${user.id}-${Date.now()}.jpg`;

    console.log(`[Upload] Auto-detected bucket: '${bucketName}'. Uploading...`);

    // 4. Upload to Contabo
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read' // Assumes your bucket allows public files
    });

    await s3Client.send(command);

    // 5. Construct Public URL
    // Remove trailing slash from endpoint if present
    const endpoint = process.env.STORAGE_ENDPOINT!.replace(/\/$/, '');
    const publicUrl = `${endpoint}/${bucketName}/${fileName}`;

    // 6. Save URL to Supabase Profile
    const { error: dbError } = await supabase
      .from('users')
      .update({ photo_url: publicUrl })
      .eq('id', user.id);

    if (dbError) throw dbError;

    revalidatePath('/biz/fun-license');
    return { success: true, url: publicUrl };

  } catch (error: any) {
    console.error('[Upload Error]:', error);
    return { success: false, message: error.message || 'Upload failed' };
  }
}