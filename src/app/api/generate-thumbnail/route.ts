import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { imagePath, thumbnailPath } = await request.json();

    if (!imagePath || !thumbnailPath) {
      return NextResponse.json(
        { error: "Missing imagePath or thumbnailPath" },
        { status: 400 }
      );
    }

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: (key) => cookieStore.get(key)?.value,
        },
      }
    );

    // Download the original image from Supabase Storage
    const { data: imageData, error: downloadError } = await supabase.storage
      .from("images")
      .download(imagePath);

    if (downloadError) {
      throw new Error(`Failed to download image: ${downloadError.message}`);
    }

    // Convert to buffer
    const imageBuffer = Buffer.from(await imageData.arrayBuffer());

    // Generate thumbnail using Sharp
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(300, 300, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload thumbnail to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("images")
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload thumbnail: ${uploadError.message}`);
    }

    // Get public URL for the thumbnail
    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      thumbnailPath: uploadData.path,
      thumbnailUrl: urlData.publicUrl,
    });
  } catch (error) {
    console.error("Thumbnail generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
