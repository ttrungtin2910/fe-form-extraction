import { useEffect, useState } from "react";
import NftCard from "components/image/NftCard";
import FolderCard from "components/folder/FolderCard";
import UploadButton from "components/button/UploadButton";
import { MdRefresh, MdSort, MdKeyboardArrowDown, MdCheckBox, MdCheckBoxOutlineBlank, MdFolder, MdEdit, MdDelete, MdFolderOpen } from "react-icons/md";
import { FaPlayCircle, FaTrash, FaSpinner } from "react-icons/fa";
import { api } from "config/api";
import { useImageManagement } from "contexts/ImageManagementContext";
import FolderModal from "components/folder/FolderModal";
import { useToast, useConfirm } from "components/common/ToastProvider";

const ImageManagement = () => {
  const [images, setImages] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [folders, setFolders] = useState([]);
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

  const fetchImages = async (foldersArg = folders) => {
    console.log("[ImageManagement] Starting to fetch images");
    setIsRefreshing(true);
    try {
      const resp = currentFolder ? await api.images.getByFolder(currentFolder,{page:currentPage,limit:itemsPerPage}) : await api.images.getAll({page:currentPage,limit:itemsPerPage});
      const data = resp.data;
      // compute immediate child folders first
      const childFoldersLocal = foldersArg.filter(f => {
        if (currentFolder) {
          return f.startsWith(currentFolder + "/") && f.split("/").length === currentFolder.split("/").length + 1;
        }
        return f.split("/").length === 1;
      });
      setChildFolders(childFoldersLocal);

      const visibleOnFirst=Math.max(0,itemsPerPage-childFoldersLocal.length);
      const totalImages=resp.total||0;
      const totalPagesCalc=Math.max(1,Math.ceil((totalImages+visibleOnFirst)/itemsPerPage));
      setTotalPages(totalPagesCalc);
      
      console.log("[ImageManagement] Raw images data received:", data);
      
      const validImages = data.filter(
        (img) => img.ImagePath && img.ImageName && img.Status
      );
      console.log("[ImageManagement] Valid images filtered:", validImages.length);
      
      // At root view, only show images without FolderPath (i.e., residing in root)
      const scopedImages = currentFolder
        ? validImages // already filtered by API
        : validImages.filter((img) => !img.FolderPath);
      
      // Sort images based on sortField and sortOrder
      const sortedImages = scopedImages.sort((a, b) => {
        let valueA, valueB;
        
        switch (sortField) {
          case "CreatedAt":
            valueA = new Date(a.CreatedAt);
            valueB = new Date(b.CreatedAt);
            break;
          case "ImageName":
            valueA = a.ImageName.toLowerCase();
            valueB = b.ImageName.toLowerCase();
            break;
          case "Status":
            valueA = a.Status.toLowerCase();
            valueB = b.Status.toLowerCase();
            break;
          default:
            valueA = a[sortField];
            valueB = b[sortField];
        }
        
        if (sortOrder === "asc") {
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
          return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
      });
      
      console.log("[ImageManagement] Images sorted and set:", sortedImages.length);
      setImages(sortedImages);
      updateImages(sortedImages);
    } catch (error) {
      console.error("[ImageManagement] Error fetching images:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const folderData = await api.images.getFolders();
        const fetchedFolders = folderData.folders || [];
        setFolders(fetchedFolders);
        await fetchImages(fetchedFolders);
      } catch (e) {
        console.error("[ImageManagement] Failed to fetch folders", e);
      }
    };
    init();
  }, [sortField, sortOrder, currentFolder, currentPage, itemsPerPage]);

  // Set handlers for sidebar buttons
  useEffect(() => {
    setAnalyzeHandler(handleAnalyzeSelected);
    setDeleteHandler(handleDeleteSelected);
  }, [selectedImages, images]);

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
      setFolders(folderData.folders || []);
      await fetchImages(folderData.folders || []);
    } catch (e) {
      console.error("[ImageManagement] Failed to refresh folders", e);
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
        return "Date";
      case "ImageName":
        return "Name";
      case "Status":
        return "Status";
      default:
        return field;
    }
  };

  const getSortOrderDisplayName = () => {
    return sortOrder === "asc" ? "Ascending" : "Descending";
  };

  const handleImageSelect = (imageName, isSelected) => {
    console.log(`[ImageManagement] Image selection changed: ${imageName} -> ${isSelected}`);
    const newSet = new Set(selectedImages);
    if (isSelected) {
      newSet.add(imageName);
    } else {
      newSet.delete(imageName);
    }
    console.log(`[ImageManagement] Selected images count: ${newSet.size}`);
    updateSelectedImages(newSet);
  };

  const handleImageDelete = (imageName) => {
    console.log(`[ImageManagement] Handling delete for image: ${imageName}`);
    
    // Remove from selected images
    const newSet = new Set(selectedImages);
    newSet.delete(imageName);
    console.log(`[ImageManagement] Removed ${imageName} from selection`);
    updateSelectedImages(newSet);
    
    // Refresh the image list
    console.log("[ImageManagement] Refreshing image list after deletion");
    fetchImages();
  };

  const handleImageAnalyze = (result) => {
    console.log("[ImageManagement] Analysis result received:", result);
    // You can add additional handling here if needed
  };

  const handleSelectAll = () => {
    console.log("[ImageManagement] Select All clicked");
    if (selectedImages.size === images.length) {
      // If all are selected, deselect all
      updateSelectedImages(new Set());
      console.log("[ImageManagement] Deselected all images");
    } else {
      // Select all images
      const allImageNames = images.map(img => img.ImageName);
      updateSelectedImages(new Set(allImageNames));
      console.log(`[ImageManagement] Selected all ${allImageNames.length} images`);
    }
  };

  const handleAnalyzeSelected = async () => {
    if (selectedImages.size === 0) {
      toast.warn("Please select at least one image to analyze");
      return;
    }

    console.log(`[ImageManagement] Starting parallel analysis for ${selectedImages.size} selected images`);
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
        toast.warn(`${failedEnqueue} images failed to enqueue`);
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
        await new Promise(r => setTimeout(r, 1000));
      }

      fetchImages();
      toast.success(`Parallel analyzed ${totalImages - failedEnqueue} images${failedEnqueue ? ` (${failedEnqueue} failed to enqueue)` : ''}`);
    } finally {
      setAnalyzingState(false);
      clearAnalyzingImages();
      resetAnalyzeProgress();
      handleRefresh();
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) {
      toast.warn("Please select at least one image to delete");
      return;
    }

    const confirmDelete = await confirm({title:"Delete images",message:`Delete ${selectedImages.size} images?`,type:"danger",confirmText:"Delete"});
    if(!confirmDelete) return;

    console.log(`[ImageManagement] Starting bulk delete for ${selectedImages.size} selected images`);
    setDeletingState(true);
    
    try {
      const selectedImageNames = Array.from(selectedImages);
      let successCount = 0;
      let errorCount = 0;
      
      for (const imageName of selectedImageNames) {
        try {
          console.log(`[ImageManagement] Deleting image: ${imageName}`);
          await api.images.delete(imageName);
          console.log(`[ImageManagement] Successfully deleted: ${imageName}`);
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
        toast.success(`Deleted ${successCount} images, ${errorCount} failed`);
      } else {
        toast.success(`Deleted ${successCount} images`);
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
      {isRefreshing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 bg-white/80 rounded-2xl shadow-2xl">
            <FaSpinner className="animate-spin text-4xl text-red-500" />
            <span className="text-lg font-semibold text-gray-700">Loading...</span>
          </div>
        </div>
      )}

      {/* Analysis progress bar (non-blocking) */}
      {isAnalyzing && (
        <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-1/2 z-40 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Analyzing images...</span>
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
          <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
            Image Management
          </h2>
          <div className="flex items-center gap-3">
            {/* Select All Button */}
            <button
              onClick={handleSelectAll}
              className={`flex items-center px-4 py-2 rounded-xl text-white transition duration-200 ${
                selectedImages.size === images.length && images.length > 0
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800"
                  : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800"
              }`}
            >
              {selectedImages.size === images.length && images.length > 0 ? (
                <>
                  <MdCheckBox className="h-4 w-4 mr-2" />
                  Deselect All
                </>
              ) : (
                <>
                  <MdCheckBoxOutlineBlank className="h-4 w-4 mr-2" />
                  Select All
                </>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative sort-dropdown">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white transition duration-200 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800"
              >
                <MdSort className="h-4 w-4 mr-2" />
                Sort by {getSortFieldDisplayName(sortField)}
                <MdKeyboardArrowDown className="h-4 w-4 ml-2" />
              </button>
              
              {showSortMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-navy-800 rounded-xl shadow-lg border border-gray-200 dark:border-navy-700 z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white border-b border-gray-200 dark:border-navy-700">
                      Sort by Field
                    </div>
                    <button
                      onClick={() => handleSortFieldChange("CreatedAt")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-navy-700 ${
                        sortField === "CreatedAt" ? "text-brand-500 font-medium" : "text-gray-700 dark:text-white"
                      }`}
                    >
                      Date
                    </button>
                    <button
                      onClick={() => handleSortFieldChange("ImageName")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-navy-700 ${
                        sortField === "ImageName" ? "text-brand-500 font-medium" : "text-gray-700 dark:text-white"
                      }`}
                    >
                      Name
                    </button>
                    <button
                      onClick={() => handleSortFieldChange("Status")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-navy-700 ${
                        sortField === "Status" ? "text-brand-500 font-medium" : "text-gray-700 dark:text-white"
                      }`}
                    >
                      Status
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Order Toggle */}
            <button
              onClick={handleSortToggle}
              className="flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white transition duration-200 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800"
            >
              <MdSort className="h-4 w-4 mr-2" />
              {getSortOrderDisplayName()}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center px-4 py-2 rounded-xl text-white transition duration-200 ${
                isRefreshing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800"
              }`}
            >
              <MdRefresh className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          {/* All Folders quick button */}
          <button
            onClick={() => setCurrentFolder("")}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm transition"
          >
            <MdFolderOpen className="h-4 w-4" /> All Folders
          </button>

          {/* Folder dropdown */}
          <select
            value={currentFolder}
            onChange={handleFolderChange}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Folders</option>
            {folders.map((f) => {
              const depth = f.split("/").length - 1;
              const name = f.split("/").pop();
              return (
                <option key={f} value={f}>{`${"\u00A0".repeat(depth*2)}${name}`}</option>
              );
            })}
          </select>

          {/* New Folder */}
          <button
            onClick={() => {
              setNewFolderName("");
              setModalError("");
              setShowNewFolderModal(true);
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white text-sm hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 shadow-md"
          >
            <MdFolder className="h-4 w-4" /> New Folder
          </button>

          {/* Rename Folder */}
          {currentFolder && (
            <button
              onClick={() => {
                setRenameInput(currentFolder.split("/").pop());
                setModalType('rename');
                setShowFolderModal(true);
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-yellow-500 text-white text-sm hover:bg-yellow-600"
            >
              <MdEdit className="h-4 w-4" /> Rename
            </button>
          )}

          {/* Delete Folder */}
          {currentFolder && (
            <button
              onClick={() => {
                setModalType('delete');
                setShowFolderModal(true);
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
            >
              <MdDelete className="h-4 w-4" /> Delete
            </button>
          )}

          {/* Upload button passes folderPath */}
          <UploadButton onUploadComplete={handleRefresh} folderPath={currentFolder} />
        </div>

        {/* Breadcrumb navigation */}
        <div className="mb-4 text-sm flex items-center flex-wrap gap-1">
          <button onClick={() => setCurrentFolder("")} className="text-brand-500 hover:underline">Root</button>
          {currentFolder && currentFolder.split("/").map((part, idx, arr) => {
            const path = arr.slice(0, idx + 1).join("/");
            return (
              <span key={path} className="flex items-center gap-1">
                <span className="text-gray-400">/</span>
                <button onClick={() => setCurrentFolder(path)} className="text-brand-500 hover:underline">{part}</button>
              </span>
            );
          })}
        </div>

        {/* Selection Info */}
        {selectedImages.size > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">
              {selectedImages.size} of {images.length} images selected
            </p>
          </div>
        )}

  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
          {currentPage===1 && childFolders.map((fp) => (
            <FolderCard key={fp} path={fp} currentFolder={currentFolder} onNavigate={setCurrentFolder} onRefresh={handleRefresh} />
          ))}
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
              isSelected={selectedImages.has(img.ImageName)}
              onSelect={handleImageSelect}
              onDelete={handleImageDelete}
              onAnalyze={handleImageAnalyze}
              onRefresh={handleRefresh}
            />
          ))}
        </div>

        <div className="flex justify-center mt-6 gap-1">
          <button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)} className="px-2.5 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">Prev</button>
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
          <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)} className="px-2.5 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">Next</button>
        </div>

        <div className="flex justify-end mt-4">
          <select value={itemsPerPage} onChange={(e)=>setItemsPerPage(parseInt(e.target.value))} className="border px-2 py-1 rounded text-sm">
            {[10,20,30,40,50].map(n=>(<option key={n} value={n}>{n} / page</option>))}
          </select>
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl w-96 p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-4 py-2 mb-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {modalError && <p className="text-red-500 text-sm mb-2">{modalError}</p>}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newFolderName.trim()) {
                    setModalError("Folder name is required");
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
                    setModalError(e.message || "Failed to create folder");
                  }
                }}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600"
              >
                Create
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