import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "ap-south-1";
const bucketName = process.env.S3_BUCKET_NAME || "rudra-coliving-pg";

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Generate a presigned URL for private direct uploads from the client
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 300
): Promise<{ uploadUrl: string; key: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    return { uploadUrl, key };
  } catch (error: any) {
    console.error("[S3] Error generating upload URL:", error);
    throw new Error(`Failed to generate upload URL: ${error.message}`);
  }
}

/**
 * Generate a temporary presigned URL for secure document viewing (Aadhaar, photo, receipt)
 */
export async function getPresignedViewUrl(
  key: string,
  expiresInSeconds = 900 // 15 minutes default
): Promise<string> {
  if (!key) return "";
  
  // If the key is already a full external URL or data URI, return as-is
  if (key.startsWith("http://") || key.startsWith("https://") || key.startsWith("data:")) {
    return key;
  }

  // Check if saved in local uploads directory
  try {
    const fs = await import("fs");
    const path = await import("path");
    const localPath = path.join(process.cwd(), "public", "uploads", key);
    if (fs.existsSync(localPath)) {
      return `/uploads/${key}`;
    }
  } catch (localCheckErr) {
    // continue to S3
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  } catch (error: any) {
    console.error(`[S3] Error generating view URL for key ${key}:`, error);
    return `/uploads/${key}`;
  }
}

/**
 * Delete a private file from S3
 */
export async function deleteS3Object(key: string): Promise<boolean> {
  if (!key) return false;
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error: any) {
    console.error(`[S3] Error deleting object ${key}:`, error);
    return false;
  }
}
