import { useEffect, useState } from "react";
import { api } from "config/api";
import { POLLING_CONFIG } from "config/polling";
import UploadButton from "components/button/UploadButton";
import { FiRefreshCw, FiChevronUp, FiChevronDown } from "react-icons/fi";
import { MdCheckBox, MdCheckBoxOutlineBlank, MdRefresh } from "react-icons/md";
import { FaSpinner, FaChartBar, FaFileExcel } from "react-icons/fa";
import PieChart from "components/charts/PieChart";
import { useImageManagement } from "contexts/ImageManagementContext";
import { useToast, useConfirm } from "components/common/ToastProvider";
import { translateStatus } from "utils/statusTranslator";
import ImageDialog from "components/image/ImageDialog";
import { exportDashboardStats, exportImagesToExcel } from "utils/excelExport";

const statusColor = (status) => {
  if (status === "Completed") return "bg-green-100 text-green-700 border-green-200";
  if (status === "Uploaded") return "bg-red-100 text-red-700 border-red-200";
  if (status === "Verify") return "bg-purple-100 text-purple-700 border-purple-200";
  if (status === "Synced") return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const sortIcon = (field, sortBy, sortDir) => {
  if (sortBy !== field) return <FiChevronUp className="inline ml-1 text-gray-400" />;
  return sortDir === "asc" ? (
    <FiChevronUp className="inline ml-1 text-red-500" />
  ) : (
    <FiChevronDown className="inline ml-1 text-red-500" />
  );
};

function getStatusStats(images) {
  const stats = {};
  images.forEach(img => {
    stats[img.Status] = (stats[img.Status] || 0) + 1;
  });
  return stats;
}

// Format date to readable format with Vietnam timezone (+7)
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  
  try {
    // Check if it's in format: 20250804_024535_110625 (YYYYMMDD_HHMMSS_microseconds)
    const customFormatMatch = dateString.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_\d+$/);
    if (customFormatMatch) {
      const [, year, month, day, hours, minutes] = customFormatMatch;
      const utcDate = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00Z`);
      const vietnamDate = new Date(utcDate.getTime() + (0 * 60 * 60 * 1000));
      
      const dayStr = String(vietnamDate.getDate()).padStart(2, '0');
      const monthStr = String(vietnamDate.getMonth() + 1).padStart(2, '0');
      const yearStr = vietnamDate.getFullYear();
      const hoursStr = String(vietnamDate.getHours()).padStart(2, '0');
      const minutesStr = String(vietnamDate.getMinutes()).padStart(2, '0');
      return `${dayStr}/${monthStr}/${yearStr} ${hoursStr}:${minutesStr}`;
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const vietnamDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    const day = String(vietnamDate.getDate()).padStart(2, '0');
    const month = String(vietnamDate.getMonth() + 1).padStart(2, '0');
    const year = vietnamDate.getFullYear();
    const hours = String(vietnamDate.getHours()).padStart(2, '0');
    const minutes = String(vietnamDate.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return dateString;
  }
};

const Dashboard = () => {
  // Statistics state (for overview)
  const [statistics, setStatistics] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Images table state (for detailed view)
  const [images, setImages] = useState([]);
  const [extractedData, setExtractedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [sortDir, setSortDir] = useState("desc");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const itemsPerPage = 10;

  // State for non-blocking analysis progress
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeTotal, setAnalyzeTotal] = useState(0);

  // State for image detail dialog
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageDialog, setShowImageDialog] = useState(false);

  // Context for sidebar actions
  const {
    updateSelectedImages,
    setAnalyzeHandler,
    setDeleteHandler,
  } = useImageManagement();

  const toast = useToast();
  const confirmModal = useConfirm();

  // Fetch dashboard statistics (overview)
  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      const data = await api.statistics.getDashboard();
      setStatistics(data);
      console.log("Dashboard statistics loaded:", data);
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch images for table (detailed view) - ALL folders
  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      // Remove folderPath filter to get images from ALL folders
      const resp = await api.images.getAll({page:currentPage,limit:itemsPerPage});
      const imagesList = resp.data || [];
      const total = resp.total || 0;
      setImages(imagesList);
      setTotalImages(total);
      setLoading(false);
      
      fetchExtractedDataForPage(imagesList);
    } catch (err) {
      setError("Không thể tải hình ảnh");
      setLoading(false);
    }
  };

  // Fetch extracted data only for current page
  const fetchExtractedDataForPage = async (pageImages) => {
    const completedImages = pageImages.filter(img => img.Status === 'Completed');
    const imagesToFetch = completedImages.filter(img => !extractedData[img.ImageName]);
    
    if (imagesToFetch.length === 0) return;
    
    const extractionPromises = imagesToFetch.map(async (img) => {
      try {
        const formData = await api.formExtraction.getInfo({ ImageName: img.ImageName });
        return { imageName: img.ImageName, data: formData };
      } catch (err) {
        console.error(`Failed to fetch extraction data for ${img.ImageName}:`, err);
        return { imageName: img.ImageName, data: null };
      }
    });
    
    const extractionResults = await Promise.all(extractionPromises);
    const extractionMap = { ...extractedData };
    extractionResults.forEach(({ imageName, data }) => {
      if (data && data.analysis_result) {
        extractionMap[imageName] = data.analysis_result;
      }
    });
    setExtractedData(extractionMap);
  };

  // Export dashboard statistics to Excel
  const handleExportDashboard = async () => {
    try {
      setExporting(true);
      toast.info("Preparing dashboard export...");
      
      if (!statistics) {
        toast.error("No statistics data available");
        return;
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `dashboard_statistics_${timestamp}.xlsx`;
      
      exportDashboardStats(statistics, filename);
      toast.success("Dashboard statistics exported successfully!");
    } catch (error) {
      console.error("Error exporting dashboard:", error);
      toast.error("Failed to export dashboard statistics");
    } finally {
      setExporting(false);
    }
  };

  // Export all images with full details
  const handleExportAllImages = async () => {
    try {
      setExporting(true);
      toast.info("Fetching all images data...");
      
      const data = await api.statistics.exportAll();
      
      if (!data || !data.images || data.images.length === 0) {
        toast.warning("No images data available for export");
        return;
      }
      
      toast.info(`Exporting ${data.total} images...`);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `all_images_full_data_${timestamp}.xlsx`;
      
      await exportImagesToExcel(data.images, filename);
      toast.success(`Successfully exported ${data.total} images with full details!`);
    } catch (error) {
      console.error("Error exporting all images:", error);
      toast.error("Failed to export images data");
    } finally {
      setExporting(false);
    }
  };

  // Refresh all data
  const handleRefreshAll = () => {
    fetchStatistics();
    fetchImages();
  };

  useEffect(() => {
    fetchStatistics();
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    if (images.length > 0 && !loading) {
      const sorted = [...images].sort((a, b) => {
        let aVal = a[sortBy] || "";
        let bVal = b[sortBy] || "";
        if (sortBy === "CreatedAt") {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        } else {
          aVal = aVal.toString().toLowerCase();
          bVal = bVal.toString().toLowerCase();
        }
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginated = sorted.slice(startIndex, endIndex);
      
      if (paginated.length > 0) {
        fetchExtractedDataForPage(paginated);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, images, sortBy, sortDir]);

  useEffect(() => {
    updateSelectedImages(new Set(selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    setAnalyzeHandler(handleAnalyzeSelected);
    setDeleteHandler(handleDeleteSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  useEffect(() => {
    return () => {
      updateSelectedImages(new Set());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectAll = () => {
    if (selected.length === images.length && images.length > 0) {
      setSelected([]);
    } else {
      setSelected(images.map((img) => img.ImageName));
    }
  };

  const handleSelectRow = (title) => {
    setSelected((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleRowClick = (img) => {
    setSelectedImage(img);
    setShowImageDialog(true);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  // Sort images before rendering
  const sortedImages = [...images].sort((a, b) => {
    let aVal = a[sortBy] || "";
    let bVal = b[sortBy] || "";
    
    if (sortBy === "CreatedAt") {
      const customFormatMatchA = aVal.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_\d+$/);
      const customFormatMatchB = bVal.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_\d+$/);
      
      if (customFormatMatchA && customFormatMatchB) {
        const [, yearA, monthA, dayA, hoursA, minutesA] = customFormatMatchA;
        const [, yearB, monthB, dayB, hoursB, minutesB] = customFormatMatchB;
        aVal = new Date(`${yearA}-${monthA}-${dayA}T${hoursA}:${minutesA}:00Z`).getTime();
        bVal = new Date(`${yearB}-${monthB}-${dayB}T${hoursB}:${minutesB}:00Z`).getTime();
      } else {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
    } else {
      aVal = aVal.toString().toLowerCase();
      bVal = bVal.toString().toLowerCase();
    }
    
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(totalImages / itemsPerPage);
  const paginatedImages = sortedImages;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + paginatedImages.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [totalImages]);

  // Stats for pie chart - use ALL images from statistics (fallback to current page if API fails)
  const statusStats =
    statistics?.byStatus?.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {}) || getStatusStats(images);

  const statusLabels = Object.keys(statusStats);
  const statusLabelsVi = statusLabels.map((label) => translateStatus(label));
  const statusCounts = statusLabels.map((k) => statusStats[k]);
  const statusColors = ["#86efac", "#fca5a5", "#c4b5fd", "#fcd34d", "#d1d5db"];

  const pieOptions = {
    labels: statusLabelsVi,
    legend: { show: true, position: "bottom", fontSize: "12px", fontFamily: "Inter" },
    colors: statusColors,
    dataLabels: { 
      enabled: true,
      formatter: function (val, opts) {
        return opts.w.globals.seriesTotals[opts.seriesIndex];
      },
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        fontFamily: 'Inter'
      }
    },
    chart: { 
      id: "status-pie",
      toolbar: { show: false },
      animations: { enabled: true, speed: 800 }
    },
    stroke: { width: 2, colors: ['#ffffff'] },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: "horizontal",
        shadeIntensity: 0.25,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 0.85,
        stops: [0, 100]
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            name: { show: true, fontSize: '16px', fontWeight: 'bold' },
            value: { show: true, fontSize: '18px', fontWeight: 'bold' },
            total: { show: true, label: 'Total', fontSize: '16px', fontWeight: 'bold' }
          }
        }
      }
    },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: { height: 200 },
        legend: { position: 'bottom', fontSize: '10px' }
      }
    }]
  };

  // Analyze selected images
  async function handleAnalyzeSelected() {
    if (selected.length === 0) return;
    setAnalyzing(true);
    setAnalyzeTotal(selected.length);
    setAnalyzeProgress(0);
    try {
      const targetImages = images.filter(img => selected.includes(img.ImageName));
      const dispatch = await Promise.all(targetImages.map(async img => {
        try {
          const r = await api.queue.extract({
            ImageName: img.ImageName,
            Size: Number(img.Size || 0),
            ImagePath: img.ImagePath,
            Status: img.Status,
            CreatedAt: img.CreatedAt,
            FolderPath: img.FolderPath || "",
          });
          return { taskId: r.task_id, image: img.ImageName };
        } catch(e){
          return { taskId: null, image: img.ImageName, error: e };
        }
      }));
      const valid = dispatch.filter(d=>d.taskId);
      const failed = dispatch.length - valid.length;
      let attempts=0; const maxAttempts=180; const stateMap=new Map();
      while(true){
        attempts++;
        const pending = valid.filter(v=>{ const st=stateMap.get(v.taskId); return !(st==='SUCCESS'||st==='FAILURE');});
        if(!pending.length) break;
        await Promise.all(pending.map(async p=>{ try{ const st= await api.queue.taskStatus(p.taskId); stateMap.set(p.taskId, st.state);}catch{}}));
        const doneCount = valid.filter(v=>{ const st=stateMap.get(v.taskId); return st==='SUCCESS'||st==='FAILURE';}).length;
        setAnalyzeProgress(doneCount + failed);
        if(doneCount + failed >= dispatch.length) break;
        if(attempts>=maxAttempts) break;
        await new Promise(r=>setTimeout(r,POLLING_CONFIG.TASK_STATUS_INTERVAL));
      }
      fetchStatistics();
      fetchImages();
      setSelected([]);
    } finally {
      setAnalyzing(false);
      setAnalyzeProgress(0);
      setAnalyzeTotal(0);
    }
  }

  // Delete selected images
  async function handleDeleteSelected() {
    if (selected.length === 0) return;
    const ok = await confirmModal({title:"Xóa hình ảnh",message:`Xóa ${selected.length} hình ảnh?`,type:"danger",confirmText:"Xóa"});
    if(!ok) return;
    setLoading(true);
    try {
      for (let i = 0; i < selected.length; i++) {
        const img = images.find((img) => img.ImageName === selected[i]);
        if (!img) continue;
        await api.images.delete(img.ImageName);
      }
      fetchStatistics();
      fetchImages();
      setSelected([]);
      toast.success("Đã xóa hình ảnh");
    } finally {
      setLoading(false);
    }
  }

  // Get summary data with defaults
  const summary = statistics?.summary || {
    totalImages: 0,
    uploaded: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    totalSize: 0,
    avgSize: 0,
  };

const totalImageCount = summary.totalImages || totalImages || images.length;

  return (
    <div className="p-1 bg-gray-50 min-h-screen relative">
      {/* Analysis progress bar (non-blocking) */}
      {analyzing && (
        <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-1/2 z-40 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Đang phân tích hình ảnh...</span>
            <span className="text-sm font-medium text-gray-700">{analyzeProgress}/{analyzeTotal}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${analyzeTotal ? (analyzeProgress / analyzeTotal) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="max-w-full mx-auto px-1">
        {/* Statistics Overview Section */}
        <div className="mb-8">
          {/* Stats Cards Row - Using statistics from API */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Images Card */}
            <div className="group relative overflow-hidden bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-red-500/10 transition-colors"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-800">
                      {statsLoading ? "..." : summary.totalImages.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Tổng số hình ảnh</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {statsLoading ? "..." : `${summary.totalSize.toFixed(2)} MB tổng`}
                </div>
              </div>
            </div>

            {/* Completed Card */}
            <div className="group relative overflow-hidden bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-green-500/10 transition-colors"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-800">
                      {statsLoading ? "..." : summary.completed.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Hoàn thành</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {statsLoading ? "..." : `${((summary.completed / summary.totalImages) * 100 || 0).toFixed(1)}% tổng số`}
                </div>
              </div>
            </div>

            {/* Processing Card */}
            <div className="group relative overflow-hidden bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-orange-500/10 transition-colors"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-800">
                      {statsLoading ? "..." : summary.processing.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Đang xử lý</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {statsLoading ? "..." : `${summary.uploaded} đã tải lên`}
                </div>
              </div>
            </div>

            {/* Failed Card */}
            <div className="group relative overflow-hidden bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gray-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-gray-500/10 transition-colors"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-800">
                      {statsLoading ? "..." : summary.failed.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Thất bại</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {statsLoading ? "..." : `TB: ${summary.avgSize.toFixed(2)} MB`}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Pie Chart Card */}
            <div className="relative overflow-hidden bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Phân bổ trạng thái</h3>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-red-700">Thời gian thực</span>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-80 h-80">
                  <PieChart series={statusCounts} options={pieOptions} />
                </div>
              </div>
            </div>

            {/* Status Legend Card */}
            <div className="relative overflow-hidden bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
              <h3 className="text-xl font-bold text-gray-800 mb-6">Chi tiết trạng thái</h3>
              <div className="space-y-3">
                {statusLabels.map((label, idx) => {
                  const percentage =
                    totalImageCount > 0 ? ((statusStats[label] || 0) / totalImageCount) * 100 : 0;
                  return (
                    <div key={label} className="group">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ background: statusColors[idx % statusColors.length] }}></div>
                          <span className="font-semibold text-gray-800">{translateStatus(label)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-gray-800">{statusStats[label] || 0}</span>
                          <span className="text-sm font-medium text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-200">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Summary Stats */}
              <div className="mt-6 p-6 bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-md text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-white/90 font-medium">Tỷ lệ xử lý</div>
                        <div className="text-2xl font-bold">
                          {totalImageCount > 0 ? ((statusStats["Completed"] || 0) / totalImageCount * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${totalImageCount > 0 ? ((statusStats["Completed"] || 0) / totalImageCount * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar - Refresh and Export Buttons */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-navy-800 rounded-xl shadow-md mb-6">
            <div>
              <h2 className="text-xl font-bold text-navy-700 dark:text-white">
                Danh Sách Hình Ảnh Chi Tiết
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ✓ Dữ liệu từ tất cả {statistics?.byFolder?.length || 0} thư mục
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={handleRefreshAll}
                disabled={statsLoading || loading}
                className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-navy-700 px-4 py-2 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-navy-600 disabled:opacity-50 transition-all"
                title="Làm mới dữ liệu"
              >
                <MdRefresh className={`h-5 w-5 ${(statsLoading || loading) ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Làm mới</span>
              </button>
              
              {/* Export Statistics Button */}
              <button
                onClick={handleExportDashboard}
                disabled={exporting || statsLoading}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50 transition-all"
                title="Xuất thống kê ra Excel"
              >
                <FaChartBar className="h-4 w-4" />
                <span className="hidden md:inline">Xuất Thống Kê</span>
                {exporting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              </button>
              
              {/* Export All Data Button */}
              <button
                onClick={handleExportAllImages}
                disabled={exporting || statsLoading}
                className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50 transition-all"
                title="Xuất tất cả dữ liệu ra Excel"
              >
                <FaFileExcel className="h-4 w-4" />
                <span className="hidden md:inline">Xuất Dữ Liệu</span>
                {exporting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="flex items-center gap-2 mb-3">
          <UploadButton onUploadComplete={() => { fetchStatistics(); fetchImages(); }} />
          <button
            onClick={() => { fetchStatistics(); fetchImages(); }}
            className="flex items-center justify-center px-4 py-2 rounded-lg bg-white border border-gray-200 shadow hover:bg-gray-100 text-gray-700 font-semibold text-sm transition h-[42px]"
            style={{ minWidth: 0 }}
          >
            <FiRefreshCw className="mr-2 text-base" /> Làm mới
          </button>
          <span className="ml-auto text-sm text-gray-500">
            Đã chọn: <span className="font-semibold text-gray-700">{selected.length}</span>
            <span className="mx-2">|</span>
            Trang <span className="font-semibold text-gray-700">{currentPage}</span> / <span className="font-semibold text-gray-700">{totalPages}</span>
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <FaSpinner className="animate-spin text-3xl text-red-500 mr-3" />
            <span className="text-lg text-gray-600">Đang tải dữ liệu...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500 text-lg">{error}</div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible bg-white rounded-xl shadow border border-gray-100">
            <table className="min-w-[1200px] w-full divide-y divide-gray-100">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-3 py-2">
                    <button
                      onClick={handleSelectAll}
                      className="focus:outline-none"
                      aria-label={selected.length === images.length && images.length > 0 ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    >
                      {selected.length === images.length && images.length > 0 ? (
                        <MdCheckBox className="w-5 h-5 text-red-500 transition" />
                      ) : (
                        <MdCheckBoxOutlineBlank className="w-5 h-5 text-gray-400 hover:text-red-500 transition" />
                      )}
                    </button>
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("ImageName")}
                  >
                    Tên hình ảnh {sortIcon("ImageName", sortBy, sortDir)}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Thư mục
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("Status")}
                  >
                    Trạng thái {sortIcon("Status", sortBy, sortDir)}
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("CreatedAt")}
                  >
                    Ngày tạo {sortIcon("CreatedAt", sortBy, sortDir)}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Tải lên bởi
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Họ và Tên
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Điện thoại
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Trường THPT
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedImages.map((img, idx) => {
                  const extracted = extractedData[img.ImageName] || {};
                  const rowNumber = startIndex + idx + 1;
                  return (
                    <tr
                      key={img.ImageName || idx}
                      className={
                        selected.includes(img.ImageName)
                          ? "bg-red-50/60 hover:bg-red-100/80 cursor-pointer"
                          : "hover:bg-gray-50 transition cursor-pointer"
                      }
                      onClick={() => handleRowClick(img)}
                    >
                      <td className="px-3 py-2 text-center text-sm font-medium text-gray-600">
                        {rowNumber}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRow(img.ImageName);
                          }}
                          className="focus:outline-none"
                          aria-label={selected.includes(img.ImageName) ? "Bỏ chọn" : "Chọn"}
                        >
                          {selected.includes(img.ImageName) ? (
                            <MdCheckBox className="w-5 h-5 text-red-500 transition" />
                          ) : (
                            <MdCheckBoxOutlineBlank className="w-5 h-5 text-gray-400 hover:text-red-500 transition" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(img);
                          }}
                          className="text-left font-medium text-blue-600 hover:text-red-600 hover:underline text-sm transition-colors"
                        >
                          {img.ImageName}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        {img.FolderPath ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            {img.FolderPath}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Gốc</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${statusColor(
                            img.Status
                          )}`}
                        >
                          {translateStatus(img.Status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(img.CreatedAt)}
                      </td>
                      <td className="px-3 py-2">
                        {img.UploadBy ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {img.UploadBy}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-700 text-sm">
                        {extracted.ho_va_ten || "-"}
                      </td>
                      <td className="px-3 py-2 text-gray-700 text-sm">
                        {extracted.dien_thoai || "-"}
                      </td>
                      <td className="px-3 py-2 text-gray-700 text-sm">
                        {extracted.email || "-"}
                      </td>
                      <td className="px-3 py-2 text-gray-700 text-sm">
                        {extracted.truong_thpt || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-semibold">{startIndex + 1}</span> đến <span className="font-semibold">{endIndex}</span> trong tổng số <span className="font-semibold">{totalImages}</span> kết quả
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Trước
                  </button>
                  
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                              currentPage === page
                                ? 'bg-brand-500 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="px-2 py-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Detail Dialog */}
      {showImageDialog && selectedImage && (
        <ImageDialog
          open={showImageDialog}
          image={selectedImage.ImagePath}
          title={selectedImage.ImageName}
          size={selectedImage.Size}
          status={selectedImage.Status}
          createAt={selectedImage.CreatedAt}
          folderPath={selectedImage.FolderPath}
          uploadBy={selectedImage.UploadBy}
          onClose={() => {
            setShowImageDialog(false);
            setSelectedImage(null);
          }}
          onAnalyze={async (result) => {
            if (result) {
              toast.success("Phân tích thành công");
              fetchStatistics();
              fetchImages();
            }
          }}
          onDelete={(imageName) => {
            setImages(prev => prev.filter(img => img.ImageName !== imageName));
            setSelected(prev => prev.filter(name => name !== imageName));
            toast.success("Đã xóa hình ảnh");
            fetchStatistics();
          }}
          onRefresh={() => {
            fetchStatistics();
            fetchImages();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
