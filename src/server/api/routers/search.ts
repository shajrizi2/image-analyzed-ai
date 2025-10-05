import { protectedProcedure, router } from "../trpc";
import { z } from "zod";

// Helper to add public URLs to image paths
function getPublicUrl(supabase: any, path: string) {
  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

function transformImageWithUrls(supabase: any, image: any) {
  return {
    ...image,
    original_path: getPublicUrl(supabase, image.original_path),
    thumbnail_path: getPublicUrl(supabase, image.thumbnail_path),
  };
}

// Helper to check if two colors are similar (within RGB threshold)
function isSimilarColor(color1: string, color2: string, threshold = 50): boolean {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);
  
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);
  
  const distance = Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );
  
  return distance <= threshold;
}

export const searchRouter = router({
  searchByText: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get all images with metadata for the user
      const { data: allImages, error } = await ctx.supabase
        .from("images")
        .select("*, image_metadata(*)")
        .eq("user_id", ctx.user?.id)
        .order("uploaded_at", { ascending: false });

      if (error) throw new Error(error.message);
      if (!allImages) return [];

      // Filter on the client side for more flexible matching
      const query = input.query.toLowerCase();
      const filtered = allImages.filter((img: any) => {
        const metadata = Array.isArray(img.image_metadata)
          ? img.image_metadata[0]
          : img.image_metadata;
        
        if (!metadata) return false;

        // Check description
        const descriptionMatch = metadata.description?.toLowerCase().includes(query);
        
        // Check tags
        const tagsMatch = metadata.tags?.some((tag: string) => 
          tag.toLowerCase().includes(query)
        );

        return descriptionMatch || tagsMatch;
      });

      return filtered.map((img) => transformImageWithUrls(ctx.supabase, img));
    }),

  findSimilar: protectedProcedure
    .input(z.object({ imageId: z.number() }))
    .query(async ({ ctx, input }) => {
      // First get the target image's metadata
      const { data: targetImage, error: targetError } = await ctx.supabase
        .from("image_metadata")
        .select("tags, colors")
        .eq("image_id", input.imageId)
        .single();

      if (targetError || !targetImage) {
        throw new Error("Target image not found");
      }

      // Find images with similar tags or colors
      const { data, error } = await ctx.supabase
        .from("images")
        .select("*, image_metadata(*)")
        .neq("id", input.imageId)
        .or(
          `image_metadata.tags.ov.{${targetImage.tags?.join(
            ","
          )}},image_metadata.colors.ov.{${targetImage.colors?.join(",")}}`
        )
        .order("uploaded_at", { ascending: false })
        .limit(10);

      if (error) throw new Error(error.message);
      return data?.map((img) => transformImageWithUrls(ctx.supabase, img)) || [];
    }),

  filterByColor: protectedProcedure
    .input(z.object({ color: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get all images with metadata for the user
      const { data: allImages, error } = await ctx.supabase
        .from("images")
        .select("*, image_metadata(*)")
        .eq("user_id", ctx.user?.id)
        .order("uploaded_at", { ascending: false });

      if (error) throw new Error(error.message);
      if (!allImages) return [];

      // Filter images that have similar colors
      const targetColor = input.color.toUpperCase();
      const filtered = allImages.filter((img: any) => {
        const metadata = Array.isArray(img.image_metadata)
          ? img.image_metadata[0]
          : img.image_metadata;
        
        if (!metadata?.colors) return false;

        // Check if any color in the image is similar to the target color
        return metadata.colors.some((color: string) => {
          // Exact match or similar (you can add color similarity logic here)
          return color.toUpperCase() === targetColor || 
                 isSimilarColor(color, targetColor);
        });
      });

      return filtered.map((img) => transformImageWithUrls(ctx.supabase, img));
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("images")
      .select("*, image_metadata(*)")
      .order("uploaded_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data?.map((img) => transformImageWithUrls(ctx.supabase, img)) || [];
  }),
});
