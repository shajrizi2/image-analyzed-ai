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

export const searchRouter = router({
  searchByText: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("images")
        .select("*, image_metadata(*)")
        .or(
          `image_metadata.tags.cs.{${input.query}},image_metadata.description.ilike.%${input.query}%`
        )
        .order("uploaded_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data?.map((img) => transformImageWithUrls(ctx.supabase, img)) || [];
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
      const { data, error } = await ctx.supabase
        .from("images")
        .select("*, image_metadata(*)")
        .contains("image_metadata.colors", [input.color])
        .order("uploaded_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data?.map((img) => transformImageWithUrls(ctx.supabase, img)) || [];
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
