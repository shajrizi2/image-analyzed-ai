import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface OpenAIVisionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { imagePath, imageId } = await request.json();

    if (!imagePath || !imageId) {
      return NextResponse.json(
        { error: "Missing imagePath or imageId" },
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

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // If no API key, return mock data for development
      const mockData = {
        description: "A beautiful landscape with mountains and trees",
        tags: [
          "landscape",
          "mountain",
          "nature",
          "outdoor",
          "scenic",
          "tree",
          "sky",
          "green",
        ],
        colors: ["#4A90E2", "#7ED321", "#F5A623"],
      };

      // Update database with mock data
      await updateImageMetadata(supabase, imageId, mockData);

      return NextResponse.json({
        success: true,
        data: mockData,
        source: "mock",
      });
    }

    // Get image URL from Supabase Storage
    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(imagePath);

    // Call OpenAI GPT-4 Vision API
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this image and provide:
1. A one-sentence description
2. 5-10 relevant tags (comma-separated)
3. Top 3 dominant colors as hex codes (comma-separated)

Format your response as JSON:
{
  "description": "one sentence description",
  "tags": ["tag1", "tag2", ...],
  "colors": ["#RRGGBB", "#RRGGBB", "#RRGGBB"]
}`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: urlData.publicUrl,
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const openaiData: OpenAIVisionResponse = await response.json();

    // Parse the JSON response from GPT-4
    let processedData;
    try {
      const content = openaiData.choices[0].message.content;
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        processedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      // Fallback if parsing fails
      processedData = {
        description: openaiData.choices[0].message.content.substring(0, 200),
        tags: ["image", "photo"],
        colors: ["#808080", "#A0A0A0", "#606060"],
      };
    }

    // Update database
    await updateImageMetadata(supabase, imageId, processedData);

    return NextResponse.json({
      success: true,
      data: processedData,
      source: "openai",
    });
  } catch (error) {
    console.error("AI processing error:", error);

    // Fallback to mock data on error
    try {
      // Create Supabase client for fallback
      const cookieStore = await cookies();
      const supabaseFallback = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get: (key) => cookieStore.get(key)?.value,
          },
        }
      );

      const body = await request.json();
      const mockData = {
        description: "Image analysis failed - using fallback description",
        tags: ["image", "photo", "picture"],
        colors: ["#808080"],
      };

      await updateImageMetadata(supabaseFallback, body.imageId, mockData);

      return NextResponse.json({
        success: true,
        data: mockData,
        source: "fallback",
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
    }
  }
}

async function updateImageMetadata(supabase: any, imageId: number, data: any) {
  // First, get the user_id from the image record (required for RLS)
  const { data: imageData, error: imageError } = await supabase
    .from("images")
    .select("user_id")
    .eq("id", imageId)
    .single();

  if (imageError) {
    throw new Error(`Failed to fetch image data: ${imageError.message}`);
  }

  const { error } = await supabase.from("image_metadata").upsert({
    image_id: imageId,
    user_id: imageData.user_id,
    description: data.description,
    tags: data.tags,
    colors: data.colors,
    ai_processing_status: "completed",
  });

  if (error) {
    throw new Error(`Database update failed: ${error.message}`);
  }
}
