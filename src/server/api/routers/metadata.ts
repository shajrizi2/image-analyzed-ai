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

export const metadataRouter = router({
  getAll: protectedProcedure
    .input(
      z
        .object({
          page: z.number().default(1),
          limit: z.number().default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page || 1;
      const limit = input?.limit || 20;
      const offset = (page - 1) * limit;

      // Get total count
      const { count } = await ctx.supabase
        .from("images")
        .select("*", { count: "exact", head: true });

      // Get paginated data
      const { data, error } = await ctx.supabase
        .from("images")
        .select("*, image_metadata(*)")
        .order("uploaded_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw new Error(error.message);
      
      return {
        images: data?.map((img) => transformImageWithUrls(ctx.supabase, img)) || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("images")
        .select("*, image_metadata(*)")
        .eq("id", input.id)
        .single();

      if (error) throw new Error(error.message);
      return data ? transformImageWithUrls(ctx.supabase, data) : null;
    }),

  getProcessingStatus: protectedProcedure
    .input(z.object({ imageId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("image_metadata")
        .select("ai_processing_status")
        .eq("image_id", input.imageId)
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  updateProcessingStatus: protectedProcedure
    .input(
      z.object({
        imageId: z.number(),
        status: z.enum(["pending", "processing", "completed", "failed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("image_metadata")
        .upsert({
          image_id: input.imageId,
          user_id: ctx.user?.id,
          ai_processing_status: input.status,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),
});
