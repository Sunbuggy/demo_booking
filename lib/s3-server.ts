import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize Client (Reusing your ENV variables)
const s3Client = new S3Client({
  region: process.env.STORAGE_REGION || 'default',
  endpoint: process.env.STORAGE_ENDPOINT, 
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESSKEY!,
    secretAccessKey: process.env.STORAGE_SECRETKEY!
  }
});

/**
 * Transforms a raw, private Contabo URL into a temporary Public Signed URL.
 * Input: "https://usc1.contabostorage.com/sb-fleet/license-photos/abc.jpg"
 * Output: "https://usc1.contabostorage.com/sb-fleet/license-photos/abc.jpg?Signature=..."
 */
export async function getPrivatePhotoUrl(rawUrl: string | null): Promise<string | null> {
  if (!rawUrl) return null;
  if (rawUrl.startsWith('data:')) return rawUrl; // Return base64 images as-is

  try {
    // 1. Parse the Bucket and Key from the Raw URL
    // Regex matches: https://endpoint/BUCKET/KEY
    const urlObj = new URL(rawUrl);
    const pathParts = urlObj.pathname.split('/'); // ["", "sb-fleet", "license-photos", "file.jpg"]
    
    // Safety check: Needs at least bucket and file
    if (pathParts.length < 3) return rawUrl;

    const bucketName = pathParts[1]; // "sb-fleet"
    // Join the rest of the array to get the key (handles folders)
    const key = pathParts.slice(2).join('/'); // "license-photos/file.jpg"

    // 2. Generate Signed URL (Valid for 1 hour)
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;

  } catch (error) {
    console.error("Error signing S3 URL:", error);
    // Fallback to raw URL so we don't break the UI completely
    return rawUrl;
  }
}