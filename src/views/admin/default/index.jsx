import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "config/api";
import { POLLING_CONFIG } from "config/polling";
import UploadButton from "components/button/UploadButton";
import {
  ArrowPathIcon as FiRefreshCw,
  ChevronUpIcon as FiChevronUp,
  ChevronDownIcon as FiChevronDown,
  ArrowPathIcon as FaSpinner,
  ChartBarIcon as FaChartBar,
  DocumentArrowDownIcon as FaFileExcel,
  CheckIcon as MdCheckBox,
  ArrowPathIcon as MdRefresh,
  PhotoIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { Square2StackIcon as MdCheckBoxOutlineBlank } from "@heroicons/react/24/outline";
import { useImageManagement } from "contexts/ImageManagementContext";
import { useToast, useConfirm } from "components/common/ToastProvider";
import { translateStatus } from "utils/statusTranslator";
import ImageDialog from "components/image/ImageDialog";
import { exportDashboardStats, exportImagesToExcel } from "utils/excelExport";
import Button from "components/button/Button";
import BlurText from "components/animations/BlurText";
import DateRangePicker from "components/dateRangePicker/DateRangePicker";

const statusColor = (status) => {
  if (status === "Completed")
    return "bg-green-100 text-green-700 border-green-200";
  if (status === "Uploaded") return "bg-red-100 text-red-700 border-red-200";
  if (status === "Verify")
    return "bg-purple-100 text-purple-700 border-purple-200";
  if (status === "Synced")
    return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const sortIcon = (field, sortBy, sortDir) => {
  if (sortBy !== field)
    return <FiChevronUp className="ml-1 inline h-3 w-3 text-white/40" />;
  return sortDir === "asc" ? (
    <FiChevronUp className="ml-1 inline h-3 w-3 text-red-400" />
  ) : (
    <FiChevronDown className="ml-1 inline h-3 w-3 text-red-400" />
  );
};

function getStatusStats(images) {
  const stats = {};
  images.forEach((img) => {
    stats[img.Status] = (stats[img.Status] || 0) + 1;
  });
  return stats;
}

// Format date to readable format with Vietnam timezone (+7)
const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  try {
    // Check if it's in format: 20250804_024535_110625 (YYYYMMDD_HHMMSS_microseconds)
    const customFormatMatch = dateString.match(
      /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_\d+$/
    );
    if (customFormatMatch) {
      const [, year, month, day, hours, minutes] = customFormatMatch;
      const utcDate = new Date(
        `${year}-${month}-${day}T${hours}:${minutes}:00Z`
      );
      const vietnamDate = new Date(utcDate.getTime() + 0 * 60 * 60 * 1000);

      const dayStr = String(vietnamDate.getDate()).padStart(2, "0");
      const monthStr = String(vietnamDate.getMonth() + 1).padStart(2, "0");
      const yearStr = vietnamDate.getFullYear();
      const hoursStr = String(vietnamDate.getHours()).padStart(2, "0");
      const minutesStr = String(vietnamDate.getMinutes()).padStart(2, "0");
      return `${dayStr}/${monthStr}/${yearStr} ${hoursStr}:${minutesStr}`;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const vietnamDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const day = String(vietnamDate.getDate()).padStart(2, "0");
    const month = String(vietnamDate.getMonth() + 1).padStart(2, "0");
    const year = vietnamDate.getFullYear();
    const hours = String(vietnamDate.getHours()).padStart(2, "0");
    const minutes = String(vietnamDate.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return dateString;
  }
};

const Dashboard = () => {
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

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };
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
  const [dateRange, setDateRange] = useState(() => {
    // Set default start date to 1/1/2025
    const defaultStartDate = "2025-01-01";
    // Set default end date to today
    const today = new Date();
    const defaultEndDate = today.toISOString().split("T")[0];
    return {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    };
  });

  // Cache for extracted data with TTL (5 minutes)
  const extractedDataCacheRef = useRef(new Map());
  const pendingRequestsRef = useRef(new Set());
  const CACHE_DURATION_MS = useMemo(() => 5 * 60 * 1000, []); // 5 minutes

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
  const { updateSelectedImages, setAnalyzeHandler, setDeleteHandler } =
    useImageManagement();

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
      const resp = await api.images.getAll({
        page: currentPage,
        limit: itemsPerPage,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
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

  // Fetch extracted data only for current page with caching
  const fetchExtractedDataForPage = useCallback(
    async (pageImages) => {
      const completedImages = pageImages.filter(
        (img) => img.Status === "Completed"
      );

      // Check cache and filter out images that are already cached and valid
      const now = Date.now();
      const imagesToFetch = completedImages.filter((img) => {
        // Check if already in state
        if (extractedData[img.ImageName]) {
          return false;
        }

        // Check cache
        const cached = extractedDataCacheRef.current.get(img.ImageName);
        if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
          return false;
        }

        // Check if request is already pending
        if (pendingRequestsRef.current.has(img.ImageName)) {
          return false;
        }

        return true;
      });

      if (imagesToFetch.length === 0) {
        // Still update state from cache if needed
        const cacheMap = { ...extractedData };
        let hasNewData = false;
        completedImages.forEach((img) => {
          if (!cacheMap[img.ImageName]) {
            const cached = extractedDataCacheRef.current.get(img.ImageName);
            if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
              cacheMap[img.ImageName] = cached.data;
              hasNewData = true;
            }
          }
        });
        if (hasNewData) {
          setExtractedData(cacheMap);
        }
        return;
      }

      // Mark requests as pending
      imagesToFetch.forEach((img) => {
        pendingRequestsRef.current.add(img.ImageName);
      });

      try {
        // Use batch endpoint if available, otherwise fallback to individual calls
        let extractionResults = [];

        if (imagesToFetch.length > 1 && api.formExtraction.getInfoBatch) {
          // Use batch endpoint
          try {
            const imageNames = imagesToFetch.map((img) => img.ImageName);
            const batchResult = await api.formExtraction.getInfoBatch({
              ImageNames: imageNames,
            });

            // Transform batch result to match individual format
            // batchResult.results is a dict with ImageName as key
            if (batchResult && batchResult.results) {
              extractionResults = Object.entries(batchResult.results)
                .filter(([_, item]) => item !== null) // Filter out null results
                .map(([imageName, item]) => ({
                  imageName: imageName,
                  data: item,
                }));
            }
          } catch (batchErr) {
            console.warn(
              "Batch endpoint failed, falling back to individual calls:",
              batchErr
            );
            // Fallback to individual calls
            const extractionPromises = imagesToFetch.map(async (img) => {
              try {
                const formData = await api.formExtraction.getInfo({
                  ImageName: img.ImageName,
                });
                return { imageName: img.ImageName, data: formData };
              } catch (err) {
                console.error(
                  `Failed to fetch extraction data for ${img.ImageName}:`,
                  err
                );
                return { imageName: img.ImageName, data: null };
              }
            });
            extractionResults = await Promise.all(extractionPromises);
          }
        } else {
          // Individual calls
          const extractionPromises = imagesToFetch.map(async (img) => {
            try {
              const formData = await api.formExtraction.getInfo({
                ImageName: img.ImageName,
              });
              return { imageName: img.ImageName, data: formData };
            } catch (err) {
              console.error(
                `Failed to fetch extraction data for ${img.ImageName}:`,
                err
              );
              return { imageName: img.ImageName, data: null };
            }
          });
          extractionResults = await Promise.all(extractionPromises);
        }

        // Update cache and state
        const extractionMap = { ...extractedData };
        extractionResults.forEach(({ imageName, data }) => {
          if (data && data.analysis_result) {
            extractionMap[imageName] = data.analysis_result;
            // Update cache
            extractedDataCacheRef.current.set(imageName, {
              data: data.analysis_result,
              timestamp: now,
            });
          }
        });
        setExtractedData(extractionMap);
      } finally {
        // Remove from pending requests
        imagesToFetch.forEach((img) => {
          pendingRequestsRef.current.delete(img.ImageName);
        });
      }
    },
    [extractedData, CACHE_DURATION_MS]
  );

  // Export dashboard statistics to Excel
  const handleExportDashboard = async () => {
    try {
      setExporting(true);
      toast.info("Preparing dashboard export...");

      if (!statistics) {
        toast.error("No statistics data available");
        return;
      }

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
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

      const data = await api.statistics.exportAll({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      if (!data || !data.images || data.images.length === 0) {
        toast.warning("No images data available for export");
        return;
      }

      toast.info(`Exporting ${data.total} images...`);

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      const dateRangeSuffix =
        dateRange.startDate || dateRange.endDate
          ? `_${dateRange.startDate || "all"}_${dateRange.endDate || "all"}`
          : "";
      const filename = `all_images_full_data${dateRangeSuffix}_${timestamp}.xlsx`;

      await exportImagesToExcel(data.images, filename);
      toast.success(
        `Successfully exported ${data.total} images with full details!`
      );
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
  }, [currentPage, dateRange.startDate, dateRange.endDate]);

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
      const customFormatMatchA = aVal.match(
        /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_\d+$/
      );
      const customFormatMatchB = bVal.match(
        /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_\d+$/
      );

      if (customFormatMatchA && customFormatMatchB) {
        const [, yearA, monthA, dayA, hoursA, minutesA] = customFormatMatchA;
        const [, yearB, monthB, dayB, hoursB, minutesB] = customFormatMatchB;
        aVal = new Date(
          `${yearA}-${monthA}-${dayA}T${hoursA}:${minutesA}:00Z`
        ).getTime();
        bVal = new Date(
          `${yearB}-${monthB}-${dayB}T${hoursB}:${minutesB}:00Z`
        ).getTime();
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
  // const statusCounts = statusLabels.map((k) => statusStats[k]); // Reserved for future use
  const statusColors = ["#86efac", "#fca5a5", "#c4b5fd", "#fcd34d", "#d1d5db"];

  // const pieOptions = { // Reserved for future use
  //   labels: statusLabelsVi,
  //   legend: {
  //     show: true,
  //     position: "bottom",
  //     fontSize: "12px",
  //     fontFamily:
  //       "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif",
  //   },
  //   colors: statusColors,
  //   dataLabels: {
  //     enabled: true,
  //     formatter: function (val, opts) {
  //       return opts.w.globals.seriesTotals[opts.seriesIndex];
  //     },
  //     style: {
  //       fontSize: "14px",
  //       fontWeight: "bold",
  //       fontFamily:
  //         "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif",
  //     },
  //   },
  //   chart: {
  //     id: "status-pie",
  //     toolbar: { show: false },
  //     animations: { enabled: true, speed: 800 },
  //   },
  //   stroke: { width: 2, colors: ["#ffffff"] },
  //   fill: {
  //     type: "gradient",
  //     gradient: {
  //       shade: "light",
  //       type: "horizontal",
  //       shadeIntensity: 0.25,
  //       gradientToColors: undefined,
  //       inverseColors: true,
  //       opacityFrom: 1,
  //       opacityTo: 0.85,
  //       stops: [0, 100],
  //     },
  //   },
  //   plotOptions: {
  //     pie: {
  //       donut: {
  //         size: "60%",
  //         labels: {
  //           show: true,
  //           name: { show: true, fontSize: "16px", fontWeight: "bold" },
  //           value: { show: true, fontSize: "18px", fontWeight: "bold" },
  //           total: {
  //             show: true,
  //             label: "Total",
  //             fontSize: "16px",
  //             fontWeight: "bold",
  //           },
  //         },
  //       },
  //     },
  //   },
  //   responsive: [
  //     {
  //       breakpoint: 768,
  //       options: {
  //         chart: { height: 200 },
  //         legend: { position: "bottom", fontSize: "10px" },
  //       },
  //     },
  //   ],
  // };

  // Analyze selected images
  async function handleAnalyzeSelected() {
    if (selected.length === 0) return;
    setAnalyzing(true);
    setAnalyzeTotal(selected.length);
    setAnalyzeProgress(0);
    try {
      const targetImages = images.filter((img) =>
        selected.includes(img.ImageName)
      );
      const dispatch = await Promise.all(
        targetImages.map(async (img) => {
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
          } catch (e) {
            return { taskId: null, image: img.ImageName, error: e };
          }
        })
      );
      const valid = dispatch.filter((d) => d.taskId);
      const failed = dispatch.length - valid.length;
      let attempts = 0;
      const maxAttempts = 180;
      const stateMap = new Map();
      while (true) {
        attempts++;
        const pending = valid.filter((v) => {
          const st = stateMap.get(v.taskId);
          return !(st === "SUCCESS" || st === "FAILURE");
        });
        if (!pending.length) break;
        await Promise.all(
          pending.map(async (p) => {
            try {
              const st = await api.queue.taskStatus(p.taskId);
              stateMap.set(p.taskId, st.state);
            } catch {}
          })
        );
        const doneCount = valid.filter((v) => {
          const st = stateMap.get(v.taskId);
          return st === "SUCCESS" || st === "FAILURE";
        }).length;
        setAnalyzeProgress(doneCount + failed);
        if (doneCount + failed >= dispatch.length) break;
        if (attempts >= maxAttempts) break;
        await new Promise((r) =>
          setTimeout(r, POLLING_CONFIG.TASK_STATUS_INTERVAL)
        );
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
    const ok = await confirmModal({
      title: "Xóa hình ảnh",
      message: `Xóa ${selected.length} hình ảnh?`,
      type: "danger",
      confirmText: "Xóa",
    });
    if (!ok) return;
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

  // const totalImageCount = summary.totalImages || totalImages || images.length; // Reserved for future use

  return (
    <motion.div
      className="relative min-h-screen overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* DarkVeil Background is now in Admin Layout - applies to all admin pages */}

      {/* Main Content */}
      <div className="relative z-10 p-4 md:p-6">
        {/* Analysis progress bar (non-blocking) */}
        {analyzing && (
          <div className="fixed bottom-4 left-4 right-4 z-40 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur-sm md:left-1/2 md:w-1/2 md:-translate-x-1/2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Đang phân tích hình ảnh...
              </span>
              <span className="text-sm font-medium text-gray-700">
                {analyzeProgress}/{analyzeTotal}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${
                    analyzeTotal ? (analyzeProgress / analyzeTotal) * 100 : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm"
            >
              <FaChartBar className="h-8 w-8 text-white" />
            </motion.div>

            <BlurText
              text=" Bảng Điều Khiển Tổng Quan"
              animateBy="words"
              direction="top"
              delay={150}
              className="mb-4 text-3xl font-bold leading-normal tracking-normal text-white md:text-4xl"
            />

            <motion.p
              variants={itemVariants}
              className="text-sm leading-normal text-white/70 md:text-base"
            >
              Thống kê và quản lý hình ảnh trích xuất dữ liệu với giao diện hiện
              đại
            </motion.p>
          </div>
        </motion.div>

        <div className="mx-auto max-w-full px-1">
          {/* Statistics Overview Section */}
          <motion.div className="mb-8" variants={itemVariants}>
            {/* Stats Cards Row - Using statistics from API */}
            <motion.div
              className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
              variants={itemVariants}
            >
              {/* Total Images Card */}
              <motion.div
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl transition-all hover:bg-white/10"
                variants={cardVariants}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-2 text-sm font-medium text-white/70">
                      Tổng số hình ảnh
                    </p>
                    <p className="text-3xl font-bold text-white transition-colors group-hover:text-red-300">
                      {statsLoading
                        ? "..."
                        : summary.totalImages.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs font-medium text-white/50">
                      {statsLoading
                        ? "..."
                        : `${summary.totalSize.toFixed(2)} MB tổng`}
                    </p>
                  </div>
                  <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/20 backdrop-blur-sm"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <PhotoIcon className="h-8 w-8 text-red-300" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Completed Card */}
              <motion.div
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl transition-all hover:bg-white/10"
                variants={cardVariants}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-2 text-sm font-medium text-white/70">
                      Hoàn thành
                    </p>
                    <p className="text-3xl font-bold text-white transition-colors group-hover:text-green-300">
                      {statsLoading
                        ? "..."
                        : summary.completed.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs font-medium text-white/50">
                      {statsLoading
                        ? "..."
                        : `${(
                            (summary.completed / summary.totalImages) * 100 || 0
                          ).toFixed(1)}% tổng số`}
                    </p>
                  </div>
                  <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border border-green-400/30 bg-green-500/20 backdrop-blur-sm"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <CheckCircleIcon className="h-8 w-8 text-green-300" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Processing Card */}
              <motion.div
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl transition-all hover:bg-white/10"
                variants={cardVariants}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-2 text-sm font-medium text-white/70">
                      Đang xử lý
                    </p>
                    <p className="text-3xl font-bold text-white transition-colors group-hover:text-orange-300">
                      {statsLoading
                        ? "..."
                        : summary.processing.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs font-medium text-white/50">
                      {statsLoading ? "..." : `${summary.uploaded} đã tải lên`}
                    </p>
                  </div>
                  <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-400/30 bg-orange-500/20 backdrop-blur-sm"
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <ClockIcon className="h-8 w-8 text-orange-300" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Failed Card */}
              <motion.div
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl transition-all hover:bg-white/10"
                variants={cardVariants}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-2 text-sm font-medium text-white/70">
                      Thất bại / Cần xem lại
                    </p>
                    <p className="text-3xl font-bold text-white transition-colors group-hover:text-purple-300">
                      {statsLoading ? "..." : summary.failed.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs font-medium text-white/50">
                      {statsLoading
                        ? "..."
                        : `TB: ${summary.avgSize.toFixed(2)} MB`}
                    </p>
                  </div>
                  <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-400/30 bg-purple-500/20 backdrop-blur-sm"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <DocumentTextIcon className="h-8 w-8 text-purple-300" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Enhanced Chart Section */}

          {/* Action Bar - Refresh and Export Buttons */}
          <motion.div
            className="relative z-30 mb-6 flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
            variants={itemVariants}
          >
            <div>
              <h2 className="text-xl font-bold text-white">
                Danh Sách Hình Ảnh Chi Tiết
              </h2>
              <p className="mt-1 text-sm text-white/70">
                ✓ Dữ liệu từ tất cả {statistics?.byFolder?.length || 0} thư mục
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Date Range Picker */}
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={setDateRange}
              />

              {/* Refresh Button */}
              <button
                onClick={handleRefreshAll}
                disabled={statsLoading || loading}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                title="Làm mới dữ liệu"
              >
                <MdRefresh
                  className={`h-5 w-5 ${
                    statsLoading || loading ? "animate-spin" : ""
                  }`}
                />
                <span className="hidden md:inline">Làm mới</span>
              </button>

              {/* Export Statistics Button */}
              <Button
                onClick={handleExportDashboard}
                disabled={exporting || statsLoading}
                isLoading={exporting}
                variant="blue"
                size="md"
                leftIcon={<FaChartBar className="h-4 w-4" />}
                title="Xuất thống kê ra Excel"
                className="flex-shrink-0 whitespace-nowrap"
              >
                <span className="hidden md:inline">Xuất Thống Kê</span>
              </Button>

              {/* Export All Data Button */}
              <Button
                onClick={handleExportAllImages}
                disabled={exporting || statsLoading}
                isLoading={exporting}
                variant="success"
                size="md"
                leftIcon={<FaFileExcel className="h-4 w-4" />}
                title="Xuất tất cả dữ liệu ra Excel"
                className="flex-shrink-0 whitespace-nowrap"
              >
                <span className="hidden md:inline">Xuất Dữ Liệu</span>
              </Button>
            </div>
          </motion.div>

          {/* Table Section */}
          <motion.div
            className="mb-4 flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl"
            variants={itemVariants}
          >
            <UploadButton
              onUploadComplete={() => {
                fetchStatistics();
                fetchImages();
              }}
            />
            <Button
              onClick={() => {
                fetchStatistics();
                fetchImages();
              }}
              variant="outline"
              size="md"
              leftIcon={<FiRefreshCw className="h-4 w-4" />}
              className="h-[42px]"
              style={{ minWidth: 0 }}
            >
              Làm mới
            </Button>
            <span className="ml-auto text-sm text-white/70">
              Đã chọn:{" "}
              <span className="font-semibold text-white">
                {selected.length}
              </span>
              <span className="mx-2 text-white/50">|</span>
              Trang{" "}
              <span className="font-semibold text-white">
                {currentPage}
              </span> /{" "}
              <span className="font-semibold text-white">{totalPages}</span>
            </span>
          </motion.div>

          {loading ? (
            <motion.div
              className="flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 py-16 shadow-2xl backdrop-blur-xl"
              variants={itemVariants}
            >
              <FaSpinner className="mr-3 h-8 w-8 animate-spin text-white" />
              <span className="text-lg text-white/70">Đang tải dữ liệu...</span>
            </motion.div>
          ) : error ? (
            <motion.div
              className="rounded-3xl border border-red-500/20 bg-red-500/10 py-16 text-center text-lg text-red-300 backdrop-blur-xl"
              variants={itemVariants}
            >
              {error}
            </motion.div>
          ) : (
            <motion.div
              className="overflow-x-auto overflow-y-visible rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
              variants={itemVariants}
            >
              <table className="w-full min-w-[1200px] divide-y divide-white/10">
                <thead className="bg-white/5 backdrop-blur-sm">
                  <tr>
                    <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">
                      STT
                    </th>
                    <th className="px-3 py-3">
                      <button
                        onClick={handleSelectAll}
                        className="focus:outline-none"
                        aria-label={
                          selected.length === images.length && images.length > 0
                            ? "Bỏ chọn tất cả"
                            : "Chọn tất cả"
                        }
                      >
                        {selected.length === images.length &&
                        images.length > 0 ? (
                          <MdCheckBox className="h-5 w-5 text-red-400 transition" />
                        ) : (
                          <MdCheckBoxOutlineBlank className="h-5 w-5 text-white/50 transition hover:text-red-400" />
                        )}
                      </button>
                    </th>
                    <th
                      className="cursor-pointer select-none px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-white transition-colors hover:text-white/80"
                      onClick={() => handleSort("ImageName")}
                    >
                      Tên hình ảnh {sortIcon("ImageName", sortBy, sortDir)}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">
                      Thư mục
                    </th>
                    <th
                      className="cursor-pointer select-none px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-white transition-colors hover:text-white/80"
                      onClick={() => handleSort("Status")}
                    >
                      Trạng thái {sortIcon("Status", sortBy, sortDir)}
                    </th>
                    <th
                      className="cursor-pointer select-none px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-white transition-colors hover:text-white/80"
                      onClick={() => handleSort("CreatedAt")}
                    >
                      Ngày tạo {sortIcon("CreatedAt", sortBy, sortDir)}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">
                      Tải lên bởi
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">
                      Họ và Tên
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">
                      Điện thoại
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">
                      Email
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">
                      Trường THPT
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paginatedImages.map((img, idx) => {
                    const extracted = extractedData[img.ImageName] || {};
                    const rowNumber = startIndex + idx + 1;
                    return (
                      <tr
                        key={img.ImageName || idx}
                        className={
                          selected.includes(img.ImageName)
                            ? "cursor-pointer bg-red-500/20 transition hover:bg-red-500/30"
                            : "cursor-pointer transition hover:bg-white/5"
                        }
                        onClick={() => handleRowClick(img)}
                      >
                        <td className="px-3 py-3 text-center text-sm font-medium text-white/70">
                          {rowNumber}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRow(img.ImageName);
                            }}
                            className="focus:outline-none"
                            aria-label={
                              selected.includes(img.ImageName)
                                ? "Bỏ chọn"
                                : "Chọn"
                            }
                          >
                            {selected.includes(img.ImageName) ? (
                              <MdCheckBox className="h-5 w-5 text-red-400 transition" />
                            ) : (
                              <MdCheckBoxOutlineBlank className="h-5 w-5 text-white/50 transition hover:text-red-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(img);
                            }}
                            className="text-left text-sm font-medium text-blue-400 transition-colors hover:text-blue-300 hover:underline"
                          >
                            {img.ImageName}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          {img.FolderPath ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                />
                              </svg>
                              {img.FolderPath}
                            </span>
                          ) : (
                            <span className="text-xs text-white/50">Gốc</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-block rounded-full border px-3 py-1 text-xs font-bold shadow-sm ${statusColor(
                              img.Status
                            )}`}
                          >
                            {translateStatus(img.Status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-white/70">
                          {formatDate(img.CreatedAt)}
                        </td>
                        <td className="px-3 py-3">
                          {img.UploadBy ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-blue-400/30 bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-300 backdrop-blur-sm">
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              {img.UploadBy}
                            </span>
                          ) : (
                            <span className="text-xs text-white/50">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm text-white/80">
                          {extracted.ho_va_ten || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-white/80">
                          {extracted.dien_thoai || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-white/80">
                          {extracted.email || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-white/80">
                          {extracted.truong_thpt || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
                  <div className="text-sm text-white/70">
                    Hiển thị{" "}
                    <span className="font-semibold text-white">
                      {startIndex + 1}
                    </span>{" "}
                    đến{" "}
                    <span className="font-semibold text-white">{endIndex}</span>{" "}
                    trong tổng số{" "}
                    <span className="font-semibold text-white">
                      {totalImages}
                    </span>{" "}
                    kết quả
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                        currentPage === 1
                          ? "cursor-not-allowed border-white/10 bg-white/5 text-white/30"
                          : "border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/20"
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
                              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                                currentPage === page
                                  ? "bg-red-500 text-white shadow-lg"
                                  : "border border-white/20 bg-white/10 text-white hover:bg-white/20"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span
                              key={page}
                              className="px-2 py-2 text-white/50"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                        currentPage === totalPages
                          ? "cursor-not-allowed border-white/10 bg-white/5 text-white/30"
                          : "border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/20"
                      }`}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
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
              setImages((prev) =>
                prev.filter((img) => img.ImageName !== imageName)
              );
              setSelected((prev) => prev.filter((name) => name !== imageName));
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
    </motion.div>
  );
};

export default Dashboard;
