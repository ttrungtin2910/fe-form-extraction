import { useEffect, useState } from "react";
import NftCard from "components/image/NftCard";
import UploadButton from "components/button/UploadButton";
import { MdRefresh, MdSort, MdKeyboardArrowDown, MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";
import { FaPlayCircle, FaTrash, FaSpinner } from "react-icons/fa";
import { api } from "config/api";
import { useImageManagement } from "contexts/ImageManagementContext";

const ImageManagement = () => {
  const [images, setImages] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortField, setSortField] = useState("ImageName"); // "CreatedAt", "ImageName", "Status"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" or "desc"
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  const { 
    selectedImages, 
    updateSelectedImages, 
    updateImages, 
    setAnalyzeHandler, 
    setDeleteHandler,
    setAnalyzingState,
    setDeletingState,
    clearAnalyzingImages,
    setAnalyzeProgressState,
    resetAnalyzeProgress,
    isAnalyzing,
    analyzeProgress
  } = useImageManagement();

  const fetchImages = async () => {
    console.log("[ImageManagement] Starting to fetch images");
    setIsRefreshing(true);
    try {
      const data = await api.images.getAll();
      console.log("[ImageManagement] Raw images data received:", data);
      
      const validImages = data.filter(
        (img) => img.ImagePath && img.ImageName && img.Status
      );
      console.log("[ImageManagement] Valid images filtered:", validImages.length);
      
      // Sort images based on sortField and sortOrder
      const sortedImages = validImages.sort((a, b) => {
        let valueA, valueB;
        
        switch (sortField) {
          case "CreatedAt":
            valueA = new Date(a.CreatedAt);
            valueB = new Date(b.CreatedAt);
            break;
          case "ImageName":
            valueA = a.ImageName.toLowerCase();
            valueB = b.ImageName.toLowerCase();
            break;
          case "Status":
            valueA = a.Status.toLowerCase();
            valueB = b.Status.toLowerCase();
            break;
          default:
            valueA = a[sortField];
            valueB = b[sortField];
        }
        
        if (sortOrder === "asc") {
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
          return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
      });
      
      console.log("[ImageManagement] Images sorted and set:", sortedImages.length);
      setImages(sortedImages);
      updateImages(sortedImages);
    } catch (error) {
      console.error("[ImageManagement] Error fetching images:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [sortField, sortOrder]);

  // Set handlers for sidebar buttons
  useEffect(() => {
    setAnalyzeHandler(handleAnalyzeSelected);
    setDeleteHandler(handleDeleteSelected);
  }, [selectedImages, images]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSortMenu && !event.target.closest('.sort-dropdown')) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortMenu]);

  const handleRefresh = () => {
    fetchImages();
  };

  const handleSortToggle = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleSortFieldChange = (field) => {
    setSortField(field);
    setShowSortMenu(false);
  };

  const getSortFieldDisplayName = (field) => {
    switch (field) {
      case "CreatedAt":
        return "Date";
      case "ImageName":
        return "Name";
      case "Status":
        return "Status";
      default:
        return field;
    }
  };

  const getSortOrderDisplayName = () => {
    return sortOrder === "asc" ? "Ascending" : "Descending";
  };

  const handleImageSelect = (imageName, isSelected) => {
    console.log(`[ImageManagement] Image selection changed: ${imageName} -> ${isSelected}`);
    const newSet = new Set(selectedImages);
    if (isSelected) {
      newSet.add(imageName);
    } else {
      newSet.delete(imageName);
    }
    console.log(`[ImageManagement] Selected images count: ${newSet.size}`);
    updateSelectedImages(newSet);
  };

  const handleImageDelete = (imageName) => {
    console.log(`[ImageManagement] Handling delete for image: ${imageName}`);
    
    // Remove from selected images
    const newSet = new Set(selectedImages);
    newSet.delete(imageName);
    console.log(`[ImageManagement] Removed ${imageName} from selection`);
    updateSelectedImages(newSet);
    
    // Refresh the image list
    console.log("[ImageManagement] Refreshing image list after deletion");
    fetchImages();
  };

  const handleImageAnalyze = (result) => {
    console.log("[ImageManagement] Analysis result received:", result);
    // You can add additional handling here if needed
  };

  const handleSelectAll = () => {
    console.log("[ImageManagement] Select All clicked");
    if (selectedImages.size === images.length) {
      // If all are selected, deselect all
      updateSelectedImages(new Set());
      console.log("[ImageManagement] Deselected all images");
    } else {
      // Select all images
      const allImageNames = images.map(img => img.ImageName);
      updateSelectedImages(new Set(allImageNames));
      console.log(`[ImageManagement] Selected all ${allImageNames.length} images`);
    }
  };

  const handleAnalyzeSelected = async () => {
    if (selectedImages.size === 0) {
      alert("Please select at least one image to analyze");
      return;
    }

    console.log(`[ImageManagement] Starting analysis for ${selectedImages.size} selected images`);
    setAnalyzingState(true);
    
    try {
      const selectedImageData = images.filter(img => selectedImages.has(img.ImageName));
      const totalImages = selectedImageData.length;
      
      // Initialize progress
      setAnalyzeProgressState(0, totalImages);
      
      for (let i = 0; i < selectedImageData.length; i++) {
        const img = selectedImageData[i];
        try {
          console.log(`[ImageManagement] Analyzing image: ${img.ImageName} (${i + 1}/${totalImages})`);
          const result = await api.formExtraction.extract({
            title: img.ImageName,
            size: "—",
            image: img.ImagePath,
            status: img.Status,
            createAt: img.CreatedAt
          });
          console.log(`[ImageManagement] Analysis completed for: ${img.ImageName}`, result);
          
          // Update progress after each successful analysis
          setAnalyzeProgressState(i + 1, totalImages);
        } catch (error) {
          console.error(`[ImageManagement] Error analyzing image: ${img.ImageName}`, error);
          // Still update progress even if there's an error
          setAnalyzeProgressState(i + 1, totalImages);
        }
      }
      
      // Refresh the image list after analysis
      fetchImages();
      alert(`Analysis completed for ${totalImages} selected images. The list has been refreshed.`);
    } finally {
      setAnalyzingState(false);
      clearAnalyzingImages();
      resetAnalyzeProgress();
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) {
      alert("Please select at least one image to delete");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedImages.size} selected images? This action cannot be undone.`
    );

    if (!confirmDelete) {
      console.log("[ImageManagement] Bulk delete cancelled");
      return;
    }

    console.log(`[ImageManagement] Starting bulk delete for ${selectedImages.size} selected images`);
    setDeletingState(true);
    
    try {
      const selectedImageNames = Array.from(selectedImages);
      let successCount = 0;
      let errorCount = 0;
      
      for (const imageName of selectedImageNames) {
        try {
          console.log(`[ImageManagement] Deleting image: ${imageName}`);
          await api.images.delete(imageName);
          console.log(`[ImageManagement] Successfully deleted: ${imageName}`);
          successCount++;
        } catch (error) {
          console.error(`[ImageManagement] Error deleting image: ${imageName}`, error);
          errorCount++;
        }
      }
      
      // Clear selection and refresh
      updateSelectedImages(new Set());
      fetchImages();
      
      if (errorCount > 0) {
        alert(`Deleted ${successCount} images successfully. ${errorCount} images failed to delete.`);
      } else {
        alert(`Successfully deleted ${successCount} images`);
      }
    } finally {
      setDeletingState(false);
    }
  };

  return (
    <div className="relative">
      {isRefreshing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 bg-white/80 rounded-2xl shadow-2xl">
            <FaSpinner className="animate-spin text-4xl text-red-500" />
            <span className="text-lg font-semibold text-gray-700">Loading...</span>
          </div>
        </div>
      )}

      {/* Analysis progress bar (non-blocking) */}
      {isAnalyzing && (
        <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-1/2 z-40 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Analyzing images...</span>
            <span className="text-sm font-medium text-gray-700">{analyzeProgress.completed}/{analyzeProgress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${analyzeProgress.total ? (analyzeProgress.completed / analyzeProgress.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
            Image Management
          </h2>
          <div className="flex items-center gap-3">
            {/* Select All Button */}
            <button
              onClick={handleSelectAll}
              className={`flex items-center px-4 py-2 rounded-xl text-white transition duration-200 ${
                selectedImages.size === images.length && images.length > 0
                  ? "bg-red-500 hover:bg-red-600 active:bg-red-700"
                  : "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
              }`}
            >
              {selectedImages.size === images.length && images.length > 0 ? (
                <>
                  <MdCheckBox className="h-4 w-4 mr-2" />
                  Deselect All
                </>
              ) : (
                <>
                  <MdCheckBoxOutlineBlank className="h-4 w-4 mr-2" />
                  Select All
                </>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative sort-dropdown">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center px-4 py-2 rounded-xl bg-brand-500 text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
              >
                <MdSort className="h-4 w-4 mr-2" />
                Sort by {getSortFieldDisplayName(sortField)}
                <MdKeyboardArrowDown className="h-4 w-4 ml-2" />
              </button>
              
              {showSortMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-navy-800 rounded-xl shadow-lg border border-gray-200 dark:border-navy-700 z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white border-b border-gray-200 dark:border-navy-700">
                      Sort by Field
                    </div>
                    <button
                      onClick={() => handleSortFieldChange("CreatedAt")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-navy-700 ${
                        sortField === "CreatedAt" ? "text-brand-500 font-medium" : "text-gray-700 dark:text-white"
                      }`}
                    >
                      Date
                    </button>
                    <button
                      onClick={() => handleSortFieldChange("ImageName")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-navy-700 ${
                        sortField === "ImageName" ? "text-brand-500 font-medium" : "text-gray-700 dark:text-white"
                      }`}
                    >
                      Name
                    </button>
                    <button
                      onClick={() => handleSortFieldChange("Status")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-navy-700 ${
                        sortField === "Status" ? "text-brand-500 font-medium" : "text-gray-700 dark:text-white"
                      }`}
                    >
                      Status
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Order Toggle */}
            <button
              onClick={handleSortToggle}
              className="flex items-center px-4 py-2 rounded-xl bg-brand-500 text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
            >
              <MdSort className="h-4 w-4 mr-2" />
              {getSortOrderDisplayName()}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center px-4 py-2 rounded-xl text-white transition duration-200 ${
                isRefreshing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
              }`}
            >
              <MdRefresh className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <UploadButton onUploadComplete={handleRefresh} />

        {/* Selection Info */}
        {selectedImages.size > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">
              {selectedImages.size} of {images.length} images selected
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {images.map((img, index) => (
            <NftCard
              key={index}
              title={img.ImageName}
              author={new Date(img.CreatedAt).toLocaleDateString()}
              size="—"
              image={img.ImagePath}
              status={img.Status}
              createAt={img.CreatedAt}
              isSelected={selectedImages.has(img.ImageName)}
              onSelect={handleImageSelect}
              onDelete={handleImageDelete}
              onAnalyze={handleImageAnalyze}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageManagement;