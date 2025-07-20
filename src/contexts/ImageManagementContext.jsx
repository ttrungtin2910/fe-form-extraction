import React, { createContext, useContext, useState } from 'react';

const ImageManagementContext = createContext();

export const useImageManagement = () => {
  const context = useContext(ImageManagementContext);
  if (!context) {
    throw new Error('useImageManagement must be used within an ImageManagementProvider');
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
  const [analyzeProgress, setAnalyzeProgress] = useState({ completed: 0, total: 0 });

  const updateSelectedImages = (newSelectedImages) => {
    setSelectedImages(newSelectedImages);
  };

  const updateImages = (newImages) => {
    setImages(newImages);
  };

  const setAnalyzeHandler = (handler) => {
    setAnalyzeFunction(() => handler);
  };

  const setDeleteHandler = (handler) => {
    setDeleteFunction(() => handler);
  };

  const setAnalyzingState = (state) => {
    setIsAnalyzing(state);
  };

  const setDeletingState = (state) => {
    setIsDeleting(state);
  };

  const addAnalyzingImage = (imageName) => {
    setAnalyzingImages(prev => new Set([...prev, imageName]));
  };

  const removeAnalyzingImage = (imageName) => {
    setAnalyzingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageName);
      return newSet;
    });
  };

  const clearAnalyzingImages = () => {
    setAnalyzingImages(new Set());
  };

  const setAnalyzeProgressState = (completed, total) => {
    setAnalyzeProgress({ completed, total });
  };

  const resetAnalyzeProgress = () => {
    setAnalyzeProgress({ completed: 0, total: 0 });
  };

  const value = {
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
  };

  return (
    <ImageManagementContext.Provider value={value}>
      {children}
    </ImageManagementContext.Provider>
  );
}; 