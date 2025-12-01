import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  XCircleIcon as IoIosCloseCircle,
  InformationCircleIcon as MdInfo,
  CalendarIcon as MdCalendarToday,
  ServerIcon as MdStorage,
  CheckCircleIcon as MdCheckCircle,
  ClockIcon as MdPending,
  ExclamationCircleIcon as MdError,
  MagnifyingGlassPlusIcon as MdZoomIn,
  MagnifyingGlassMinusIcon as MdZoomOut,
  ArrowsPointingOutIcon as MdFullscreen,
  PlayIcon as FaPlayCircle,
  TrashIcon as FaTrash,
} from "@heroicons/react/24/solid";

import DisplayStudentForm from "components/form/StudentForm";
import { api } from "config/api";
import { useToast, useConfirm } from "components/common/ToastProvider";
import { POLLING_CONFIG } from "../../config/polling";
import { translateStatus } from "utils/statusTranslator";
import Button from "components/button/Button";
import BlurText from "components/animations/BlurText";

// Custom styles for zoom slider
const sliderStyles = `
  .zoom-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 8px;
    border-radius: 4px;
    outline: none;
    transition: all 0.2s;
  }
  
  .zoom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.2s;
  }
  
  .zoom-slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
  
  .zoom-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.2s;
  }
  
  .zoom-slider::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
`;

