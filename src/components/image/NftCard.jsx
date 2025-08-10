import { useState, useEffect } from "react";
import Card from "components/image";
import ImageDialog from "components/image/ImageDialog";

import { FiMoreHorizontal, FiEye } from "react-icons/fi";
import { FaPlayCircle, FaSpinner, FaTrash } from "react-icons/fa";
import { MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";
import { MdStorage, MdCalendarToday, MdCheckCircle, MdPending, MdInfo, MdError } from "react-icons/md";
import { api } from "config/api";
import { useImageManagement } from "contexts/ImageManagementContext";
import { useToast, useConfirm } from "components/common/ToastProvider";

const NftCard = ({ 
  title, 
  size, 
  image, 
  extra, 
  status, 
  createAt, 
  folderPath,
  isSelected, 
  onSelect, 
  onDelete,
  onAnalyze,
  onRefresh 
}) => {
  const [heart, setHeart] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Local loading state for this specific image
  const isAnalyzing = loading;

  const toast = useToast();
  const confirmModal = useConfirm();

  const displaySize = typeof size === 'number' ? `${size.toFixed(2)} MB` : size;
  const parseDate = (str) => {
    if (!str) return "";
    if (str.includes("T")) return new Date(str);
    // Expect format YYYYMMDD_HHMMSS
    const [datePart, timePart] = str.split("_");
    if (datePart && timePart) {
      const year = datePart.slice(0,4);
      const month = datePart.slice(4,6);
      const day = datePart.slice(6,8);
      const hour = timePart.slice(0,2);
      const minute = timePart.slice(2,4);
      const second = timePart.slice(4,6);
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    }
    return new Date(str);
  };
  const displayDate = (()=>{try{return parseDate(createAt).toLocaleString();}catch(e){return createAt;}})();

  const handleAnalyzeClick = async () => {
    console.log(`[NftCard] Starting analysis for image: ${title}`);
    setLoading(true);
    
    const sizeVal = typeof size === 'number' ? size : 0;
    
    try {
      const queueResp = await api.queue.extract({
        ImageName: title,
        Size: sizeVal,
        ImagePath: image,
        Status: status,
        CreatedAt: createAt,
        FolderPath: folderPath || ""
      });
      const taskId = queueResp.task_id;
      // poll for completion
      let attempts = 0;
      const poll = async () => {
        const data = await api.queue.taskStatus(taskId);
        if (data.state === 'SUCCESS') {
          if (onAnalyze) onAnalyze(data.result);
          if (onRefresh) onRefresh();
          setLoading(false);
          return;
        } else if (data.state === 'FAILURE') {
          console.error('Task failed', data.error);
          setLoading(false);
          return;
        } else if (attempts < 120) { // up to ~2 minutes (1s interval)
          attempts++;
          setTimeout(poll, 1000);
        } else {
          setLoading(false);
        }
      };
      poll();
    } catch (error) {
      console.error(`[NftCard] Error during analysis for: ${title}`, error);
      setLoading(false);
    } 
  };

  const handleDeleteClick = async () => {
    const ok = await confirmModal({title:"Delete image",message:`Delete \"${title}\"?`,type:"danger",confirmText:"Delete"});
    if(!ok) return;

    console.log(`[NftCard] Starting deletion for image: ${title}`);
    setDeleteLoading(true);
    try {
      const result = await api.images.delete(title);
      toast.success("Image deleted");
      
      // Call the parent callback if provided
      if (onDelete) {
        console.log(`[NftCard] Calling onDelete callback for: ${title}`);
        onDelete(title);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSelect = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (onSelect) {
      onSelect(title, !isSelected);
    }
  };

  const handleImageClick = () => {
    console.log(`[NftCard] Opening dialog for image: ${title}`);
    setShowModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <MdCheckCircle className="text-green-500" />;
      case "Uploaded":
        return <MdPending className="text-red-500" />;
      case "Verify":
        return <MdInfo className="text-purple-500" />;
      case "Synced":
        return <MdInfo className="text-orange-500" />;
      default:
        return <MdError className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Uploaded":
        return "bg-red-100 text-red-800 border-red-200";
      case "Verify":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Synced":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card
      extra={`flex flex-col w-full h-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group ${extra}`}
    >
      <div className="h-full w-full">
        {/* Image Container */}
        <div className="relative w-full h-48 overflow-hidden bg-gray-100">
          <img
            src={image}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
            alt={title}
            onClick={handleImageClick}
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center pointer-events-none">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white bg-opacity-90 rounded-full p-3">
                <FiEye className="text-gray-700 text-xl" />
              </div>
            </div>
          </div>
          
          {/* Selection Checkbox */}
          <button
            onClick={handleSelect}
            className={`absolute top-3 left-3 flex items-center justify-center rounded-full p-2 shadow-lg transition-all duration-300 transform hover:scale-110 z-10 ${
              isSelected 
                ? "bg-red-500 text-white shadow-red-200" 
                : "bg-white bg-opacity-90 backdrop-blur-sm text-gray-400 hover:bg-white hover:text-red-500"
            }`}
          >
            <div className="relative">
              {isSelected ? (
                <div className="flex items-center justify-center">
                  <svg 
                    className="w-5 h-5 animate-pulse" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Status Badge */}
          <div className="absolute top-3 right-3 z-10">
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border ${getStatusColor(status)} shadow-sm`}>
              {getStatusIcon(status)}
              <span className="text-xs font-medium">{status}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-gray-800 truncate" title={title}>
              {title}
            </h3>
          </div>

          {/* Info Row */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <MdStorage className="text-gray-400" />
              <span className="font-medium">{displaySize}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MdCalendarToday className="text-gray-400" />
              <span className="font-medium">{displayDate}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-2">
            {/* Analyze Button */}
            <button
              onClick={handleAnalyzeClick}
              disabled={isAnalyzing}
              className={`flex-1 flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                isAnalyzing
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 shadow-md hover:shadow-lg"
              }`}
            >
              {isAnalyzing ? (
                <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FaPlayCircle className="h-4 w-4 mr-2" />
              )}
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </button>

            {/* Delete Button */}
            <button
              onClick={handleDeleteClick}
              disabled={deleteLoading}
              className={`flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                deleteLoading
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 active:from-gray-700 active:to-gray-800 shadow-md hover:shadow-lg"
              }`}
            >
              {deleteLoading ? (
                <FaSpinner className="h-4 w-4 animate-spin" />
              ) : (
                <FaTrash className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <ImageDialog
        open={showModal}
        image={image}
        title={title}
        size={size}
        status={status}
        createAt={createAt}
        folderPath={folderPath}
        onClose={() => setShowModal(false)}
        onAnalyze={onAnalyze}
        onDelete={onDelete}
        onRefresh={onRefresh}
      />
    </Card>
  );
};

export default NftCard;
