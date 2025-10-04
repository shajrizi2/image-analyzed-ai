import { supabase } from "./supaBaseClient";

/**
 * Get public URL for an image stored in Supabase Storage
 * @param path - Storage path (e.g., "user-id/filename.jpg")
 * @returns Public URL string
 */
export function getImagePublicUrl(path: string): string {
  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Transform image data to include public URLs
 */
export function transformImageWithUrls(image: any) {
  return {
    ...image,
    original_url: getImagePublicUrl(image.original_path),
    thumbnail_url: getImagePublicUrl(image.thumbnail_path),
  };
}

/**
 * Transform array of images to include public URLs
 */
export function transformImagesWithUrls(images: any[]) {
  return images.map(transformImageWithUrls);
}
