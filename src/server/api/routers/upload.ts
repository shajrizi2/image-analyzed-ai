import { protectedProcedure, router } from "../trpc";
import { z } from "zod";

export const uploadRouter = router({
  uploadImage: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        originalPath: z.string(),
        thumbnailPath: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("images")
        .insert({
          user_id: ctx.user?.id,
          filename: input.filename,
          original_path: input.originalPath,
          thumbnail_path: input.thumbnailPath,
          file_size: input.fileSize,
          mime_type: input.mimeType,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  updateMetadata: protectedProcedure
    .input(
      z.object({
        imageId: z.number(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        colors: z.array(z.string()).optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("image_metadata")
        .upsert({
          image_id: input.imageId,
          user_id: ctx.user?.id,
          description: input.description,
          tags: input.tags,
          colors: input.colors,
          ai_processing_status: input.status || "completed",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  deleteImage: protectedProcedure
    .input(z.object({ imageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // First, get the image data to get file paths
      const { data: image, error: fetchError } = await ctx.supabase
        .from("images")
        .select("original_path, thumbnail_path, user_id")
        .eq("id", input.imageId)
        .eq("user_id", ctx.user?.id)
        .single();

      if (fetchError) throw new Error(fetchError.message);
      if (!image) throw new Error("Image not found or unauthorized");

      // Delete files from storage
      const filesToDelete = [image.original_path, image.thumbnail_path];
      const { error: storageError } = await ctx.supabase.storage
        .from("images")
        .remove(filesToDelete);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database (cascade will delete metadata)
      const { error: deleteError } = await ctx.supabase
        .from("images")
        .delete()
        .eq("id", input.imageId)
        .eq("user_id", ctx.user?.id);

      if (deleteError) throw new Error(deleteError.message);

      return { success: true, imageId: input.imageId };
    }),
});
