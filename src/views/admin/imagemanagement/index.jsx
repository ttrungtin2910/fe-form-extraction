import { useEffect, useState, useCallback, useRef } from "react";
import NftCard from "components/image/NftCard";
import FolderCard from "components/folder/FolderCard";
import UploadButton from "components/button/UploadButton";
import { MdRefresh, MdSort, MdKeyboardArrowDown, MdCheckBox, MdCheckBoxOutlineBlank, MdFolder, MdEdit, MdDelete, MdFolderOpen, MdHome, MdArrowBack } from "react-icons/md";
import { FaPlayCircle, FaTrash, FaSpinner, FaFileImage, FaFolderOpen, FaImages, FaPlus, FaUpload } from "react-icons/fa";
import { HiOutlineFolderOpen, HiOutlinePhotograph, HiOutlineHome, HiOutlineArrowLeft } from "react-icons/hi";
import { IoFolderOpenOutline, IoImagesOutline, IoHomeOutline, IoArrowBackOutline } from "react-icons/io5";
import { api } from "config/api";
import { useImageManagement } from "contexts/ImageManagementContext";
import FolderModal from "components/folder/FolderModal";
import { useToast, useConfirm } from "components/common/ToastProvider";
import { POLLING_CONFIG } from "config/polling";

const ImageManagement = () => {
  const [images, setImages] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    analyzeProgress
  } = useImageManagement();

  const toast = useToast();
  const confirm = useConfirm();

  const fetchImages = useCallback(
    async (availableFolders) => {
      setIsRefreshing(true);
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

        setChildFolders(childFoldersLocal);
        setImages(data);
        updateImages(data);

        const totalPagesCalc = Math.max(
          1,
          Math.ceil(totalItems / itemsPerPage)
        );
        setTotalPages(totalPagesCalc);
        if (currentPage > totalPagesCalc) {
          setCurrentPage(totalPagesCalc);
        }
      } catch (error) {
        console.error("[ImageManagement] Error fetching images:", error);
        toast.error("Không thể tải danh sách hình ảnh");
      } finally {
        setIsRefreshing(false);
      }
    },
    [
      currentFolder,
      currentPage,
      itemsPerPage,
      sortField,
      sortOrder,
      updateImages,
      toast,
    ]
  );

  // Lazy load folders - only load when needed
  const loadFolders = useCallback(async (parent = null) => {
    try {
      const folderData = await api.images.getFolders(parent, true); // includeCount = true
      const fetchedFolders = folderData.folders || [];
      
      if (parent === null) {
        // Loading all folders for navigation
        setFolders(fetchedFolders.map(f => f.FolderPath));
      }
      
      return fetchedFolders;
    } catch (error) {
      console.error("[ImageManagement] Failed to fetch folders", error);
      toast.error("Không thể tải danh sách thư mục");
      return [];
    }
  }, [toast]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        // Only load root-level folders initially
        const folderData = await api.images.getFolders("", false); // parent="", no count
        if (!isMounted) return;
        const fetchedFolders = (folderData.folders || []).map(f => f.FolderPath);
        setFolders(fetchedFolders);
        if (isMounted) {
          setHasInitialLoad(true);
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
    fetchImages();
  }, [fetchImages, hasInitialLoad]);

  // Set handlers for sidebar buttons
  useEffect(() => {
    setAnalyzeHandler(handleAnalyzeSelected);
    setDeleteHandler(handleDeleteSelected);
  }, [selectedImages, images]);

  // Resume processing tasks after page reload
  useEffect(() => {
    const pollProcessingImages = async () => {
      const processingImages = images.filter(img => img.Status === 'Processing');
      if (processingImages.length === 0) return;

      
      // Poll all processing images together until all complete
      const maxAttempts = 180;
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        attempts++;
        
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
          
          const updatedImages = resp.data || [];
          
          // Check if any processing images have completed
          const stillProcessing = processingImages.filter(procImg => {
            const updatedImg = updatedImages.find(i => i.ImageName === procImg.ImageName);
            return updatedImg && updatedImg.Status === 'Processing';
          });
          
          if (stillProcessing.length === 0) {
            await handleRefresh(); // Refresh to show updated status
            return;
          }
          
          if (stillProcessing.length < processingImages.length) {
            await handleRefresh();
            return;
          }
        } catch (e) {
          console.error(`[ImageManagement] Error polling processing images:`, e);
        }
        
        await new Promise(r => setTimeout(r, 3000)); // Poll every 3 seconds
      }
      
      await handleRefresh();
    };

    if (images.length > 0 && !isRefreshing) {
      pollProcessingImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length, isRefreshing]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSortMenu && !event.target.closest('.sort-dropdown')) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortMenu]);

  const handleRefresh = async () => {
    try {
      const folderData = await api.images.getFolders();
      const fetchedFolders = folderData.folders || [];
      setFolders(fetchedFolders);
      await fetchImages(fetchedFolders);
    } catch (e) {
      console.error("[ImageManagement] Failed to refresh folders", e);
      toast.error("Không thể làm mới danh sách hình ảnh");
    }
  };

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
    
    // Refresh the image list
    fetchImages();
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
      const allImageNames = images.map(img => img.ImageName);
      updateSelectedImages(new Set(allImageNames));
    }
  };

  const handleAnalyzeSelected = async () => {
    if (selectedImages.size === 0) {
      toast.warn("Vui lòng chọn ít nhất một hình ảnh để phân tích");
      return;
    }

    setAnalyzingState(true);

    try {
      const selectedImageData = images.filter(img => selectedImages.has(img.ImageName));
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
            FolderPath: img.FolderPath || ""
          });
          return { image: img.ImageName, taskId: resp.task_id };
        } catch (e) {
          console.error('[ImageManagement] Failed to enqueue', img.ImageName, e);
          return { image: img.ImageName, taskId: null, error: e };
        }
      });

      const taskMappings = await Promise.all(dispatchPromises);
      const validTasks = taskMappings.filter(t => t.taskId);
      const failedEnqueue = taskMappings.filter(t => !t.taskId).length;

      if (failedEnqueue) {
        toast.warn(`${failedEnqueue} hình ảnh xếp hàng thất bại`);
      }

      // 2. Poll all tasks concurrently
      let attempts = 0;
      const maxAttempts = 180; // ~3 minutes
      const stateMap = new Map(); // taskId -> state
      const imageByTask = new Map(validTasks.map(t => [t.taskId, t.image]));

      const poll = async () => {
        attempts++;
        const pendingTaskIds = validTasks.map(t => t.taskId).filter(id => {
          const st = stateMap.get(id);
            return !(st === 'SUCCESS' || st === 'FAILURE');
        });
        if (!pendingTaskIds.length) return true; // all done

        // Fetch statuses in parallel using Promise.allSettled for better performance
        const statusPromises = pendingTaskIds.map(id => 
          api.queue.taskStatus(id)
            .then(status => ({ id, status: status.state, success: true }))
            .catch(error => ({ id, error, success: false }))
        );

        const results = await Promise.allSettled(statusPromises);
        
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value.success) {
            stateMap.set(result.value.id, result.value.status);
          } else if (result.status === 'fulfilled' && !result.value.success) {
            console.error('[ImageManagement] Poll error for task', result.value.id, result.value.error);
          }
        });

        const completed = validTasks.filter(t => {
          const st = stateMap.get(t.taskId);
          return st === 'SUCCESS' || st === 'FAILURE';
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
        await new Promise(r => setTimeout(r, POLLING_CONFIG.ANALYSIS_INTERVAL));
      }

      fetchImages();
      toast.success(`Đã phân tích ${totalImages - failedEnqueue} hình ảnh${failedEnqueue ? ` (${failedEnqueue} thất bại)` : ''}`);
    } finally {
      setAnalyzingState(false);
      clearAnalyzingImages();
      resetAnalyzeProgress();
      handleRefresh();
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) {
      toast.warn("Vui lòng chọn ít nhất một hình ảnh để xóa");
      return;
    }

    const confirmDelete = await confirm({title:"Xóa hình ảnh",message:`Xóa ${selectedImages.size} hình ảnh?`,type:"danger",confirmText:"Xóa"});
    if(!confirmDelete) return;

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
          console.error(`[ImageManagement] Error deleting image: ${imageName}`, error);
          errorCount++;
        }
      }
      
      // Clear selection and refresh
      updateSelectedImages(new Set());
      handleRefresh();
      
      if (errorCount > 0) {
        toast.success(`Đã xóa ${successCount} hình ảnh, ${errorCount} thất bại`);
      } else {
        toast.success(`Đã xóa ${successCount} hình ảnh`);
      }
    } finally {
      setDeletingState(false);
    }
  };

  const handleFolderChange = (event) => {
    setCurrentFolder(event.target.value);
  };

  // Clear selections when leaving page
  useEffect(() => {
    return () => {
      updateSelectedImages(new Set());
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [currentFolder, sortField, sortOrder, itemsPerPage]);

  return (
    <div className="relative">
      {/* ✅ OPTIMIZED: Lightweight loading indicator in button instead of full-screen overlay */}
      {isRefreshing && (
        <div className="fixed top-4 right-4 z-40 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 flex items-center gap-3">
          <FaSpinner className="animate-spin text-xl text-red-500" />
          <span className="text-sm font-medium text-gray-700">Đang tải...</span>
        </div>
      )}

      {/* Analysis progress bar (non-blocking) */}
      {isAnalyzing && (
        <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-1/2 z-40 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Đang phân tích hình ảnh...</span>
            <span className="text-sm font-medium text-gray-700">{analyzeProgress.completed}/{analyzeProgress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${analyzeProgress.total ? (analyzeProgress.completed / analyzeProgress.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          {/* Removed redundant title - already in breadcrumb */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Primary Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Upload Button - MOST IMPORTANT */}
            <UploadButton onUploadComplete={handleRefresh} folderPath={currentFolder} />

            {/* New Folder */}
            <button
              onClick={() => {
                setNewFolderName("");
                setModalError("");
                setShowNewFolderModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition text-sm"
            >
              <FaPlus className="h-4 w-4" /> 
              <span className="font-medium">Thư mục mới</span>
            </button>

            {currentFolder && (
              <>
                <button
                  onClick={() => {
                    setRenameInput(currentFolder.split("/").pop());
                    setModalType('rename');
                    setShowFolderModal(true);
                  }}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 shadow-sm text-sm"
                >
                  <MdEdit className="h-4 w-4" /> Đổi tên
                </button>

                <button
                  onClick={() => {
                    setModalType('delete');
                    setShowFolderModal(true);
                  }}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 shadow-sm text-sm"
                >
                  <MdDelete className="h-4 w-4" /> Xóa
                </button>
              </>
            )}
          </div>

          {/* Right: Secondary Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setCurrentFolder("")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition text-sm"
            >
              <IoHomeOutline className="h-4 w-4" /> 
              <span>Tất cả</span>
            </button>

            <select
              value={currentFolder}
              onChange={handleFolderChange}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">Chọn thư mục...</option>
              {folders.map((f) => {
                const depth = f.split("/").length - 1;
                const name = f.split("/").pop();
                return (
                  <option key={f} value={f}>{`${"\u00A0".repeat(depth*2)}${name}`}</option>
                );
              })}
            </select>

            <div className="h-6 w-px bg-gray-300"></div>

            <button
              onClick={handleSelectAll}
              className="flex items-center px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition text-sm"
            >
              {selectedImages.size === images.length && images.length > 0 ? (
                <MdCheckBox className="h-4 w-4" />
              ) : (
                <MdCheckBoxOutlineBlank className="h-4 w-4" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative sort-dropdown">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition text-sm"
              >
                <MdSort className="h-4 w-4 mr-1" />
                {getSortFieldDisplayName(sortField)}
                <MdKeyboardArrowDown className="h-4 w-4 ml-1" />
              </button>
              
              {showSortMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-navy-800 rounded-xl shadow-lg border border-gray-200 dark:border-navy-700 z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white border-b border-gray-200 dark:border-navy-700">
                      Sắp xếp theo
                    </div>
                    <button
                      onClick={() => handleSortFieldChange("CreatedAt")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-navy-700 ${
                        sortField === "CreatedAt" ? "text-brand-500 font-medium" : "text-gray-700 dark:text-white"
                      }`}
                    >
                      Ngày tạo
                    </button>
                    <button
                      onClick={() => handleSortFieldChange("ImageName")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-navy-700 ${
                        sortField === "ImageName" ? "text-brand-500 font-medium" : "text-gray-700 dark:text-white"
                      }`}
                    >
                      Tên
                    </button>
                    <button
                      onClick={() => handleSortFieldChange("Status")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-navy-700 ${
                        sortField === "Status" ? "text-brand-500 font-medium" : "text-gray-700 dark:text-white"
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
              className="flex items-center px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition text-sm"
            >
              <MdSort className="h-4 w-4 mr-1" />
              {getSortOrderDisplayName()}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center px-3 py-2 rounded-lg text-white transition text-sm ${
                isRefreshing ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              <MdRefresh className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
          </div>
        </div>


        {/* Breadcrumb navigation with back button */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm">
            {currentFolder && (
              <button 
                onClick={() => {
                  const parentFolder = currentFolder.split("/").slice(0, -1).join("/");
                  setCurrentFolder(parentFolder);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-blue-700 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <IoArrowBackOutline className="text-lg" />
                <span className="font-medium">Quay lại</span>
              </button>
            )}
            <div className="flex items-center flex-wrap gap-1 ml-2">
              <button onClick={() => setCurrentFolder("")} className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg text-amber-700 hover:from-amber-100 hover:to-orange-100 transition-all duration-200 font-medium">
                <IoHomeOutline className="text-lg" />
                <span>Gốc</span>
              </button>
              {currentFolder && currentFolder.split("/").map((part, idx, arr) => {
                const path = arr.slice(0, idx + 1).join("/");
                return (
                  <span key={path} className="flex items-center gap-1">
                    <span className="text-gray-400">/</span>
                    <button onClick={() => setCurrentFolder(path)} className="text-brand-500 hover:text-brand-600 font-medium">{part}</button>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selection Info */}
        {selectedImages.size > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">
              Đã chọn {selectedImages.size} / {images.length} hình ảnh
            </p>
          </div>
        )}

  {/* Folders Section - Always visible on first page */}
          {childFolders.length > 0 && currentPage === 1 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                  <IoFolderOpenOutline className="text-2xl text-blue-600" />
                  <h2 className="text-xl font-bold text-blue-800">Thư mục ({childFolders.length})</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
                {childFolders.map((fp) => (
                  <FolderCard key={fp} path={fp} currentFolder={currentFolder} onNavigate={setCurrentFolder} onRefresh={handleRefresh} />
                ))}
              </div>
            </div>
          )}

          {/* Images Section */}
          {images.length > 0 ? (
            <div className={childFolders.length > 0 && currentPage === 1 ? '' : ''}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <IoImagesOutline className="text-2xl text-green-600" />
                  <h2 className="text-xl font-bold text-green-800">Hình ảnh ({images.length})</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
                {images.map((img, index) => (
                  <NftCard
                    key={index}
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
            </div>
          ) : (
            /* Empty State */
            currentPage === 1 && childFolders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl">
                    <IoFolderOpenOutline className="text-6xl text-gray-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-600 mb-3">Thư mục trống</h3>
                <p className="text-gray-500 text-center max-w-md mb-6">Tạo thư mục mới hoặc tải ảnh lên để bắt đầu quản lý</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowNewFolderModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <FaPlus />
                    <span>Tạo thư mục</span>
                  </button>
                  <UploadButton onUploadComplete={handleRefresh} folderPath={currentFolder} />
                </div>
              </div>
            )
          )}

        <div className="flex justify-center mt-6 gap-1">
          <button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)} className="px-2.5 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">Trước</button>
          {Array.from({length: totalPages}).map((_,idx)=>{
            const page=idx+1;
            if(totalPages>7){
              const show=
                page===1||page===totalPages||
                Math.abs(page-currentPage)<=1||
                (currentPage<=3 && page<=4)||
                (currentPage>=totalPages-2 && page>=totalPages-3);
              if(!show) return idx===1||idx===totalPages-2? <span key={page} className="px-2">…</span>:null;
            }
            return (
              <button key={page} onClick={()=>setCurrentPage(page)} className={`px-2.5 py-1 rounded ${page===currentPage?"bg-brand-500 text-white":"bg-gray-200 hover:bg-gray-300"}`}>{page}</button>
            );
          })}
          <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)} className="px-2.5 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">Sau</button>
        </div>

        <div className="flex justify-end mt-4">
          <select value={itemsPerPage} onChange={(e)=>setItemsPerPage(parseInt(e.target.value))} className="border px-2 py-1 rounded text-sm">
            {[10,20,30,40,50].map(n=>(<option key={n} value={n}>{n} / trang</option>))}
          </select>
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl w-96 p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Tạo thư mục mới</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Tên thư mục"
              className="w-full px-4 py-2 mb-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {modalError && <p className="text-red-500 text-sm mb-2">{modalError}</p>}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (!newFolderName.trim()) {
                    setModalError("Tên thư mục là bắt buộc");
                    return;
                  }
                  const newPath = currentFolder ? `${currentFolder}/${newFolderName.trim()}` : newFolderName.trim();
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
                className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600"
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
            if (modalType === 'rename') {
              const parts = currentFolder.split("/");
              parts.pop();
              const parentPath = parts.join("/");
              const newPath = parentPath ? `${parentPath}/${value}` : value;
              try {
                await api.images.renameFolder(currentFolder, newPath);
                await handleRefresh();
                setCurrentFolder(newPath);
              } catch (e) { toast.error(e.message);}            
            } else {
              try {
                await api.images.deleteFolder(currentFolder);
                await handleRefresh();
                setCurrentFolder("");
              } catch (e) { toast.error(e.message);}            
            }
            setShowFolderModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ImageManagement;