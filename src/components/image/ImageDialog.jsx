import { useEffect, useState } from "react";
import { IoIosCloseCircle } from "react-icons/io";
import { MdInfo, MdCalendarToday, MdStorage, MdCheckCircle, MdPending, MdError } from "react-icons/md";
import { FaPlayCircle, FaSpinner, FaTrash } from "react-icons/fa";

import DisplayStudentForm from "components/form/StudentForm";
import { api } from "config/api";

// Empty form as fallback
const emptyForm = {
  ho_va_ten: "",
  cccd: "",
  truong_thpt: "",
  lop: "",
  nganh_xet_tuyen: ["", "", ""],
  dien_thoai: "",
  dien_thoai_phu_huynh: "",
  tinh: "",
  email: "",
  mon_chon_cap_thpt: {
    "Ngu van": false,
    "Toan": false,
    "Lich su": false,
    "Hoa hoc": false,
    "Dia ly": false,
    "GDKT & PL": false,
    "Vat ly": false,
    "Sinh hoc": false,
    "Tin hoc": false,
    "Cong nghe": false,
    "Ngoai ngu": false,
  },
  mon_thi_tot_nghiep: {
    "Ngu van": false,
    "Toan": false,
    "Mon tu chon 1": "",
    "Mon tu chon 2": "",
  },
  phuong_thuc_xet_tuyen: {
    "Xet diem hoc ba THPT": false,
    "Xet diem thi tot nghiep THPT": false,
    "Xet diem thi DGNL": false,
    "Xet diem thi V-SAT": false,
    "Xet tuyen thang": false,
  },
};

const ImageDialog = ({ open, title, image, size, status, createAt, onClose, onAnalyze, onDelete, onRefresh }) => {
  const [formData, setFormData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Helper to reload extract info
  const reloadExtractInfo = async () => {
    try {
      const requestData = { title };
      const result = await api.formExtraction.getInfo(requestData);
      const formData = result?.analysis_result || result;
      setFormData(formData);
    } catch (err) {
      setFormData(null);
    }
  };

  useEffect(() => {
    if (!open || !title) return;
    reloadExtractInfo();
  }, [open, title]);

  const handleAnalyzeClick = async () => {
    console.log(`[ImageDialog] Starting analysis for image: ${title}`);
    setAnalyzing(true);
    
    try {
      const result = await api.formExtraction.extract({ 
        title,
        size,
        image,
        status,
        createAt
      });
      console.log(`[ImageDialog] Analysis completed for: ${title}`, result);
      
      // Call the parent callback if provided
      if (onAnalyze) {
        console.log(`[ImageDialog] Calling onAnalyze callback for: ${title}`);
        onAnalyze(result);
      }
      
      // Auto refresh after successful analysis
      if (onRefresh) {
        console.log(`[ImageDialog] Auto refreshing after analysis for: ${title}`);
        onRefresh();
      }
      // Reload extract info after analysis
      await reloadExtractInfo();
    } catch (error) {
      console.error(`[ImageDialog] Error during analysis for: ${title}`, error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      console.log(`[ImageDialog] Delete cancelled for: ${title}`);
      return;
    }

    console.log(`[ImageDialog] Starting deletion for image: ${title}`);
    setDeleting(true);
    try {
      const result = await api.images.delete(title);
      console.log(`[ImageDialog] Delete completed for: ${title}`, result);
      
      // Call the parent callback if provided
      if (onDelete) {
        console.log(`[ImageDialog] Calling onDelete callback for: ${title}`);
        onDelete(title);
      }

      // Close dialog after successful deletion
      onClose();
    } catch (error) {
      console.error(`[ImageDialog] Error during deletion for: ${title}`, error);
    } finally {
      setDeleting(false);
    }
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <h2 className="text-base font-semibold text-gray-700 flex-1 text-center">Image Analysis Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition duration-200 p-1 rounded-full hover:bg-red-50"
            aria-label="Close"
          >
            <IoIosCloseCircle className="text-xl" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-full">
          {/* Left: Image and Info */}
          <div className="lg:w-2/5 p-6 bg-gray-50">
            {/* Image Section */}
            <div className="mb-3">
              <div className="relative group">
                <img
                  src={image}
                  alt="Preview"
                  className="w-full max-h-[250px] object-contain rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-xl"></div>
              </div>
            </div>

            {/* Image Information (now includes Analysis Status) */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 w-full">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <MdInfo className="mr-2 text-red-500" />
                  Image Information
                </h3>
                <div className="space-y-3">
                  {/* Title */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Title:</span>
                    <span className="text-sm text-gray-800 font-semibold truncate max-w-48" title={title}>
                      {title}
                    </span>
                  </div>
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                      <span className="text-xs font-medium">{status}</span>
                    </div>
                  </div>
                  {/* Size */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Size:</span>
                    <div className="flex items-center space-x-1">
                      <MdStorage className="text-gray-400" />
                      <span className="text-sm text-gray-800 font-medium">{size} MB</span>
                    </div>
                  </div>
                  {/* Date */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Upload Date:</span>
                    <div className="flex items-center space-x-1">
                      <MdCalendarToday className="text-gray-400" />
                      <span className="text-sm text-gray-800 font-medium">{createAt}</span>
                    </div>
                  </div>
                  {/* Analysis Status (inline) */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Analysis Status:</span>
                    <div className="flex items-center space-x-2">
                      {formData ? (
                        <>
                          <MdCheckCircle className="text-green-500 text-xl" />
                          <span className="text-sm text-green-700 font-medium">Completed</span>
                        </>
                      ) : (
                        <>
                          <MdPending className="text-red-500 text-xl" />
                          <span className="text-sm text-red-700 font-medium">Loading...</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Actions</h3>
                <div className="flex space-x-3">
                  {/* Analyze Button */}
                  <button
                    onClick={handleAnalyzeClick}
                    disabled={analyzing}
                    className={`flex-1 flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      analyzing
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 shadow-md hover:shadow-lg"
                    }`}
                  >
                    {analyzing ? (
                      <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FaPlayCircle className="h-4 w-4 mr-2" />
                    )}
                    {analyzing ? "Analyzing..." : "Analyze"}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={handleDeleteClick}
                    disabled={deleting}
                    className={`flex-1 flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      deleting
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 active:from-gray-700 active:to-gray-800 shadow-md hover:shadow-lg"
                    }`}
                  >
                    {deleting ? (
                      <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FaTrash className="h-4 w-4 mr-2" />
                    )}
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:w-3/5 p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-pink-50">
                <h3 className="text-lg font-semibold text-gray-800">Extracted Form Data</h3>
                <p className="text-sm text-gray-600 mt-1">Student registration information extracted from the image</p>
              </div>
              <div className="p-4">
                <DisplayStudentForm data={formData || emptyForm} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageDialog;