/* eslint-disable */

import {
  XMarkIcon as HiX,
  PlayIcon as FaPlayCircle,
  TrashIcon as FaTrash,
  ArrowPathIcon as FaSpinner,
  ArrowRightOnRectangleIcon as MdLogout,
} from "@heroicons/react/24/solid";
import Links from "./components/Links";
import { useNavigate } from "react-router-dom";

import routes from "routes.js";
import cosariLogo from "assets/img/logo/VLU_Logo_Final_VLU_logo ngang_Vie_RedWhite.png";
import { useImageManagement } from "contexts/ImageManagementContext";
import { useAuth } from "contexts/AuthContext";

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const {
    selectedImages,
    analyzeFunction,
    deleteFunction,
    isAnalyzing,
    isDeleting,
    analyzeProgress,
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

  const handleLogout = () => {
    logout();
    navigate("/auth/sign-in");
  };

  return (
    <div
      className={`sm:none duration-175 linear fixed !z-50 m-4 flex min-h-[calc(100vh-32px)] w-[300px] flex-col rounded-3xl border border-white/10 bg-white/5 pb-10 shadow-2xl shadow-white/5 backdrop-blur-xl transition-all md:!z-50 lg:!z-50 xl:!z-50 ${
        open ? "translate-x-0" : "-translate-x-96 xl:translate-x-0"
      }`}
    >
      <span
        className="absolute right-4 top-4 z-10 block cursor-pointer text-white xl:hidden"
        onClick={onClose}
      >
        <HiX className="h-6 w-6" />
      </span>

      <div className={`mx-[56px] mt-8 flex items-center`}>
        <div className="ml-1 mt-1 flex items-center">
          <img src={cosariLogo} alt="COSARI Logo" className="h-12 w-auto" />
        </div>
      </div>
      <div className="mx-6 mb-7 mt-6 h-px bg-white/20" />
      {/* Nav item */}

      <ul className="mb-auto pt-1">
        <Links routes={routes} />
      </ul>

      {/* Action Buttons */}
      <div className="mb-4 px-4">
        <div className="space-y-3">
          {/* Analyze Selected Button */}
          <button
            onClick={handleAnalyzeSelected}
            disabled={selectedImages.size === 0 || isAnalyzing}
            className={`text-black group relative flex w-full items-center justify-center overflow-hidden rounded-xl px-4 py-3 font-semibold transition duration-200 ${
              selectedImages.size === 0 || isAnalyzing
                ? "cursor-not-allowed bg-white/20 text-white/50"
                : "bg-white shadow-lg hover:bg-white/90 active:bg-white/80"
            }`}
          >
            {selectedImages.size > 0 && !isAnalyzing && (
              <div className="from-transparent to-transparent absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r via-white/30 transition-transform duration-1000 group-hover:translate-x-full" />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isAnalyzing ? (
                <>
                  <FaSpinner className="h-4 w-4 animate-spin" />
                  <span>
                    Đang xử lý... ({analyzeProgress.completed}/
                    {analyzeProgress.total})
                  </span>
                </>
              ) : (
                <>
                  <FaPlayCircle className="h-4 w-4" />
                  <span>Phân tích đã chọn ({selectedImages.size})</span>
                </>
              )}
            </span>
          </button>

          {/* Delete Selected Button */}
          <button
            onClick={handleDeleteSelected}
            disabled={selectedImages.size === 0 || isDeleting}
            className={`group relative flex w-full items-center justify-center rounded-xl border border-white/20 px-4 py-3 backdrop-blur-sm transition duration-200 ${
              selectedImages.size === 0 || isDeleting
                ? "cursor-not-allowed bg-white/10 text-white/50"
                : "border-white/30 bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {isDeleting ? (
                <>
                  <FaSpinner className="h-4 w-4 animate-spin" />
                  <span>Đang xóa...</span>
                </>
              ) : (
                <>
                  <FaTrash className="h-4 w-4" />
                  <span>Xóa đã chọn ({selectedImages.size})</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-white/5 p-3 px-4 backdrop-blur-sm">
          <p className="text-center text-xs text-white/60">Đã đăng nhập</p>
          <p className="mt-1 text-center text-sm font-semibold text-white">
            {user.username}
          </p>
        </div>
      )}

      {/* Logout Button */}
      <div className="mb-4 px-4">
        <div className="border-t border-white/20 pt-4">
          <button
            onClick={handleLogout}
            className="group relative flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white backdrop-blur-sm transition duration-200 hover:border-white/30 hover:bg-white/20"
          >
            <MdLogout className="mr-2 h-5 w-5" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Nav item end */}
    </div>
  );
};

export default Sidebar;
