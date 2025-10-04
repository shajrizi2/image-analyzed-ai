"use client";
import { useState } from "react";

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
}

export default function ImageModal({
  image,
  isOpen,
  onClose,
}: ImageModalProps) {
  const [showSimilar, setShowSimilar] = useState(false);

  if (!isOpen) return null;

  const metadata = image.image_metadata?.[0] || image.image_metadata;

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
                    {metadata.tags.map((tag, index) => (
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
                    {metadata.colors.map((color, index) => (
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
        </div>
      </div>
    </div>
  );
}
