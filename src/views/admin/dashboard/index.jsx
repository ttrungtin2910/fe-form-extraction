import { useEffect, useState } from "react";
import { api } from "config/api";
import UploadButton from "components/button/UploadButton";
import { FiRefreshCw, FiChevronUp, FiChevronDown } from "react-icons/fi";
import { MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";
import PieChart from "components/charts/PieChart";
import { FaSpinner, FaTrash, FaPlayCircle } from "react-icons/fa";
import { useImageManagement } from "contexts/ImageManagementContext";
import { useToast, useConfirm } from "components/common/ToastProvider";

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

const Dashboard = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [sortBy, setSortBy] = useState("ImageName");
  const [sortDir, setSortDir] = useState("asc");

  // State for non-blocking analysis progress
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeTotal, setAnalyzeTotal] = useState(0);

  // Context for sidebar actions
  const {
    updateSelectedImages,
    setAnalyzeHandler,
    setDeleteHandler,
    selectedImages
  } = useImageManagement();

  const toast = useToast();
  const confirmModal = useConfirm();

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.images.getAll();
      setImages(result || []);
    } catch (err) {
      setError("Failed to fetch images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Sync selected with context
  useEffect(() => {
    updateSelectedImages(new Set(selected));
  }, [selected]);

  // Register sidebar handlers
  useEffect(() => {
    setAnalyzeHandler(handleAnalyzeSelected);
    setDeleteHandler(handleDeleteSelected);
  });

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

  // Stats for overview
  const statusStats = getStatusStats(images);
  const statusLabels = Object.keys(statusStats);
  const statusCounts = statusLabels.map((k) => statusStats[k]);
  const statusColors = ["#86efac", "#fca5a5", "#c4b5fd", "#fcd34d", "#d1d5db"];

  const pieOptions = {
    labels: statusLabels,
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
      for (let i = 0; i < selected.length; i++) {
        const img = images.find((img) => img.ImageName === selected[i]);
        if (!img) continue;
        await api.formExtraction.extract({
          title: img.ImageName,
          size: "—",
          image: img.ImagePath,
          status: img.Status,
          createAt: img.CreatedAt,
          folderPath: img.FolderPath || "",
        });
        setAnalyzeProgress(i + 1);
      }
      setSelected([]);
      fetchImages();
    } finally {
      setAnalyzing(false);
      setAnalyzeProgress(0);
      setAnalyzeTotal(0);
    }
  }

  // Delete selected images
  async function handleDeleteSelected() {
    if (selected.length === 0) return;
    const ok = await confirmModal({title:"Delete images",message:`Delete ${selected.length} images?`,type:"danger",confirmText:"Delete"});
    if(!ok) return;
    setLoading(true);
    try {
      for (let i = 0; i < selected.length; i++) {
        const img = images.find((img) => img.ImageName === selected[i]);
        if (!img) continue;
        await api.images.delete(img.ImageName);
      }
      fetchImages();
      setSelected([]);
      toast.success("Images deleted");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-2 bg-gray-50 min-h-screen relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 bg-white/80 rounded-2xl shadow-2xl">
            <FaSpinner className="animate-spin text-4xl text-red-500" />
            <span className="text-lg font-semibold text-gray-700">Loading...</span>
          </div>
        </div>
      )}

      {/* Analysis progress bar (non-blocking) */}
      {analyzing && (
        <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-1/2 z-40 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Analyzing images...</span>
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

      <div className="max-w-7xl mx-auto px-2">
        {/* Enhanced Overview Section */}
        <div className="mb-8">
          
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-200 to-blue-300 rounded-2xl shadow-lg p-6 text-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{images.length}</div>
                  <div className="text-blue-700 text-sm font-medium">Total Images</div>
                </div>
                <div className="w-12 h-12 bg-blue-400/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {statusLabels.slice(0, 3).map((label, idx) => (
              <div key={label} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-800">{statusStats[label]}</div>
                    <div className="text-gray-600 text-sm font-medium">{label}</div>
                  </div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${statusColors[idx % statusColors.length]}20` }}>
                    <div className="w-4 h-4 rounded-full" style={{ background: statusColors[idx % statusColors.length] }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Status Distribution</h3>
                                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full"></div>
                   <span className="text-sm text-gray-600 font-medium">Real-time</span>
                 </div>
              </div>
              <div className="flex justify-center">
                <div className="w-80 h-80">
                  <PieChart series={statusCounts} options={pieOptions} />
                </div>
              </div>
            </div>

            {/* Status Legend Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Status Breakdown</h3>
              <div className="space-y-4">
                {statusLabels.map((label, idx) => (
                  <div key={label} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ background: statusColors[idx % statusColors.length] }}></div>
                      <span className="font-semibold text-gray-800">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-800">{statusStats[label]}</span>
                      <span className="text-sm text-gray-500">
                        ({((statusStats[label] / images.length) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
                             {/* Summary Stats */}
               <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                 <div className="flex items-center justify-between">
                   <span className="text-sm font-medium text-gray-600">Processing Rate</span>
                   <span className="text-lg font-bold text-gray-800">
                     {images.length > 0 ? ((statusStats['Completed'] || 0) / images.length * 100).toFixed(1) : 0}%
                   </span>
                 </div>
                 <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                   <div 
                     className="bg-gradient-to-r from-blue-300 to-purple-300 h-2 rounded-full transition-all duration-500"
                     style={{ width: `${images.length > 0 ? ((statusStats['Completed'] || 0) / images.length * 100) : 0}%` }}
                   ></div>
                 </div>
               </div>
            </div>
          </div>
        </div>
        {/* End Enhanced Overview Section */}
        <div className="flex items-center gap-2 mb-3">
          <UploadButton onUploadComplete={fetchImages} />
          <button
            onClick={fetchImages}
            className="flex items-center justify-center px-4 py-2 rounded-lg bg-white border border-gray-200 shadow hover:bg-gray-100 text-gray-700 font-semibold text-sm transition h-[42px]"
            style={{ minWidth: 0 }}
          >
            <FiRefreshCw className="mr-2 text-base" /> Refresh
          </button>
          <span className="ml-auto text-sm text-gray-500">
            Selected: <span className="font-semibold text-gray-700">{selected.length}</span>
          </span>
        </div>
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-lg">Loading...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-500 text-lg">{error}</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2">
                    <button
                      onClick={handleSelectAll}
                      className="focus:outline-none"
                      aria-label={selected.length === images.length && images.length > 0 ? "Unselect all" : "Select all"}
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
                    Title {sortIcon("ImageName", sortBy, sortDir)}
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("Status")}
                  >
                    Status {sortIcon("Status", sortBy, sortDir)}
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("CreatedAt")}
                  >
                    Date {sortIcon("CreatedAt", sortBy, sortDir)}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedImages.map((img, idx) => (
                  <tr
                    key={img.ImageName || idx}
                    className={
                      selected.includes(img.ImageName)
                        ? "bg-red-50/60 hover:bg-red-100/80"
                        : "hover:bg-gray-50 transition"
                    }
                  >
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleSelectRow(img.ImageName)}
                        className="focus:outline-none"
                        aria-label={selected.includes(img.ImageName) ? "Unselect" : "Select"}
                      >
                        {selected.includes(img.ImageName) ? (
                          <MdCheckBox className="w-5 h-5 text-red-500 transition" />
                        ) : (
                          <MdCheckBoxOutlineBlank className="w-5 h-5 text-gray-400 hover:text-red-500 transition" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 text-sm">
                      {img.ImageName}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${statusColor(
                          img.Status
                        )}`}
                      >
                        {img.Status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs">
                      {img.CreatedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 