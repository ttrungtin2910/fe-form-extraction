import { useState } from "react";
import Card from "components/image";
import ImageDialog from "components/image/ImageDialog";

import {
  EyeIcon as FiEye,
  PlayIcon as FaPlayCircle,
  TrashIcon as FaTrash,
  ServerIcon as MdStorage,
  CalendarIcon as MdCalendarToday,
  CheckCircleIcon as MdCheckCircle,
  ClockIcon as MdPending,
  InformationCircleIcon as MdInfo,
  ExclamationCircleIcon as MdError,
} from "@heroicons/react/24/solid";
import { api } from "config/api";
import { POLLING_CONFIG } from "../../config/polling";
import { useToast, useConfirm } from "components/common/ToastProvider";
import { translateStatus } from "utils/statusTranslator";
import Button from "components/button/Button";

const NftCard = ({
  title,
  size,
  image,
  extra,
  status,
  createAt,
  folderPath,
  uploadBy,
  isSelected,
  onSelect,
  onDelete,
  onAnalyze,
  onRefresh,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Local + persisted processing state
  const isAnalyzing = loading;
  const isProcessing = isAnalyzing || status === "Processing";

  const toast = useToast();
  const confirmModal = useConfirm();

  const displaySize = typeof size === "number" ? `${size.toFixed(2)} MB` : size;
  const parseDate = (str) => {
    if (!str) return "";
    if (str.includes("T")) return new Date(str);
    // Expect format YYYYMMDD_HHMMSS
    const [datePart, timePart] = str.split("_");
    if (datePart && timePart) {
      const year = datePart.slice(0, 4);
      const month = datePart.slice(4, 6);
      const day = datePart.slice(6, 8);
      const hour = timePart.slice(0, 2);
      const minute = timePart.slice(2, 4);
      const second = timePart.slice(4, 6);
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    }
    return new Date(str);
  };
  const displayDate = (() => {
    try {
      return parseDate(createAt).toLocaleString();
    } catch (e) {
      return createAt;
    }
  })();

  const handleAnalyzeClick = async () => {
    console.log(`[NftCard] Starting analysis for image: ${title}`);
    setLoading(true);

    const sizeVal = typeof size === "number" ? size : 0;

    try {
      const queueResp = await api.queue.extract({
        ImageName: title,
        Size: sizeVal,
        ImagePath: image,
        Status: status,
        CreatedAt: createAt,
        FolderPath: folderPath || "",
      });
      const taskId = queueResp.task_id;
      // poll for completion
      let attempts = 0;
      const poll = async () => {
        const data = await api.queue.taskStatus(taskId);
        if (data.state === "SUCCESS") {
          if (onAnalyze) onAnalyze(data.result);
          if (onRefresh) onRefresh();
          setLoading(false);
          return;
        } else if (data.state === "FAILURE") {
          console.error("Task failed", data.error);
          setLoading(false);
          return;
        } else if (attempts < 120) {
          // up to ~2 minutes (1s interval)
          attempts++;
          setTimeout(poll, POLLING_CONFIG.TASK_STATUS_INTERVAL);
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
    const ok = await confirmModal({
      title: "Xóa hình ảnh",
      message: `Xóa "${title}"?`,
      type: "danger",
      confirmText: "Xóa",
    });
    if (!ok) return;

    console.log(`[NftCard] Starting deletion for image: ${title}`);
    setDeleteLoading(true);
    try {
      await api.images.delete(title);
      toast.success("Đã xóa hình ảnh");

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
        return <MdCheckCircle className="h-5 w-5 text-green-400" />;
      case "Uploaded":
        return <MdPending className="h-5 w-5 text-red-400" />;
      case "Processing":
        return <MdPending className="h-5 w-5 animate-pulse text-orange-400" />;
      case "Verify":
        return <MdInfo className="h-5 w-5 text-purple-400" />;
      case "Synced":
        return <MdInfo className="h-5 w-5 text-orange-400" />;
      default:
        return <MdError className="h-5 w-5 text-white/50" />;
    }
  };

  return (
    <Card
      extra={`flex flex-col w-full h-full rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden group ${extra}`}
    >
      <div className="h-full w-full">
        {/* Image Container */}
        <div className="relative h-48 w-full overflow-hidden rounded-t-3xl bg-white/10">
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-white/10">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
            </div>
          )}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/10">
              <div className="text-center text-white/50">
                <svg
                  className="mx-auto mb-2 h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-xs text-white/50">Không thể tải ảnh</p>
              </div>
            </div>
          )}
          <img
            src={image}
            className={`h-full w-full cursor-pointer object-cover transition-transform duration-300 group-hover:scale-105 ${
              imageLoading ? "opacity-0" : "opacity-100"
            }`}
            alt={title}
            onClick={handleImageClick}
            onLoad={() => {
              setImageLoading(false);
              setImageError(false);
            }}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />

          {/* Overlay on hover */}
          <div className="bg-black/0 group-hover:bg-black/20 pointer-events-none absolute inset-0 flex items-center justify-center transition-all duration-300">
            <div className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="rounded-full border border-white/30 bg-gray-900/80 p-3 shadow-lg backdrop-blur-sm">
                <FiEye className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          {/* Selection Checkbox */}
          <button
            onClick={handleSelect}
            className={`absolute left-3 top-3 z-10 flex transform items-center justify-center rounded-full border p-2 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-110 ${
              isSelected
                ? "border-red-400/50 bg-red-500 text-white shadow-red-500/50"
                : "border-white/30 bg-gray-900/80 text-white backdrop-blur-sm hover:border-white/40 hover:bg-gray-800/90"
            }`}
          >
            <div className="relative">
              {isSelected ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="h-5 w-5 animate-pulse"
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
                    className="h-5 w-5"
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
          <div className="absolute right-3 top-3 z-10">
            <div
              className={`flex items-center space-x-1 rounded-full border border-white/30 bg-gray-900/80 px-3 py-1 shadow-lg backdrop-blur-sm`}
            >
              {getStatusIcon(status)}
              <span className="text-xs font-medium text-white">
                {translateStatus(status)}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-3 p-4">
          {/* Title */}
          <div className="mb-2">
            <h3
              className="truncate text-lg font-semibold text-white"
              title={title}
            >
              {title}
            </h3>
          </div>

          {/* Info Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-white/70">
              <div className="flex items-center space-x-1">
                <MdStorage className="h-4 w-4 text-white/50" />
                <span className="font-medium">{displaySize}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MdCalendarToday className="h-4 w-4 text-white/50" />
                <span className="font-medium">{displayDate}</span>
              </div>
            </div>

            {/* Upload By */}
            {uploadBy && (
              <div className="flex items-center space-x-1 text-xs text-white/60">
                <span className="font-medium">Tải lên bởi:</span>
                <span className="font-semibold text-blue-300">{uploadBy}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-2">
            {/* Analyze Button */}
            <Button
              onClick={handleAnalyzeClick}
              disabled={isProcessing}
              isLoading={isProcessing}
              variant="primary"
              size="md"
              className="flex-1"
              leftIcon={!isProcessing && <FaPlayCircle className="h-4 w-4" />}
            >
              {isProcessing ? "Đang xử lý" : "Phân tích"}
            </Button>

            {/* Delete Button */}
            <Button
              onClick={handleDeleteClick}
              disabled={deleteLoading}
              isLoading={deleteLoading}
              variant="secondary"
              size="icon"
            >
              <FaTrash className="h-4 w-4" />
            </Button>
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
        uploadBy={uploadBy}
        onClose={() => setShowModal(false)}
        onAnalyze={onAnalyze}
        onDelete={onDelete}
        onRefresh={onRefresh}
      />
    </Card>
  );
};

export default NftCard;
