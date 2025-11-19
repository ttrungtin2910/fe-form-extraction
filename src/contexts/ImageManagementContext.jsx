import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

const ImageManagementContext = createContext();

export const useImageManagement = () => {
  const context = useContext(ImageManagementContext);
  if (!context) {
    throw new Error(
      "useImageManagement must be used within an ImageManagementProvider"
    );
  }
  return context;
};

export const ImageManagementProvider = ({ children }) => {
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [images, setImages] = useState([]);
  const [analyzeFunction, setAnalyzeFunction] = useState(null);
  const [deleteFunction, setDeleteFunction] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [analyzingImages, setAnalyzingImages] = useState(new Set());
  const [analyzeProgress, setAnalyzeProgress] = useState({
    completed: 0,
    total: 0,
  });

  // Memoize all functions to prevent infinite re-renders
  const updateSelectedImages = useCallback((newSelectedImages) => {
    setSelectedImages(newSelectedImages);
  }, []);

  const updateImages = useCallback((newImages) => {
    setImages(newImages);
  }, []);

  const setAnalyzeHandler = useCallback((handler) => {
    setAnalyzeFunction(() => handler);
  }, []);

  const setDeleteHandler = useCallback((handler) => {
    setDeleteFunction(() => handler);
  }, []);

  const setAnalyzingState = useCallback((state) => {
    setIsAnalyzing(state);
  }, []);

  const setDeletingState = useCallback((state) => {
    setIsDeleting(state);
  }, []);

  const addAnalyzingImage = useCallback((imageName) => {
    setAnalyzingImages((prev) => new Set([...prev, imageName]));
  }, []);

  const removeAnalyzingImage = useCallback((imageName) => {
    setAnalyzingImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(imageName);
      return newSet;
    });
  }, []);

  const clearAnalyzingImages = useCallback(() => {
    setAnalyzingImages(new Set());
  }, []);

  const setAnalyzeProgressState = useCallback((completed, total) => {
    setAnalyzeProgress({ completed, total });
  }, []);

  const resetAnalyzeProgress = useCallback(() => {
    setAnalyzeProgress({ completed: 0, total: 0 });
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  // Important: Set objects and function objects are excluded from dependencies
  // because they cannot be reliably compared and would cause infinite loops
  const value = useMemo(
    () => ({
      selectedImages,
      images,
      updateSelectedImages,
      updateImages,
      setAnalyzeHandler,
      setDeleteHandler,
      setAnalyzingState,
      setDeletingState,
      addAnalyzingImage,
      removeAnalyzingImage,
      clearAnalyzingImages,
      setAnalyzeProgressState,
      resetAnalyzeProgress,
      analyzeFunction,
      deleteFunction,
      isAnalyzing,
      isDeleting,
      analyzingImages,
      analyzeProgress,
    }),
    // Only include primitive values and sizes - exclude Set objects and function objects
    // This prevents infinite loops while still updating when meaningful values change
    [
      selectedImages.size,
      analyzingImages.size,
      images,
      updateSelectedImages,
      updateImages,
      setAnalyzeHandler,
      setDeleteHandler,
      setAnalyzingState,
      setDeletingState,
      addAnalyzingImage,
      removeAnalyzingImage,
      clearAnalyzingImages,
      setAnalyzeProgressState,
      resetAnalyzeProgress,
      // analyzeFunction and deleteFunction excluded - they are function objects that change frequently
      isAnalyzing,
      isDeleting,
      analyzeProgress.completed,
      analyzeProgress.total,
    ]
  );

  return (
    <ImageManagementContext.Provider value={value}>
      {children}
    </ImageManagementContext.Provider>
  );
};
