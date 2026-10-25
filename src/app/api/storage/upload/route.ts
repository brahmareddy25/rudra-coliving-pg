import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { s3Client } from "@/lib/storage/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const bucketName = process.env.S3_BUCKET_NAME || "rudra-coliving-pg";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "documents";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const s3Key = `${folder}/${session.userId}-${timestamp}-${sanitizedName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let uploadedToS3 = false;

    // 1. Try uploading directly to AWS S3 (Server-to-Server, zero CORS issues)
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: buffer,
          ContentType: file.type || "application/octet-stream",
        })
      );
      uploadedToS3 = true;
      console.log(`[Storage API] File uploaded to AWS S3 successfully: ${s3Key}`);
    } catch (s3Err: any) {
      console.warn(`[Storage API] AWS S3 upload failed (${s3Err?.message || s3Err}), saving to local storage fallback...`);
    }

    // 2. Always persist to local uploads directory as a reliable fallback/cache
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const localFilePath = path.join(uploadDir, `${session.userId}-${timestamp}-${sanitizedName}`);
      fs.writeFileSync(localFilePath, buffer);
      console.log(`[Storage API] File saved locally at: ${localFilePath}`);
    } catch (localErr) {
      console.warn("[Storage API] Local write warning:", localErr);
    }

    return NextResponse.json({
      success: true,
      key: s3Key,
      uploadedToS3,
    });
  } catch (error: any) {
    console.error("[Storage Upload API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
