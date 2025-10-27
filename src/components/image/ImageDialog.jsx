import { useEffect, useState } from "react";
import { IoIosCloseCircle } from "react-icons/io";
import { MdInfo, MdCalendarToday, MdStorage, MdCheckCircle, MdPending, MdError, MdZoomIn, MdZoomOut, MdFullscreen } from "react-icons/md";
import { FaPlayCircle, FaSpinner, FaTrash } from "react-icons/fa";

import DisplayStudentForm from "components/form/StudentForm";
import { api } from "config/api";
import { useToast, useConfirm } from "components/common/ToastProvider";
import { POLLING_CONFIG } from "../../config/polling";
import { translateStatus } from "utils/statusTranslator";

// Image Zoom Viewer Component
const ImageZoomViewer = ({ image, title }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 1));
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <div className="mb-3 relative">
        <div 
          className="relative group overflow-hidden rounded-xl shadow-lg bg-gray-100"
          style={{ height: '400px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={image}
            alt="Preview"
            className="w-full h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            draggable={false}
          />
          
          {/* Zoom Controls */}
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Thu nhỏ"
            >
              <MdZoomOut className="text-xl text-gray-700" />
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-all text-xs font-medium text-gray-700"
              title="Đặt lại"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Phóng to"
            >
              <MdZoomIn className="text-xl text-gray-700" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-all"
              title="Toàn màn hình"
            >
              <MdFullscreen className="text-xl text-gray-700" />
            </button>
          </div>

          {/* Zoom Hint */}
          {zoom === 1 && (
            <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/60 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              💡 Click các nút bên dưới để phóng to/thu nhỏ
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={toggleFullscreen}
        >
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
          >
            <IoIosCloseCircle className="text-3xl" />
          </button>
          <div 
            className="w-full h-full flex items-center justify-center p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={image}
              alt={title}
              className="max-w-full max-h-full object-contain"
              style={{ cursor: 'zoom-in' }}
            />
          </div>
        </div>
      )}
    </>
  );
};

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

const ImageDialog = ({ open, title, image, size, status, createAt, folderPath, onClose, onAnalyze, onDelete, onRefresh }) => {
  const [formData, setFormData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const toast = useToast();
  const confirmModal = useConfirm();

  // Helper to reload extract info
  const reloadExtractInfo = async () => {
    try {
  // Backend chấp nhận 'title' hoặc 'ImageName'; ưu tiên dùng 'title'
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
      const queueResp = await api.queue.extract({ 
        ImageName: title,
        Size: typeof size === 'number' ? size : 0,
        ImagePath: image,
        Status: status,
        CreatedAt: createAt,
        FolderPath: folderPath || ""
      });
      const taskId = queueResp.task_id;
      let attempts = 0;
      const poll = async () => {
        const data = await api.queue.taskStatus(taskId);
        if (data.state === 'SUCCESS') {
          if (onAnalyze) onAnalyze(data.result);
          if (onRefresh) onRefresh();
          await reloadExtractInfo();
          setAnalyzing(false);
          return;
        } else if (data.state === 'FAILURE') {
          console.error('Task failed', data.error);
          setAnalyzing(false);
          return;
        } else if (attempts < 120) {
          attempts++;
          setTimeout(poll, POLLING_CONFIG.TASK_STATUS_INTERVAL);
        } else {
          setAnalyzing(false);
        }
      };
      poll();
    } catch (error) {
      console.error(`[ImageDialog] Error during analysis for: ${title}`, error);
      setAnalyzing(false);
    } 
  };

  const handleDeleteClick = async () => {
    const ok = await confirmModal({title:"Xóa hình ảnh",message:`Xóa \"${title}\"?`,type:"danger",confirmText:"Xóa"});
    if(!ok) return;

    console.log(`[ImageDialog] Starting deletion for image: ${title}`);
    setDeleting(true);
    try {
      const result = await api.images.delete(title);
      toast.success("Đã xóa hình ảnh");
      
      // Call the parent callback if provided
      if (onDelete) {
        console.log(`[ImageDialog] Calling onDelete callback for: ${title}`);
        onDelete(title);
      }

      // Close dialog after successful deletion
      onClose();
    } catch (error) {
      toast.error(error.message);
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
      case "Processing":
        return <MdPending className="text-orange-500 animate-pulse" />;
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
      case "Processing":
        return "bg-orange-100 text-orange-800 border-orange-200";
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
        className="relative bg-white rounded-2xl shadow-2xl max-w-7xl w-full mx-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button - Optimized */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800">Chi tiết phân tích hình ảnh</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition duration-200 p-2 rounded-full hover:bg-red-50"
            aria-label="Close"
          >
            <IoIosCloseCircle className="text-2xl" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Left: Image and Info */}
          <div className="lg:w-[45%] p-5 bg-gray-50 overflow-y-auto">
            {/* Image Section with Zoom */}
            <ImageZoomViewer image={image} title={title} />

            {/* Image Information (now includes Analysis Status) */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 w-full">
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                  <MdInfo className="mr-2 text-red-500" />
                  Thông tin hình ảnh
                </h3>
                <div className="space-y-2.5">
                  {/* Title */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Tên file:</span>
                    <span className="text-sm text-gray-800 font-semibold truncate max-w-48" title={title}>
                      {title}
                    </span>
                  </div>
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Trạng thái:</span>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                      <span className="text-xs font-medium">{translateStatus(status)}</span>
                    </div>
                  </div>
                  {/* Size */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Kích thước:</span>
                    <div className="flex items-center space-x-1">
                      <MdStorage className="text-gray-400" />
                      <span className="text-sm text-gray-800 font-medium">{size} MB</span>
                    </div>
                  </div>
                  {/* Date */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Ngày tải lên:</span>
                    <div className="flex items-center space-x-1">
                      <MdCalendarToday className="text-gray-400" />
                      <span className="text-sm text-gray-800 font-medium">{createAt}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Thao tác</h3>
                <div className="flex space-x-3">
                  {/* Analyze Button */}
                  {(() => {
                    const isProcessing = analyzing || status === 'Processing';
                    return (
                      <button
                        onClick={handleAnalyzeClick}
                        disabled={isProcessing}
                        className={`flex-1 flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                          isProcessing
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 shadow-md hover:shadow-lg"
                        }`}
                      >
                        {isProcessing ? (
                          <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <FaPlayCircle className="h-4 w-4 mr-2" />
                        )}
                        {isProcessing ? 'Đang xử lý' : 'Phân tích'}
                      </button>
                    );
                  })()}

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
                    {deleting ? "Đang xóa..." : "Xóa"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:w-[55%] p-5 overflow-y-auto flex flex-col">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-pink-50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Dữ liệu đã trích xuất</h3>
                  <p className="text-sm text-gray-600 mt-1">Thông tin đăng ký của sinh viên được trích xuất từ hình ảnh</p>
                </div>
                {formData && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isEditing
                        ? "bg-gray-600 text-white hover:bg-gray-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <MdCheckCircle className="text-lg" />
                        Lưu
                      </>
                    ) : (
                      <>
                        <MdInfo className="text-lg" />
                        Chỉnh sửa
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="p-5 overflow-y-auto flex-1">
                <DisplayStudentForm data={formData || emptyForm} isEditing={isEditing} onDataChange={setFormData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageDialog;