"use client";
import { useState, useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { useGalleryStore } from "@/store/galleryStore";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"text" | "color">("text");
  const [selectedColor, setSelectedColor] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { setImages } = useGalleryStore();

  const searchByText = trpc.search.searchByText.useQuery(
    { query: searchQuery },
    { enabled: false }
  );

  const filterByColor = trpc.search.filterByColor.useQuery(
    { color: selectedColor },
    { enabled: false }
  );

  const allImages = trpc.metadata.getAll.useQuery(
    { page: 1, limit: 20 },
    { enabled: false }
  );

  // Update gallery when search results change
  useEffect(() => {
    if (searchByText.data && isSearchActive) {
      setImages(searchByText.data);
    }
  }, [searchByText.data, isSearchActive, setImages]);

  useEffect(() => {
    if (filterByColor.data && isSearchActive) {
      setImages(filterByColor.data);
    }
  }, [filterByColor.data, isSearchActive, setImages]);

  const handleSearch = async () => {
    setIsSearchActive(true);
    if (searchType === "text" && searchQuery.trim()) {
      await searchByText.refetch();
    } else if (searchType === "color" && selectedColor) {
      await filterByColor.refetch();
    }
  };

  const handleClearSearch = async () => {
    setSearchQuery("");
    setSelectedColor("");
    setIsSearchActive(false);
    // Reset to show all images
    const result = await allImages.refetch();
    if (result.data?.images) {
      setImages(result.data.images);
    }
  };

  const commonColors = [
    { name: "Red", value: "#FF0000" },
    { name: "Blue", value: "#0000FF" },
    { name: "Green", value: "#00FF00" },
    { name: "Yellow", value: "#FFFF00" },
    { name: "Purple", value: "#800080" },
    { name: "Orange", value: "#FFA500" },
    { name: "Pink", value: "#FFC0CB" },
    { name: "Brown", value: "#A52A2A" },
    { name: "Black", value: "#000000" },
    { name: "White", value: "#FFFFFF" },
  ];

  return (
    <div className="bg-white rounded-lg border p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Search Images
      </h3>

      {/* Search Type Toggle */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setSearchType("text")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            searchType === "text"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Text Search
        </button>
        <button
          onClick={() => setSearchType("color")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            searchType === "color"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Color Filter
        </button>
      </div>

      {/* Text Search */}
      {searchType === "text" && (
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search by tags or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </div>
      )}

      {/* Color Filter */}
      {searchType === "color" && (
        <div>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {commonColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className={`p-3 rounded-md border-2 transition-all ${
                  selectedColor === color.value
                    ? "border-indigo-500 ring-2 ring-indigo-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="color"
              value={selectedColor || "#000000"}
              onChange={(e) => setSelectedColor(e.target.value.toUpperCase())}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <button
              onClick={handleSearch}
              disabled={!selectedColor}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Filter by Color
            </button>
          </div>
        </div>
      )}

      {/* Clear Search */}
      {(searchQuery || selectedColor) && (
        <button
          onClick={handleClearSearch}
          className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Clear Search
        </button>
      )}

      {/* Search Results Info */}
      {(searchByText.data || filterByColor.data) && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            Found {searchByText.data?.length || filterByColor.data?.length || 0}{" "}
            images
          </p>
        </div>
      )}
    </div>
  );
}
