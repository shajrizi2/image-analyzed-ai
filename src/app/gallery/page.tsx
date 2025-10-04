"use client";
import { useEffect, useState } from "react";
import { trpc } from "@/utils/trpc";
import { useGalleryStore } from "@/store/galleryStore";
import { useAuthStore } from "@/store/authStore";
import SearchBar from "@/components/SearchBar";
import ImageModal from "@/components/ImageModal";
import ImageUpload from "@/components/ImageUpload";
import ProtectedRoute from "@/components/ProtectedRoute";

function GalleryContent() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading } = trpc.metadata.getAll.useQuery({ page: currentPage, limit: 20 });
  const { setImages, images } = useGalleryStore();
  const { user, signOut } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (data?.images) {
      console.log('Gallery images:', data.images);
      console.log('First image thumbnail_path:', data.images[0]?.thumbnail_path);
      setImages(data.images);
    }
  }, [data, setImages]);

  const handleLogout = async () => {
    await signOut();
  };

  const handleUploadComplete = (imageId: number) => {
    // Find the uploaded image in the gallery
    const uploadedImage = images.find((img) => img.id === imageId);
    if (uploadedImage) {
      setSelectedImage(uploadedImage);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                AI Image Gallery
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <SearchBar />
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upload Images
          </h2>
          <ImageUpload onUploadComplete={handleUploadComplete} />
        </div>

        {/* Gallery Section */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Gallery
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Loading your images...</div>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600 mb-4">No images yet</div>
            <div className="text-sm text-gray-500">
              Upload some images to get started!
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group cursor-pointer"
                  onClick={() => {
                    setSelectedImage(img);
                    setIsModalOpen(true);
                  }}
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-gray-200">
                    <img
                      src={img.thumbnail_path}
                      alt={img.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 truncate">
                      {img.filename}
                    </p>
                    {(() => {
                      const metadata = Array.isArray(img.image_metadata) 
                        ? img.image_metadata[0] 
                        : img.image_metadata;
                      return metadata?.ai_processing_status === "processing" && (
                        <div className="flex items-center mt-1">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse mr-1"></div>
                          <span className="text-xs text-yellow-600">
                            Processing...
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {data.pagination.totalPages} ({data.pagination.total} images)
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={currentPage === data.pagination.totalPages}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedImage(null);
          }}
        />
      )}
    </div>
  );
}

export default function GalleryPage() {
  return (
    <ProtectedRoute>
      <GalleryContent />
    </ProtectedRoute>
  );
}
