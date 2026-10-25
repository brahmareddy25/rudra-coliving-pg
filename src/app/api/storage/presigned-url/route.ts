import { NextResponse } from "next/server";
import { getPresignedUploadUrl, getPresignedViewUrl } from "@/lib/storage/s3";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, filename, fileType, folder, key } = await req.json();

    if (action === "upload") {
      if (!filename || !fileType) {
        return NextResponse.json(
          { error: "filename and fileType are required" },
          { status: 400 }
        );
      }

      // Generate secure unique S3 key
      const timestamp = Date.now();
      const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const targetFolder = folder || "documents";
      const s3Key = `${targetFolder}/${session.userId}-${timestamp}-${sanitizedName}`;

      const { uploadUrl } = await getPresignedUploadUrl(s3Key, fileType);

      return NextResponse.json({
        uploadUrl,
        key: s3Key,
      });
    }

    if (action === "view") {
      if (!key) {
        return NextResponse.json({ error: "key is required" }, { status: 400 });
      }

      const viewUrl = await getPresignedViewUrl(key, 900); // 15 mins
      return NextResponse.json({ viewUrl });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Storage Presigned URL API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process storage request" },
      { status: 500 }
    );
  }
}
