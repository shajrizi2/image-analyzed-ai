"use client";
import { useState, useCallback, useRef } from "react";
import { trpc } from "@/utils/trpc";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/utils/supaBaseClient";
import { useGalleryStore } from "@/store/galleryStore";

interface UploadProgress {
  filename: string;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
  error?: string;
}

interface ImageUploadProps {
  onUploadComplete?: (imageId: number) => void;
}

export default function ImageUpload({ onUploadComplete }: ImageUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const uploadMutation = trpc.upload.uploadImage.useMutation();
  const updateMetadataMutation = trpc.upload.updateMetadata.useMutation();
  const { refetch } = trpc.metadata.getAll.useQuery({ page: 1, limit: 20 });
  const { setImages } = useGalleryStore();

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || !user) return;

      const fileArray = Array.from(files);
      const newUploads: UploadProgress[] = fileArray.map((file) => ({
        filename: file.name,
        progress: 0,
        status: "uploading",
      }));

      setUploadProgress((prev) => [...prev, ...newUploads]);

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const uploadIndex = uploadProgress.length + i;

        try {
          // Update progress
          setUploadProgress((prev) =>
            prev.map((upload, index) =>
              index === uploadIndex
                ? { ...upload, progress: 10, status: "uploading" }
                : upload
            )
          );

          // Upload to Supabase Storage
          const fileExt = file.name.split(".").pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${fileExt}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("images").upload(fileName, file);

          if (uploadError) throw uploadError;

          // Update progress
          setUploadProgress((prev) =>
            prev.map((upload, index) =>
              index === uploadIndex
                ? { ...upload, progress: 50, status: "uploading" }
                : upload
            )
          );

          // Generate thumbnail
          const thumbnailName = `thumbnails/${fileName}`;
          const thumbnailResponse = await fetch("/api/generate-thumbnail", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imagePath: uploadData.path,
              thumbnailPath: thumbnailName,
            }),
          });

          if (!thumbnailResponse.ok) {
            throw new Error("Failed to generate thumbnail");
          }

          const thumbnailData = await thumbnailResponse.json();

          // Update progress
          setUploadProgress((prev) =>
            prev.map((upload, index) =>
              index === uploadIndex
                ? { ...upload, progress: 70, status: "processing" }
                : upload
            )
          );

          // Save to database
          const imageData = await uploadMutation.mutateAsync({
            filename: file.name,
            originalPath: uploadData.path,
            thumbnailPath: thumbnailData.thumbnailPath,
            fileSize: file.size,
            mimeType: file.type,
          });

          // Update progress
          setUploadProgress((prev) =>
            prev.map((upload, index) =>
              index === uploadIndex
                ? { ...upload, progress: 90, status: "processing" }
                : upload
            )
          );

          // Process with AI and wait for completion
          await processImageWithAI(imageData.id, uploadData.path);

          // Complete
          setUploadProgress((prev) =>
            prev.map((upload, index) =>
              index === uploadIndex
                ? { ...upload, progress: 100, status: "completed" }
                : upload
            )
          );

          // Refresh gallery to show new image
          const result = await refetch();
          if (result.data?.images) {
            setImages(result.data.images);
          }

          // Auto-open modal with the newly uploaded image
          if (onUploadComplete) {
            onUploadComplete(imageData.id);
          }

          // Show success toast
          if (typeof window !== "undefined" && (window as any).addToast) {
            (window as any).addToast({
              type: "success",
              title: "Upload Successful",
              message: `${file.name} uploaded and analyzed successfully`,
            });
          }
        } catch (error) {
          console.error("Upload error:", error);
          setUploadProgress((prev) =>
            prev.map((upload, index) =>
              index === uploadIndex
                ? {
                    ...upload,
                    progress: 0,
                    status: "error",
                    error:
                      error instanceof Error ? error.message : "Upload failed",
                  }
                : upload
            )
          );

          // Show error toast
          if (typeof window !== "undefined" && (window as any).addToast) {
            (window as any).addToast({
              type: "error",
              title: "Upload Failed",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to upload image",
            });
          }
        }
      }
    },
    [user, uploadProgress.length, uploadMutation, updateMetadataMutation]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const processImageWithAI = async (imageId: number, imagePath: string) => {
    try {
      // Call AI processing endpoint
      const response = await fetch("/api/process-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId,
          imagePath,
        }),
      });

      if (!response.ok) {
        throw new Error("AI processing failed");
      }

      const result = await response.json();
      console.log("AI processing result:", result);
    } catch (error) {
      console.error("AI processing error:", error);
    }
  };

  return (
    <div className="w-full">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragOver
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300 hover:border-gray-400"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-sm text-gray-600">
            {isDragOver ? (
              <p>Drop the images here...</p>
            ) : (
              <div>
                <p className="font-medium">Drag & drop images here</p>
                <p className="text-xs text-gray-500">
                  or click to select files
                </p>
                <p className="text-xs text-gray-500">
                  Supports JPEG, PNG (max 10MB)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Upload Progress</h3>
          {uploadProgress.map((upload, index) => (
            <div key={index} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {upload.filename}
                </span>
                <span className="text-xs text-gray-500">
                  {upload.status === "completed"
                    ? "✓"
                    : upload.status === "error"
                    ? "✗"
                    : upload.status === "processing"
                    ? "⚙"
                    : "↑"}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    upload.status === "completed"
                      ? "bg-green-500"
                      : upload.status === "error"
                      ? "bg-red-500"
                      : "bg-indigo-500"
                  }`}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              {upload.error && (
                <p className="text-xs text-red-600 mt-1">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