// Image Zoom Viewer Component
const ImageZoomViewer = ({ image, title }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  const handleZoomChange = (newZoom) => {
    const zoomValue = parseFloat(newZoom);
    const prevZoom = zoom;
    setZoom(zoomValue);
    // Reset position when zoom changes significantly
    if (Math.abs(zoomValue - prevZoom) > 0.5) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    // Don't handle drag if clicking on zoom controls
    if (e.target.closest("[data-zoom-controls]")) {
      return;
    }
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();

    // Calculate zoom based on wheel direction
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newZoom = Math.min(Math.max(zoom + delta, 1), 4);

    if (newZoom !== zoom) {
      setZoom(newZoom);

      // Adjust position to zoom towards center
      if (newZoom > 1) {
        const zoomFactor = newZoom / zoom;
        setPosition({
          x: position.x * zoomFactor,
          y: position.y * zoomFactor,
        });
      } else {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      {/* Inject custom slider styles */}
      <style>{sliderStyles}</style>
      <motion.div
        className="relative mb-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div
          className="group relative overflow-hidden rounded-2xl border border-white/20 bg-gray-800/60 shadow-xl backdrop-blur-sm"
          style={{ height: "400px" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div
            ref={containerRef}
            className="absolute inset-0"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              ref={imgRef}
              src={image}
              alt="Preview"
              className="pointer-events-auto"
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                height: "auto",
                width: "auto",
                objectFit: "contain",
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                cursor:
                  zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
                willChange: "transform",
              }}
              draggable={false}
              onLoad={(e) => {
                // Store natural dimensions for proper scaling
                const img = e.target;
                if (imgRef.current && containerRef.current) {
                  const container = containerRef.current;
                  const containerWidth = container.clientWidth;
                  const containerHeight = container.clientHeight;

                  // Calculate fit size
                  const imgAspect = img.naturalWidth / img.naturalHeight;
                  const containerAspect = containerWidth / containerHeight;

                  let fitWidth, fitHeight;
                  if (imgAspect > containerAspect) {
                    fitWidth = containerWidth;
                    fitHeight = containerWidth / imgAspect;
                  } else {
                    fitHeight = containerHeight;
                    fitWidth = containerHeight * imgAspect;
                  }

                  // Set explicit dimensions for proper scaling
                  img.style.width = `${fitWidth}px`;
                  img.style.height = `${fitHeight}px`;
                  img.style.maxWidth = "none";
                  img.style.maxHeight = "none";
                }
              }}
            />
          </div>

          {/* Zoom Controls */}
          <div
            data-zoom-controls
            className="absolute bottom-4 left-4 right-4 z-10 flex flex-col items-center gap-3 opacity-100"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            {/* Zoom Slider */}
            <motion.div
              className="bg-black/40 flex items-center gap-3 rounded-2xl border border-white/20 px-4 py-3 backdrop-blur-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Zoom Out Icon */}
              <MdZoomOut className="h-5 w-5 flex-shrink-0 text-white/70" />

              {/* Zoom Slider */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => handleZoomChange(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseMove={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="zoom-slider flex-1 cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #ffffff 0%, #ffffff ${
                      ((zoom - 1) / 3) * 100
                    }%, rgba(255,255,255,0.3) ${
                      ((zoom - 1) / 3) * 100
                    }%, rgba(255,255,255,0.3) 100%)`,
                  }}
                />

                {/* Zoom Level Display */}
                <motion.button
                  onClick={handleReset}
                  className="min-w-[60px] rounded-lg bg-white/20 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-white/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Đặt lại zoom"
                >
                  {Math.round(zoom * 100)}%
                </motion.button>
              </div>

              {/* Zoom In Icon */}
              <MdZoomIn className="h-5 w-5 flex-shrink-0 text-white/70" />

              {/* Fullscreen Button */}
              <div className="mx-2 h-8 w-px bg-white/20" />
              <motion.button
                onClick={toggleFullscreen}
                className="rounded-lg bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Toàn màn hình"
              >
                <MdFullscreen className="h-5 w-5" />
              </motion.button>
            </motion.div>
          </div>

          {/* Zoom Hint */}
          {zoom === 1 && (
            <motion.div
              className="bg-black/60 absolute left-4 top-4 rounded-xl border border-white/20 px-3 py-1.5 text-xs text-white backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 1 }}
            >
              💡 Dùng thanh trượt, con lăn chuột hoặc kéo thả để zoom và di
              chuyển
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Fullscreen Modal */}
      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isFullscreen && (
              <motion.div
                className="fixed inset-0 !z-[10000] flex items-center justify-center backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={toggleFullscreen}
              >
                <div className="bg-black/95 absolute inset-0" />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Button
                    onClick={toggleFullscreen}
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                  >
                    <IoIosCloseCircle className="h-8 w-8" />
                  </Button>
                </motion.div>
                <div
                  className="flex h-full w-full items-center justify-center p-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.img
                    src={image}
                    alt={title}
                    className="max-h-full max-w-full object-contain"
                    style={{ cursor: "zoom-in" }}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
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
    Toan: false,
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
    Toan: false,
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

const ImageDialog = ({
  open,
  title,
  image,
  size,
  status,
  createAt,
  folderPath,
  uploadBy,
  onClose,
  onAnalyze,
  onDelete,
  onRefresh,
}) => {
  const [formData, setFormData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const toast = useToast();
  const confirmModal = useConfirm();

  // Use ref to track if we've already loaded data for this title
  const loadedTitleRef = useRef(null);
  const isLoadingRef = useRef(false);

  // Helper to reload extract info
  const reloadExtractInfo = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) return;

    if (!title) {
      setFormData(null);
      return;
    }

    // If we've already loaded this title, don't reload
    if (loadedTitleRef.current === title) {
      return;
    }

    isLoadingRef.current = true;
    try {
      // Backend chấp nhận 'title' hoặc 'ImageName'; ưu tiên dùng 'title'
      const requestData = { title };
      const result = await api.formExtraction.getInfo(requestData);
      const formData = result?.analysis_result || result;
      setFormData(formData);
      loadedTitleRef.current = title;
    } catch (err) {
      setFormData(null);
      loadedTitleRef.current = null;
    } finally {
      isLoadingRef.current = false;
    }
  }, [title]);

  useEffect(() => {
    if (!open || !title) {
      // Reset when dialog closes
      if (!open) {
        loadedTitleRef.current = null;
        setFormData(null);
      }
      return;
    }
    reloadExtractInfo();
  }, [open, title, reloadExtractInfo]);

  const handleAnalyzeClick = async () => {
    console.log(`[ImageDialog] Starting analysis for image: ${title}`);
    setAnalyzing(true);

    try {
      const queueResp = await api.queue.extract({
        ImageName: title,
        Size: typeof size === "number" ? size : 0,
        ImagePath: image,
        Status: status,
        CreatedAt: createAt,
        FolderPath: folderPath || "",
      });
      const taskId = queueResp.task_id;
      let attempts = 0;
      const poll = async () => {
        const data = await api.queue.taskStatus(taskId);
        if (data.state === "SUCCESS") {
          if (onAnalyze) onAnalyze(data.result);
          if (onRefresh) onRefresh();
          await reloadExtractInfo();
          setAnalyzing(false);
          return;
        } else if (data.state === "FAILURE") {
          console.error("Task failed", data.error);
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
    const ok = await confirmModal({
      title: "Xóa hình ảnh",
      message: `Xóa "${title}"?`,
      type: "danger",
      confirmText: "Xóa",
    });
    if (!ok) return;

    console.log(`[ImageDialog] Starting deletion for image: ${title}`);
    setDeleting(true);
    try {
      await api.images.delete(title);
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
        return <MdCheckCircle className="h-5 w-5 text-green-500" />;
      case "Uploaded":
        return <MdPending className="h-5 w-5 text-red-500" />;
      case "Processing":
        return <MdPending className="h-5 w-5 animate-pulse text-orange-500" />;
      case "Verify":
        return <MdInfo className="h-5 w-5 text-purple-500" />;
      case "Synced":
        return <MdInfo className="h-5 w-5 text-orange-500" />;
      default:
        return <MdError className="h-5 w-5 text-gray-500" />;
    }
  };

  // Removed unused getStatusColor function - status colors are handled inline

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const dialogVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.5,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <>
      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 !z-[9999] flex items-center justify-center backdrop-blur-md"
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={onClose}
              >
                {/* Dark overlay with glassmorphism */}
                <div className="bg-black/60 absolute inset-0" />

                <motion.div
                  className="relative mx-4 flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-gray-800/50 shadow-2xl backdrop-blur-xl"
                  variants={dialogVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header with close button - Glassmorphism style */}
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between border-b border-white/10 bg-gray-800/10 px-6 py-4 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm"
                      >
                        <MdInfo className="h-5 w-5 text-white" />
                      </motion.div>
                      <BlurText
                        text="Chi tiết phân tích hình ảnh"
                        animateBy="words"
                        direction="top"
                        delay={100}
                        className="text-xl font-bold leading-normal text-white"
                      />
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      <Button
                        onClick={onClose}
                        variant="ghost"
                        size="icon"
                        className="rounded-full border border-white/20 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                        aria-label="Close"
                      >
                        <IoIosCloseCircle className="h-6 w-6" />
                      </Button>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="flex flex-1 flex-col overflow-hidden lg:flex-row"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {/* Left: Image and Info */}
                    <motion.div
                      variants={itemVariants}
                      className="custom-scrollbar overflow-y-auto p-6 lg:w-[45%]"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(255,255,255,0.3) transparent",
                      }}
                    >
                      {/* Image Section with Zoom */}
                      <motion.div variants={itemVariants}>
                        <ImageZoomViewer image={image} title={title} />
                      </motion.div>

                      {/* Image Information (now includes Analysis Status) */}
                      <div className="mt-4 space-y-4">
                        <motion.div
                          variants={itemVariants}
                          className="w-full rounded-2xl border border-white/20 bg-gray-800/30 p-5 shadow-lg backdrop-blur-sm"
                        >
                          <h3 className="mb-4 flex items-center text-base font-semibold text-white">
                            <MdInfo className="mr-2 h-5 w-5 text-white" />
                            Thông tin hình ảnh
                          </h3>
                          <div className="space-y-3">
                            {/* Title */}
                            <div className="flex items-center justify-between border-b border-white/10 py-2">
                              <span className="text-sm font-medium text-gray-300">
                                Tên file:
                              </span>
                              <span
                                className="max-w-48 truncate text-sm font-semibold text-white"
                                title={title}
                              >
                                {title}
                              </span>
                            </div>
                            {/* Status */}
                            <div className="flex items-center justify-between border-b border-white/10 py-2">
                              <span className="text-sm font-medium text-gray-300">
                                Trạng thái:
                              </span>
                              <motion.div
                                className={`flex items-center space-x-2 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 backdrop-blur-sm`}
                                whileHover={{ scale: 1.05 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 17,
                                }}
                              >
                                {getStatusIcon(status)}
                                <span className="text-xs font-medium text-white">
                                  {translateStatus(status)}
                                </span>
                              </motion.div>
                            </div>
                            {/* Size */}
                            <div className="flex items-center justify-between border-b border-white/10 py-2">
                              <span className="text-sm font-medium text-gray-300">
                                Kích thước:
                              </span>
                              <div className="flex items-center space-x-1">
                                <MdStorage className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-white">
                                  {size} MB
                                </span>
                              </div>
                            </div>
                            {/* Upload By */}
                            {uploadBy && (
                              <div className="flex items-center justify-between border-b border-white/10 py-2">
                                <span className="text-sm font-medium text-gray-300">
                                  Tải lên bởi:
                                </span>
                                <span className="text-sm font-semibold text-white">
                                  {uploadBy}
                                </span>
                              </div>
                            )}
                            {/* Date */}
                            <div className="flex items-center justify-between py-2">
                              <span className="text-sm font-medium text-gray-300">
                                Ngày tải lên:
                              </span>
                              <div className="flex items-center space-x-1">
                                <MdCalendarToday className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-white">
                                  {createAt}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        {/* Action Buttons */}
                        <motion.div
                          variants={itemVariants}
                          className="rounded-2xl border border-white/20 bg-gray-800/60 p-5 shadow-lg backdrop-blur-sm"
                        >
                          <h3 className="mb-4 text-base font-semibold text-white">
                            Thao tác
                          </h3>
                          <div className="flex space-x-3">
                            {/* Analyze Button */}
                            <motion.div
                              className="flex-1"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                onClick={handleAnalyzeClick}
                                disabled={analyzing || status === "Processing"}
                                isLoading={analyzing || status === "Processing"}
                                variant="primary"
                                size="md"
                                className="text-black w-full bg-white shadow-lg hover:bg-white/90"
                                leftIcon={
                                  !(analyzing || status === "Processing") && (
                                    <FaPlayCircle className="h-4 w-4" />
                                  )
                                }
                              >
                                {analyzing || status === "Processing"
                                  ? "Đang xử lý"
                                  : "Phân tích"}
                              </Button>
                            </motion.div>

                            {/* Delete Button */}
                            <motion.div
                              className="flex-1"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                onClick={handleDeleteClick}
                                disabled={deleting}
                                isLoading={deleting}
                                variant="secondary"
                                size="md"
                                className="w-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
                                leftIcon={
                                  !deleting && <FaTrash className="h-4 w-4" />
                                }
                              >
                                {deleting ? "Đang xóa..." : "Xóa"}
                              </Button>
                            </motion.div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Right: Form */}
                    <motion.div
                      variants={itemVariants}
                      className="custom-scrollbar flex flex-col overflow-y-auto p-6 lg:w-[55%]"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(255,255,255,0.3) transparent",
                      }}
                    >
                      <motion.div
                        variants={itemVariants}
                        className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/20 bg-gray-800/60 shadow-lg backdrop-blur-sm"
                      >
                        <div className="flex items-center justify-between border-b border-white/10 bg-gray-800/50 p-5 backdrop-blur-sm">
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              Dữ liệu đã trích xuất
                            </h3>
                            <p className="mt-1 text-sm text-gray-300">
                              Thông tin đăng ký của sinh viên được trích xuất từ
                              hình ảnh
                            </p>
                          </div>
                          {formData && (
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                onClick={() => setIsEditing(!isEditing)}
                                variant={isEditing ? "secondary" : "blue"}
                                size="md"
                                className={
                                  isEditing
                                    ? "border border-white/20 bg-white/10 text-white hover:bg-white/20"
                                    : "text-black bg-white hover:bg-white/90"
                                }
                                leftIcon={
                                  isEditing ? (
                                    <MdCheckCircle className="h-5 w-5" />
                                  ) : (
                                    <MdInfo className="h-5 w-5" />
                                  )
                                }
                              >
                                {isEditing ? "Lưu" : "Chỉnh sửa"}
                              </Button>
                            </motion.div>
                          )}
                        </div>
                        <div className="flex-1 overflow-y-auto bg-gray-800/30 p-5">
                          <DisplayStudentForm
                            data={formData || emptyForm}
                            isEditing={isEditing}
                            onDataChange={setFormData}
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

export default ImageDialog;
