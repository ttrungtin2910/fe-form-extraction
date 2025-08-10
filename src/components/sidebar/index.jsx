/* eslint-disable */

import { HiX } from "react-icons/hi";
import { FaPlayCircle, FaTrash, FaSpinner } from "react-icons/fa";
import Links from "./components/Links";

import SidebarCard from "components/sidebar/componentsrtl/SidebarCard";
import routes from "routes.js";
import cosariLogo from "assets/img/logo/COSARI.png";
import { useImageManagement } from "contexts/ImageManagementContext";

const Sidebar = ({ open, onClose }) => {
  const { 
    selectedImages, 
    analyzeFunction, 
    deleteFunction, 
    isAnalyzing, 
    isDeleting,
    analyzeProgress
  } = useImageManagement();
  
  const handleAnalyzeSelected = () => {
    if (analyzeFunction) {
      analyzeFunction();
    }
  };

  const handleDeleteSelected = () => {
    if (deleteFunction) {
      deleteFunction();
    }
  };

  return (
    <div
      className={`sm:none duration-175 linear fixed !z-50 flex min-h-full flex-col bg-white pb-10 shadow-2xl shadow-white/5 transition-all dark:!bg-navy-800 dark:text-white md:!z-50 lg:!z-50 xl:!z-0 ${
        open ? "translate-x-0" : "-translate-x-96"
      }`}
    >
      <span
        className="absolute top-4 right-4 block cursor-pointer xl:hidden"
        onClick={onClose}
      >
        <HiX />
      </span>

      <div className={`mx-[56px] mt-[50px] flex items-center`}>
        <div className="mt-1 ml-1 flex items-center">
          <img 
            src={cosariLogo} 
            alt="COSARI Logo" 
            className="h-12 w-auto"
          />
        </div>
      </div>
      <div class="mt-[58px] mb-7 h-px bg-gray-300 dark:bg-white/30" />
      {/* Nav item */}

      <ul className="mb-auto pt-1">
        <Links routes={routes} />
      </ul>

      {/* Action Buttons */}
      <div className="px-4 mb-4">
        <div className="space-y-3">
          {/* Analyze Selected Button */}
          <button
            onClick={handleAnalyzeSelected}
            disabled={selectedImages.size === 0 || isAnalyzing}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-xl text-white transition duration-200 ${
              selectedImages.size === 0 || isAnalyzing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 active:bg-green-700"
            }`}
          >
            {isAnalyzing ? (
              <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FaPlayCircle className="h-4 w-4 mr-2" />
            )}
            {isAnalyzing 
              ? `Processing... (${analyzeProgress.completed}/${analyzeProgress.total})`
              : `Analyze Selected (${selectedImages.size})`
            }
          </button>

          {/* Delete Selected Button */}
          <button
            onClick={handleDeleteSelected}
            disabled={selectedImages.size === 0 || isDeleting}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-xl text-white transition duration-200 ${
              selectedImages.size === 0 || isDeleting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600 active:bg-red-700"
            }`}
          >
            {isDeleting ? (
              <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FaTrash className="h-4 w-4 mr-2" />
            )}
            {isDeleting ? "Deleting..." : `Delete Selected (${selectedImages.size})`}
          </button>
        </div>
      </div>

      {/* Free Horizon Card */}
      <div className="flex justify-center">
        <SidebarCard />
      </div>

      {/* Nav item end */}
    </div>
  );
};

export default Sidebar;
