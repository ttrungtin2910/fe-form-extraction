import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import NftCard from "components/image/NftCard";
import FolderCard from "components/folder/FolderCard";
import UploadButton from "components/button/UploadButton";
import {
  ArrowPathIcon as MdRefresh,
  BarsArrowDownIcon as MdSort,
  ChevronDownIcon as MdKeyboardArrowDown,
  CheckIcon as MdCheckBox,
  PencilIcon as MdEdit,
  TrashIcon as MdDelete,
  ArrowPathIcon as FaSpinner,
  PlusIcon as FaPlus,
  HomeIcon as IoHomeOutline,
  ArrowLeftIcon as IoArrowBackOutline,
  FolderIcon as FaFolder,
} from "@heroicons/react/24/solid";
import {
  Square2StackIcon as MdCheckBoxOutlineBlank,
  FolderOpenIcon as IoFolderOpenOutline,
  PhotoIcon as IoImagesOutline,
} from "@heroicons/react/24/outline";
import { api } from "config/api";
import { useImageManagement } from "contexts/ImageManagementContext";
import FolderModal from "components/folder/FolderModal";
import { useToast, useConfirm } from "components/common/ToastProvider";
import { POLLING_CONFIG } from "config/polling";
import Button from "components/button/Button";
import BlurText from "components/animations/BlurText";

// Skeleton Loading Component for Images
const ImageSkeleton = () => (
  <div className="relative animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm">
    <div className="aspect-square bg-white/10" />
    <div className="space-y-3 p-4">
      <div className="h-4 rounded bg-white/10" />
      <div className="h-3 w-3/4 rounded bg-white/10" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-1/2 rounded bg-white/10" />
        <div className="h-6 w-16 rounded bg-white/10" />
      </div>
    </div>
  </div>
);

// Skeleton Loading Component for Folders
const FolderSkeleton = () => (
  <div className="relative animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm">
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 rounded bg-white/10" />
          <div className="h-3 w-2/3 rounded bg-white/10" />
        </div>
      </div>
    </div>
  </div>
);

const ImageManagement = () => {
  const [images, setImages] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const foldersRef = useRef([]);
  const [currentFolder, setCurrentFolder] = useState("");
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [modalError, setModalError] = useState("");
  const [sortField, setSortField] = useState("ImageName"); // "CreatedAt", "ImageName", "Status"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" or "desc"
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [childFolders, setChildFolders] = useState([]);
  const [modalType, setModalType] = useState(null); // 'rename' | 'delete'
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [renameInput, setRenameInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Use refs to store handlers to avoid initialization order issues
  const handleAnalyzeSelectedRef = useRef(null);
  const handleDeleteSelectedRef = useRef(null);

  // Cache for images - key: folderPath_page_sortField_sortOrder, value: { data, timestamp }
  const imagesCacheRef = useRef(new Map());

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
    analyzeProgress,
  } = useImageManagement();

  const toast = useToast();
  const confirm = useConfirm();

  // Use refs to avoid recreating fetchImages on every render
  const updateImagesRef = useRef(updateImages);
  const toastRef = useRef(toast);

  // Update refs without causing re-renders
  updateImagesRef.current = updateImages;
  toastRef.current = toast;

  const fetchImages = useCallback(
    async (availableFolders, forceRefresh = false) => {
      // Generate cache key
      const cacheKey = `${
        currentFolder || "root"
      }_${currentPage}_${sortField}_${sortOrder}_${itemsPerPage}`;
      const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

      // Check cache first (unless force refresh)
      if (!forceRefresh && imagesCacheRef.current.has(cacheKey)) {
        const cached = imagesCacheRef.current.get(cacheKey);
        const now = Date.now();

        // Check if cache is still valid
        if (now - cached.timestamp < CACHE_DURATION_MS) {
          console.log(`[ImageManagement] Using cached data for: ${cacheKey}`);
          setImages(cached.data);
          updateImagesRef.current(cached.data);
          setTotalPages(cached.totalPages);
          setChildFolders(cached.childFolders);
          return;
        } else {
          // Cache expired, remove it
          imagesCacheRef.current.delete(cacheKey);
        }
      }

      setIsRefreshing(true);
      // Don't clear images immediately - keep showing previous data while loading
      // Only clear if it's a different folder or significant change
      if (
        forceRefresh ||
        (availableFolders && availableFolders !== foldersRef.current)
      ) {
        // Keep existing images visible while loading new ones
      }

      try {
        const effectiveFolders = availableFolders ?? foldersRef.current;
        const apiParams = {
          page: currentPage,
          limit: itemsPerPage,
          sortField,
          sortOrder,
        };

        const response = currentFolder
          ? await api.images.getByFolder(currentFolder, apiParams)
          : await api.images.getAll({ ...apiParams, folderPath: "" });

        const data = response?.data ?? [];
        const totalItems = response?.total ?? data.length;

        const childFoldersLocal = effectiveFolders.filter((folder) => {
          if (currentFolder) {
            return (
              folder.startsWith(`${currentFolder}/`) &&
              folder.split("/").length === currentFolder.split("/").length + 1
            );
          }
          return folder.split("/").length === 1;
        });

        const totalPagesCalc = Math.max(
          1,
          Math.ceil(totalItems / itemsPerPage)
        );

        // Store in cache
        imagesCacheRef.current.set(cacheKey, {
          data,
          totalPages: totalPagesCalc,
          childFolders: childFoldersLocal,
          timestamp: Date.now(),
        });

        setChildFolders(childFoldersLocal);

        // Update images immediately - NftCard will handle individual image loading
        setImages(data);
        updateImagesRef.current(data);

        setTotalPages(totalPagesCalc);
        if (currentPage > totalPagesCalc) {
          setCurrentPage(totalPagesCalc);
        }
      } catch (error) {
        console.error("[ImageManagement] Error fetching images:", error);
        toastRef.current.error("Không thể tải danh sách hình ảnh");
      } finally {
        setIsRefreshing(false);
      }
    },
    [currentFolder, currentPage, itemsPerPage, sortField, sortOrder]
  );

  // Lazy load folders - only load when needed
  // Note: Currently unused, kept for future use
  // const loadFolders = useCallback(async (parent = null) => {
  //   try {
  //     const folderData = await api.images.getFolders(parent, true); // includeCount = true
  //     const fetchedFolders = folderData.folders || [];
  //
  //     if (parent === null) {
  //       // Loading all folders for navigation
  //       setFolders(fetchedFolders.map(f => f.FolderPath));
  //     }
  //
  //     return fetchedFolders;
  //   } catch (error) {
  //     console.error("[ImageManagement] Failed to fetch folders", error);
  //     toast.error("Không thể tải danh sách thư mục");
  //     return [];
  //   }
  // }, [toast]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        // Only load root-level folders initially
        const folderData = await api.images.getFolders("", false); // parent="", no count
        if (!isMounted) return;
        const fetchedFolders = (folderData.folders || []).map(
          (f) => f.FolderPath
        );
        setFolders(fetchedFolders);
        if (isMounted) {
          setHasInitialLoad(true);
          // Start loading images immediately after folders are loaded
          // Don't wait for another effect cycle
        }
      } catch (error) {
        console.error("[ImageManagement] Failed to fetch folders", error);
        toast.error("Không thể tải danh sách thư mục");
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  useEffect(() => {
    foldersRef.current = folders;
  }, [folders]);

  useEffect(() => {
    if (!hasInitialLoad) return;
    // Fetch images without blocking UI
    fetchImages();
    // Only fetch when these specific values change, not when fetchImages function reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasInitialLoad,
    currentFolder,
    currentPage,
    itemsPerPage,
    sortField,
    sortOrder,
  ]);

  // Separate effect to handle initial loading state reset
  useEffect(() => {
    if (hasInitialLoad && isInitialLoading) {
      // Reset initial loading after first data fetch
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasInitialLoad, isInitialLoading, images.length]);

  // Resume processing tasks after page reload
  useEffect(() => {
    const processingImages = images.filter(
      (img) => img.Status === "Processing"
    );
    if (processingImages.length === 0 || isRefreshing) return;

    let isMounted = true;
    let pollingInterval = null;

    const pollProcessingImages = async () => {
      if (!isMounted) return;

      try {
        // Fetch current images to check status via API
        const resp = currentFolder
          ? await api.images.getByFolder(currentFolder, {
              page: currentPage,
              limit: itemsPerPage,
              sortField,
              sortOrder,
            })
          : await api.images.getAll({
              page: currentPage,
              limit: itemsPerPage,
              folderPath: "",
              sortField,
              sortOrder,
            });

        if (!isMounted) return;

        const updatedImages = resp.data || [];

        // Check if any processing images have completed
        const stillProcessing = processingImages.filter((procImg) => {
          const updatedImg = updatedImages.find(
            (i) => i.ImageName === procImg.ImageName
          );
          return updatedImg && updatedImg.Status === "Processing";
        });

        if (
          stillProcessing.length === 0 ||
          stillProcessing.length < processingImages.length
        ) {
          // Stop polling and refresh
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
          if (isMounted) {
            await handleRefresh();
          }
          return;
        }
      } catch (e) {
        console.error(`[ImageManagement] Error polling processing images:`, e);
      }
    };

    // Start polling every 3 seconds
    pollingInterval = setInterval(() => {
      pollProcessingImages();
    }, 3000);

    // Initial poll
    pollProcessingImages();

    return () => {
      isMounted = false;
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    images.length,
    isRefreshing,
    currentFolder,
    currentPage,
    itemsPerPage,
    sortField,
    sortOrder,
  ]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSortMenu && !event.target.closest(".sort-dropdown")) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSortMenu]);

  const handleRefresh = useCallback(async () => {
    try {
      const folderData = await api.images.getFolders();
      const fetchedFolders = folderData.folders || [];
      setFolders(fetchedFolders);
      // Force refresh - clear cache for current folder
      const cacheKey = `${
        currentFolder || "root"
      }_${currentPage}_${sortField}_${sortOrder}_${itemsPerPage}`;
      imagesCacheRef.current.delete(cacheKey);
      await fetchImages(fetchedFolders, true);
    } catch (e) {
      console.error("[ImageManagement] Failed to refresh folders", e);
      toastRef.current.error("Không thể làm mới danh sách hình ảnh");
    }
  }, [
    fetchImages,
    currentFolder,
    currentPage,
    sortField,
    sortOrder,
    itemsPerPage,
  ]);

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
        return "Ngày tạo";
      case "ImageName":
        return "Tên";
      case "Status":
        return "Trạng thái";
      default:
        return field;
    }
  };

  const getSortOrderDisplayName = () => {
    return sortOrder === "asc" ? "Tăng dần" : "Giảm dần";
  };

  const handleImageSelect = (imageName, isSelected) => {
    const newSet = new Set(selectedImages);
    if (isSelected) {
      newSet.add(imageName);
    } else {
      newSet.delete(imageName);
    }
    updateSelectedImages(newSet);
  };

  const handleImageDelete = (imageName) => {
    // Remove from selected images
    const newSet = new Set(selectedImages);
    newSet.delete(imageName);
    updateSelectedImages(newSet);

    // Clear cache and refresh the image list
    const cacheKey = `${
      currentFolder || "root"
    }_${currentPage}_${sortField}_${sortOrder}_${itemsPerPage}`;
    imagesCacheRef.current.delete(cacheKey);
    fetchImages(undefined, true);
  };

  const handleImageAnalyze = (result) => {
    // You can add additional handling here if needed
  };

  const handleSelectAll = () => {
    if (selectedImages.size === images.length) {
      // If all are selected, deselect all
      updateSelectedImages(new Set());
    } else {
      // Select all images
      const allImageNames = images.map((img) => img.ImageName);
      updateSelectedImages(new Set(allImageNames));
    }
  };

  const handleAnalyzeSelected = useCallback(async () => {
    if (selectedImages.size === 0) {
      toast.warn("Vui lòng chọn ít nhất một hình ảnh để phân tích");
      return;
    }

    setAnalyzingState(true);

    try {
      const selectedImageData = images.filter((img) =>
        selectedImages.has(img.ImageName)
      );
      const totalImages = selectedImageData.length;
      setAnalyzeProgressState(0, totalImages);

      // 1. Dispatch all tasks in parallel (fire-and-collect)
      const dispatchPromises = selectedImageData.map(async (img) => {
        try {
          const resp = await api.queue.extract({
            ImageName: img.ImageName,
            Size: img.Size || 0,
            ImagePath: img.ImagePath,
            Status: img.Status,
            CreatedAt: img.CreatedAt,
            FolderPath: img.FolderPath || "",
          });
          return { image: img.ImageName, taskId: resp.task_id };
        } catch (e) {
          console.error(
            "[ImageManagement] Failed to enqueue",
            img.ImageName,
            e
          );
          return { image: img.ImageName, taskId: null, error: e };
        }
      });

      const taskMappings = await Promise.all(dispatchPromises);
      const validTasks = taskMappings.filter((t) => t.taskId);
      const failedEnqueue = taskMappings.filter((t) => !t.taskId).length;

      if (failedEnqueue) {
        toast.warn(`${failedEnqueue} hình ảnh xếp hàng thất bại`);
      }

      // 2. Poll all tasks concurrently
      let attempts = 0;
      const maxAttempts = 180; // ~3 minutes
      const stateMap = new Map(); // taskId -> state

      const poll = async () => {
        attempts++;
        const pendingTaskIds = validTasks
          .map((t) => t.taskId)
          .filter((id) => {
            const st = stateMap.get(id);
            return !(st === "SUCCESS" || st === "FAILURE");
          });
        if (!pendingTaskIds.length) return true; // all done

        // Fetch statuses in parallel using Promise.allSettled for better performance
        const statusPromises = pendingTaskIds.map((id) =>
          api.queue
            .taskStatus(id)
            .then((status) => ({ id, status: status.state, success: true }))
            .catch((error) => ({ id, error, success: false }))
        );

        const results = await Promise.allSettled(statusPromises);

        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value.success) {
            stateMap.set(result.value.id, result.value.status);
          } else if (result.status === "fulfilled" && !result.value.success) {
            console.error(
              "[ImageManagement] Poll error for task",
              result.value.id,
              result.value.error
            );
          }
        });

        const completed = validTasks.filter((t) => {
          const st = stateMap.get(t.taskId);
          return st === "SUCCESS" || st === "FAILURE";
        }).length;

        // Update UI progress (include enqueue failures as already completed slots)
        setAnalyzeProgressState(completed + failedEnqueue, totalImages);

        if (completed + failedEnqueue >= totalImages) return true;
        if (attempts >= maxAttempts) return true;
        return false;
      };

      // Loop with delay
      while (true) {
        const done = await poll();
        if (done) break;
        await new Promise((r) =>
          setTimeout(r, POLLING_CONFIG.ANALYSIS_INTERVAL)
        );
      }

      // Clear cache and refresh
      const cacheKey = `${
        currentFolder || "root"
      }_${currentPage}_${sortField}_${sortOrder}_${itemsPerPage}`;
      imagesCacheRef.current.delete(cacheKey);
      fetchImages(undefined, true);
      toast.success(
        `Đã phân tích ${totalImages - failedEnqueue} hình ảnh${
          failedEnqueue ? ` (${failedEnqueue} thất bại)` : ""
        }`
      );
    } finally {
      setAnalyzingState(false);
      clearAnalyzingImages();
      resetAnalyzeProgress();
    }
  }, [
    selectedImages,
    images,
    toast,
    setAnalyzingState,
    setAnalyzeProgressState,
    clearAnalyzingImages,
    resetAnalyzeProgress,
    fetchImages,
    currentFolder,
    currentPage,
    itemsPerPage,
    sortField,
    sortOrder,
  ]);

  // Update ref when handleAnalyzeSelected changes
  useEffect(() => {
    handleAnalyzeSelectedRef.current = handleAnalyzeSelected;
  }, [handleAnalyzeSelected]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedImages.size === 0) {
      toast.warn("Vui lòng chọn ít nhất một hình ảnh để xóa");
      return;
    }

    const confirmDelete = await confirm({
      title: "Xóa hình ảnh",
      message: `Xóa ${selectedImages.size} hình ảnh?`,
      type: "danger",
      confirmText: "Xóa",
    });
    if (!confirmDelete) return;

    setDeletingState(true);

    try {
      const selectedImageNames = Array.from(selectedImages);
      let successCount = 0;
      let errorCount = 0;

      for (const imageName of selectedImageNames) {
        try {
          await api.images.delete(imageName);
          successCount++;
        } catch (error) {
          console.error(
            `[ImageManagement] Error deleting image: ${imageName}`,
            error
          );
          errorCount++;
        }
      }

      // Clear selection and refresh
      updateSelectedImages(new Set());
      handleRefresh();

      if (errorCount > 0) {
        toast.success(
          `Đã xóa ${successCount} hình ảnh, ${errorCount} thất bại`
        );
      } else {
        toast.success(`Đã xóa ${successCount} hình ảnh`);
      }
    } finally {
      setDeletingState(false);
    }
  }, [
    selectedImages,
    toast,
    confirm,
    setDeletingState,
    updateSelectedImages,
    handleRefresh,
  ]);

  // Update ref when handleDeleteSelected changes
  useEffect(() => {
    handleDeleteSelectedRef.current = handleDeleteSelected;
  }, [handleDeleteSelected]);

  // Set handlers for sidebar buttons - use refs to avoid initialization order issues
  // Note: setAnalyzeHandler and setDeleteHandler are excluded from dependencies
  // because they are stable functions from context and including them causes infinite loops
  useEffect(() => {
    if (handleAnalyzeSelectedRef.current && handleDeleteSelectedRef.current) {
      setAnalyzeHandler(() => handleAnalyzeSelectedRef.current);
      setDeleteHandler(() => handleDeleteSelectedRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleAnalyzeSelected, handleDeleteSelected]); // Only track actual handler changes

  const handleFolderChange = (event) => {
    setCurrentFolder(event.target.value);
  };

  // Clear selections when leaving page
  useEffect(() => {
    return () => {
      updateSelectedImages(new Set());
    };
  }, [updateSelectedImages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [currentFolder, sortField, sortOrder, itemsPerPage]);

  // Animation variants
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

  // const cardVariants = { // Reserved for future use
  //   hidden: { opacity: 0, scale: 0.95 },
  //   visible: {
  //     opacity: 1,
  //     scale: 1,
  //     transition: {
  //       duration: 0.4,
  //       ease: [0.25, 0.46, 0.45, 0.94],
  //     },
  //   },
  // };

  return (
    <motion.div
      className="relative min-h-screen overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ✅ OPTIMIZED: Lightweight loading indicator in button instead of full-screen overlay */}
      {isRefreshing && (
        <motion.div
          className="fixed right-4 top-4 z-40 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <FaSpinner className="h-5 w-5 animate-spin text-white" />
          <span className="text-sm font-medium text-white/70">Đang tải...</span>
        </motion.div>
      )}

      {/* Analysis progress bar (non-blocking) */}
      {isAnalyzing && (
        <motion.div
          className="fixed bottom-4 left-4 right-4 z-40 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl md:left-1/2 md:w-1/2 md:-translate-x-1/2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-white/70">
              Đang phân tích hình ảnh...
            </span>
            <span className="text-sm font-medium text-white">
              {analyzeProgress.completed}/{analyzeProgress.total}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{
                width: `${
                  analyzeProgress.total
                    ? (analyzeProgress.completed / analyzeProgress.total) * 100
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </motion.div>
      )}

      <div className="relative z-10 p-4 md:p-6">
        {/* Header Section */}
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm"
            >
              <FaFolder className="h-8 w-8 text-white" />
            </motion.div>

            <BlurText
              text=" Quản Lý Hình Ảnh"
              animateBy="words"
              direction="top"
              delay={150}
              className="mb-4 text-3xl font-bold leading-normal tracking-normal text-white md:text-4xl"
            />

            <motion.p
              variants={itemVariants}
              className="text-sm leading-normal text-white/70 md:text-base"
            >
              Tải lên, quản lý và phân tích hình ảnh với giao diện hiện đại
            </motion.p>
          </div>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
          variants={itemVariants}
        >
          <div className="flex flex-wrap items-center gap-3">
            {/* Upload Button - MOST IMPORTANT */}
            <div className="flex-shrink-0">
              <UploadButton
                onUploadComplete={handleRefresh}
                folderPath={currentFolder}
              />
            </div>

            {/* New Folder */}
            <Button
              onClick={() => {
                setNewFolderName("");
                setModalError("");
                setShowNewFolderModal(true);
              }}
              variant="blue"
              size="md"
              className="min-w-[120px] whitespace-nowrap"
              leftIcon={<FaPlus className="h-4 w-4" />}
            >
              Thư mục mới
            </Button>

            {currentFolder && (
              <>
                <Button
                  onClick={() => {
                    setRenameInput(currentFolder.split("/").pop());
                    setModalType("rename");
                    setShowFolderModal(true);
                  }}
                  variant="primary"
                  size="sm"
                  className="min-w-[100px] whitespace-nowrap bg-yellow-500 hover:bg-yellow-600"
                  leftIcon={<MdEdit className="h-4 w-4" />}
                >
                  Đổi tên
                </Button>

                <Button
                  onClick={() => {
                    setModalType("delete");
                    setShowFolderModal(true);
                  }}
                  variant="danger"
                  size="sm"
                  className="min-w-[80px] whitespace-nowrap"
                  leftIcon={<MdDelete className="h-4 w-4" />}
                >
                  Xóa
                </Button>
              </>
            )}
          </div>

          {/* Right: Secondary Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setCurrentFolder("")}
              variant="ghost"
              size="sm"
              className="min-w-[80px] whitespace-nowrap"
              leftIcon={<IoHomeOutline className="h-4 w-4" />}
            >
              Tất cả
            </Button>

            <select
              value={currentFolder}
              onChange={handleFolderChange}
              className="rounded-xl border border-white/20 bg-gray-900/90 px-3 py-2 text-sm text-white backdrop-blur-sm transition hover:bg-gray-800/90 focus:outline-none focus:ring-2 focus:ring-white/30"
              style={{
                colorScheme: "dark",
              }}
            >
              <option value="" className="bg-gray-900 text-white">
                Chọn thư mục...
              </option>
              {folders.map((f) => {
                const depth = f.split("/").length - 1;
                const name = f.split("/").pop();
                return (
                  <option
                    key={f}
                    value={f}
                    className="bg-gray-900 text-white"
                  >{`${"\u00A0".repeat(depth * 2)}${name}`}</option>
                );
              })}
            </select>

            <div className="h-6 w-px bg-white/20"></div>

            <Button onClick={handleSelectAll} variant="ghost" size="icon">
              {selectedImages.size === images.length && images.length > 0 ? (
                <MdCheckBox className="h-4 w-4" />
              ) : (
                <MdCheckBoxOutlineBlank className="h-4 w-4" />
              )}
            </Button>

            {/* Sort Dropdown */}
            <div className="sort-dropdown relative">
              <Button
                onClick={() => setShowSortMenu(!showSortMenu)}
                variant="ghost"
                size="sm"
                className="min-w-[120px] whitespace-nowrap"
                leftIcon={<MdSort className="h-4 w-4" />}
                rightIcon={<MdKeyboardArrowDown className="h-4 w-4" />}
              >
                {getSortFieldDisplayName(sortField)}
              </Button>

              {showSortMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
                  <div className="py-2">
                    <div className="border-b border-white/10 px-4 py-2 text-sm font-medium text-white">
                      Sắp xếp theo
                    </div>
                    <button
                      onClick={() => handleSortFieldChange("CreatedAt")}
                      className={`w-full px-4 py-2 text-left text-sm transition hover:bg-white/10 ${
                        sortField === "CreatedAt"
                          ? "font-medium text-red-400"
                          : "text-white/70"
                      }`}
                    >
                      Ngày tạo
                    </button>
                    <button
                      onClick={() => handleSortFieldChange("ImageName")}
                      className={`w-full px-4 py-2 text-left text-sm transition hover:bg-white/10 ${
                        sortField === "ImageName"
                          ? "font-medium text-red-400"
                          : "text-white/70"
                      }`}
                    >
                      Tên
                    </button>
                    <button
                      onClick={() => handleSortFieldChange("Status")}
                      className={`w-full px-4 py-2 text-left text-sm transition hover:bg-white/10 ${
                        sortField === "Status"
                          ? "font-medium text-red-400"
                          : "text-white/70"
                      }`}
                    >
                      Trạng thái
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Order Toggle */}
            <button
              onClick={handleSortToggle}
              className="flex min-w-[100px] items-center whitespace-nowrap rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-sm transition hover:border-white/30 hover:bg-white/20"
            >
              <MdSort className="mr-1 h-4 w-4" />
              {getSortOrderDisplayName()}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center rounded-xl border border-white/20 px-3 py-2 text-sm text-white backdrop-blur-sm transition ${
                isRefreshing
                  ? "cursor-not-allowed bg-white/10 opacity-50"
                  : "bg-white/10 hover:border-white/30 hover:bg-white/20"
              }`}
            >
              <MdRefresh
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </motion.div>

        {/* Breadcrumb navigation with back button */}
        <motion.div className="mb-4" variants={itemVariants}>
          <div className="flex items-center gap-2 text-sm">
            {currentFolder && (
              <button
                onClick={() => {
                  const parentFolder = currentFolder
                    .split("/")
                    .slice(0, -1)
                    .join("/");
                  setCurrentFolder(parentFolder);
                }}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-white/30 hover:bg-white/20 hover:shadow-xl"
              >
                <IoArrowBackOutline className="h-5 w-5" />
                <span className="font-medium">Quay lại</span>
              </button>
            )}
            <div className="ml-2 flex flex-wrap items-center gap-1">
              <button
                onClick={() => setCurrentFolder("")}
                className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
              >
                <IoHomeOutline className="h-5 w-5" />
                <span>Gốc</span>
              </button>
              {currentFolder &&
                currentFolder.split("/").map((part, idx, arr) => {
                  const path = arr.slice(0, idx + 1).join("/");
                  return (
                    <span key={path} className="flex items-center gap-1">
                      <span className="text-white/50">/</span>
                      <button
                        onClick={() => setCurrentFolder(path)}
                        className="font-medium text-white/80 transition hover:text-white"
                      >
                        {part}
                      </button>
                    </span>
                  );
                })}
            </div>
          </div>
        </motion.div>

        {/* Selection Info */}
        {selectedImages.size > 0 && (
          <motion.div
            className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 shadow-xl backdrop-blur-xl"
            variants={itemVariants}
          >
            <p className="font-medium text-white">
              Đã chọn {selectedImages.size} / {images.length} hình ảnh
            </p>
          </motion.div>
        )}

        {/* Folders Section - Show immediately or with skeleton */}
        {isInitialLoading && childFolders.length === 0 && currentPage === 1 ? (
          /* Loading skeletons for folders */
          <motion.div className="mb-8" variants={itemVariants}>
            <div className="mb-4 flex items-center gap-3">
              <motion.div
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 shadow-xl backdrop-blur-xl"
                variants={itemVariants}
              >
                <IoFolderOpenOutline className="h-6 w-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">
                  Đang tải thư mục...
                </h2>
              </motion.div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <FolderSkeleton key={`folder-skeleton-${index}`} />
              ))}
            </div>
          </motion.div>
        ) : childFolders.length > 0 && currentPage === 1 ? (
          <motion.div className="mb-8" variants={itemVariants}>
            <div className="mb-4 flex items-center gap-3">
              <motion.div
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 shadow-xl backdrop-blur-xl"
                variants={itemVariants}
              >
                <IoFolderOpenOutline className="h-6 w-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">
                  Thư mục ({childFolders.length})
                </h2>
              </motion.div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
              {childFolders.map((fp) => (
                <FolderCard
                  key={fp}
                  path={fp}
                  currentFolder={currentFolder}
                  onNavigate={setCurrentFolder}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          </motion.div>
        ) : null}

        {/* Images Section */}
        {isInitialLoading && images.length === 0 ? (
          /* Loading skeletons for initial load */
          <motion.div variants={itemVariants}>
            <div className="mb-4 flex items-center gap-3">
              <motion.div
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 shadow-xl backdrop-blur-xl"
                variants={itemVariants}
              >
                <IoImagesOutline className="h-6 w-6 text-green-400" />
                <h2 className="text-xl font-bold text-white">Đang tải...</h2>
              </motion.div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ImageSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          </motion.div>
        ) : images.length > 0 ? (
          <motion.div
            className={childFolders.length > 0 && currentPage === 1 ? "" : ""}
            variants={itemVariants}
          >
            <div className="mb-4 flex items-center gap-3">
              <motion.div
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 shadow-xl backdrop-blur-xl"
                variants={itemVariants}
              >
                <IoImagesOutline className="h-6 w-6 text-green-400" />
                <h2 className="text-xl font-bold text-white">
                  Hình ảnh ({images.length})
                </h2>
              </motion.div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
              {images.map((img, index) => (
                <NftCard
                  key={`${img.ImageName}-${index}`}
                  title={img.ImageName}
                  author={new Date(img.CreatedAt).toLocaleDateString()}
                  size={img.Size || "—"}
                  image={img.ImagePath}
                  status={img.Status}
                  createAt={img.CreatedAt}
                  folderPath={img.FolderPath}
                  uploadBy={img.UploadBy}
                  isSelected={selectedImages.has(img.ImageName)}
                  onSelect={handleImageSelect}
                  onDelete={handleImageDelete}
                  onAnalyze={handleImageAnalyze}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          /* Empty State - only show when not loading and no images */
          !isInitialLoading &&
          currentPage === 1 &&
          childFolders.length === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/20 bg-white/5 py-20 shadow-2xl backdrop-blur-xl"
              variants={itemVariants}
            >
              <div className="mb-6 flex items-center gap-3">
                <motion.div
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <IoFolderOpenOutline className="text-6xl text-white/50" />
                </motion.div>
              </div>
              <h3 className="mb-3 text-2xl font-bold text-white">
                Thư mục trống
              </h3>
              <p className="mb-6 max-w-md text-center text-white/70">
                Tạo thư mục mới hoặc tải ảnh lên để bắt đầu quản lý
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => setShowNewFolderModal(true)}
                  className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-white/20 bg-white/10 px-4 py-2 font-medium text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-white/30 hover:bg-white/20 hover:shadow-xl"
                >
                  <FaPlus />
                  <span>Tạo thư mục</span>
                </button>
                <div className="flex-shrink-0">
                  <UploadButton
                    onUploadComplete={handleRefresh}
                    folderPath={currentFolder}
                  />
                </div>
              </div>
            </motion.div>
          )
        )}

        <motion.div
          className="mt-6 flex justify-center gap-1"
          variants={itemVariants}
        >
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="rounded-xl border border-white/20 bg-white/10 px-2.5 py-1 text-white backdrop-blur-sm transition hover:border-white/30 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trước
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => {
            const page = idx + 1;
            if (totalPages > 7) {
              const show =
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1 ||
                (currentPage <= 3 && page <= 4) ||
                (currentPage >= totalPages - 2 && page >= totalPages - 3);
              if (!show)
                return idx === 1 || idx === totalPages - 2 ? (
                  <span key={page} className="px-2 text-white/50">
                    …
                  </span>
                ) : null;
            }
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`rounded-xl border border-white/20 px-2.5 py-1 backdrop-blur-sm transition ${
                  page === currentPage
                    ? "border-red-400/30 bg-red-500 text-white shadow-lg"
                    : "bg-white/10 text-white hover:border-white/30 hover:bg-white/20"
                }`}
              >
                {page}
              </button>
            );
          })}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="rounded-xl border border-white/20 bg-white/10 px-2.5 py-1 text-white backdrop-blur-sm transition hover:border-white/30 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
          </button>
        </motion.div>

        <motion.div className="mt-4 flex justify-end" variants={itemVariants}>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
            className="rounded-xl border border-white/20 bg-white/10 px-2 py-1 text-sm text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            {[10, 20, 30, 40, 50].map((n) => (
              <option key={n} value={n} className="bg-gray-800 text-white">
                {n} / trang
              </option>
            ))}
          </select>
        </motion.div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="bg-black/60 fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md">
          <div className="w-96 rounded-3xl border border-white/20 bg-gray-900/95 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-4 text-lg font-bold text-white">
              Tạo thư mục mới
            </h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Tên thư mục"
              className="mb-3 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white backdrop-blur-sm transition placeholder:text-white/50 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            {modalError && (
              <p className="mb-2 text-sm text-red-400">{modalError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm transition hover:border-white/30 hover:bg-white/20"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (!newFolderName.trim()) {
                    setModalError("Tên thư mục là bắt buộc");
                    return;
                  }
                  const newPath = currentFolder
                    ? `${currentFolder}/${newFolderName.trim()}`
                    : newFolderName.trim();
                  try {
                    await api.images.createFolder(newPath);
                    const folderData = await api.images.getFolders();
                    setFolders(folderData.folders || []);
                    await fetchImages(folderData.folders || []);
                    setShowNewFolderModal(false);
                  } catch (e) {
                    setModalError(e.message || "Không thể tạo thư mục");
                  }
                }}
                className="text-black rounded-xl bg-white px-4 py-2 text-sm shadow-lg transition hover:bg-white/90"
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {showFolderModal && (
        <FolderModal
          type={modalType}
          currentName={renameInput}
          setInputValue={setRenameInput}
          onClose={() => setShowFolderModal(false)}
          onConfirm={async (value) => {
            if (modalType === "rename") {
              const parts = currentFolder.split("/");
              parts.pop();
              const parentPath = parts.join("/");
              const newPath = parentPath ? `${parentPath}/${value}` : value;
              try {
                await api.images.renameFolder(currentFolder, newPath);
                await handleRefresh();
                setCurrentFolder(newPath);
              } catch (e) {
                toast.error(e.message);
              }
            } else {
              try {
                await api.images.deleteFolder(currentFolder);
                await handleRefresh();
                setCurrentFolder("");
              } catch (e) {
                toast.error(e.message);
              }
            }
            setShowFolderModal(false);
          }}
        />
      )}
    </motion.div>
  );
};

export default ImageManagement;
