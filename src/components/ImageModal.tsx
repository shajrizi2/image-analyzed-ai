"use client";
import { useState } from "react";
import { trpc } from "@/utils/trpc";

interface ImageModalProps {
  image: {
    id: number;
    filename: string;
    original_path: string;
    thumbnail_path: string;
    image_metadata?: {
      description?: string;
      tags?: string[];
      colors?: string[];
      ai_processing_status?: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (imageId: number) => void;
  onImageSelect?: (image: any) => void;
}

export default function ImageModal({
  image,
  isOpen,
  onClose,
  onDelete,
  onImageSelect,
}: ImageModalProps) {
  const [showSimilar, setShowSimilar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteMutation = trpc.upload.deleteImage.useMutation();
  const { data: similarData, isLoading: similarLoading } = trpc.metadata.findSimilar.useQuery(
    { imageId: image.id },
    { enabled: showSimilar }
  );

  if (!isOpen) return null;

  const metadata = Array.isArray(image.image_metadata) 
    ? image.image_metadata[0] 
    : image.image_metadata;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ imageId: image.id });
      if (onDelete) {
        onDelete(image.id);
      }
      onClose();
      
      if (typeof window !== "undefined" && (window as any).addToast) {
        (window as any).addToast({
          type: "success",
          title: "Image Deleted",
          message: "Image deleted successfully",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      if (typeof window !== "undefined" && (window as any).addToast) {
        (window as any).addToast({
          type: "error",
          title: "Delete Failed",
          message: error instanceof Error ? error.message : "Failed to delete image",
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {image.filename}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={image.original_path}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowSimilar(!showSimilar)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {showSimilar ? "Hide Similar" : "Find Similar"}
                </button>
                <a
                  href={image.original_path}
                  download={image.filename}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Download
                </a>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-6">
              {/* Description */}
              {metadata?.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {metadata.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {metadata?.tags && metadata.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {metadata.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {metadata?.colors && metadata.colors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Dominant Colors
                  </h3>
                  <div className="flex space-x-2">
                    {metadata.colors.map((color: string, index: number) => (
                      <div
                        key={index}
                        className="w-8 h-8 rounded border border-gray-300"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Processing Status */}
              {metadata?.ai_processing_status && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Processing Status
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      metadata.ai_processing_status === "completed"
                        ? "bg-green-100 text-green-800"
                        : metadata.ai_processing_status === "processing"
                        ? "bg-yellow-100 text-yellow-800"
                        : metadata.ai_processing_status === "failed"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {metadata.ai_processing_status}
                  </span>
                </div>
              )}

              {/* File Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  File Information
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Filename: {image.filename}</p>
                  <p>Original Path: {image.original_path}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Images Section */}
          {showSimilar && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Similar Images
              </h3>
              {similarLoading ? (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-600">Loading similar images...</div>
                </div>
              ) : similarData?.images && similarData.images.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {similarData.images.map((img: any) => (
                    <div
                      key={img.id}
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-indigo-400 transition-all"
                      onClick={() => {
                        if (onImageSelect) {
                          onImageSelect(img);
                          setShowSimilar(false);
                        }
                      }}
                      title={img.filename}
                    >
                      <img
                        src={img.thumbnail_path}
                        alt={img.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">
                    No similar images found yet.
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Upload more images with similar tags or colors to see matches!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Image?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "{image.filename}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
