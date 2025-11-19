import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon as FiSearch,
  BookmarkIcon as FiSave,
  TrashIcon as MdDelete,
  PlusIcon as MdAdd,
  CircleStackIcon as MdSync,
} from "@heroicons/react/24/solid";
import { BsToggleOn, BsToggleOff } from "react-icons/bs";
import Button from "components/button/Button";
import { motion } from "framer-motion";
import BlurText from "components/animations/BlurText";

const mockData = [
  {
    id: "01",
    name: "CRM 01",
    description: "This is description ...",
    url: "https://url.sample1.com",
    authId: "*********",
    password: "*******",
    enabled: true,
  },
  {
    id: "02",
    name: "CRM 02",
    description: "This is description ...",
    url: "https://url.sample2.com",
    authId: "*********",
    password: "*******",
    enabled: false,
  },
];

const ActionButton = ({ children, onClick, tooltip, color }) => (
  <motion.button
    onClick={onClick}
    className={`group relative mx-1 rounded-full border border-white/20 bg-white/10 p-2 backdrop-blur-sm transition hover:bg-white/20 focus:outline-none ${color}`}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    tabIndex={0}
  >
    {children}
    {tooltip && (
      <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded border border-white/20 bg-white/10 px-2 py-1 text-xs text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 group-focus:opacity-100">
        {tooltip}
      </span>
    )}
  </motion.button>
);

const initialNewEndpoint = {
  id: "",
  name: "",
  description: "",
  url: "",
  authId: "",
  password: "",
  enabled: true,
};

const Synchronization = () => {
  const [data, setData] = useState(mockData);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState(initialNewEndpoint);
  const [error, setError] = useState("");

  // ✅ REMOVED: Artificial delay - no need for fake loading
  useEffect(() => {
    // Component is ready immediately
  }, []);

  const handleToggle = (idx) => {
    setData((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const handleDelete = (idx) => {
    setData((prev) => prev.filter((_, i) => i !== idx));
  };

  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.url.toLowerCase().includes(search.toLowerCase())
  );

  const handleDialogChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewEndpoint((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDialogSave = () => {
    // Validate required fields
    if (!newEndpoint.id || !newEndpoint.name || !newEndpoint.url) {
      setError("ID, Tên CRM và URL điểm cuối là bắt buộc.");
      return;
    }
    setData((prev) => [...prev, newEndpoint]);
    setShowDialog(false);
    setNewEndpoint(initialNewEndpoint);
    setError("");
  };

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

  return (
    <motion.div
      className="relative z-10 min-h-screen p-4 md:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header Section */}
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm"
            >
              <MdSync className="h-8 w-8 text-white" />
            </motion.div>

            <BlurText
              text=" Đồng Bộ Hóa"
              animateBy="words"
              direction="top"
              delay={150}
              className="mb-4 text-3xl font-bold leading-normal tracking-normal text-white md:text-4xl"
            />

            <motion.p
              variants={itemVariants}
              className="text-sm leading-normal text-white/70 md:text-base"
            >
              Quản lý và cấu hình các điểm cuối đồng bộ dữ liệu
            </motion.p>
          </div>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
          variants={itemVariants}
        >
          <div className="flex flex-1 flex-col flex-wrap gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-11 pr-16 text-base text-white placeholder-white/50 shadow-sm backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="Tìm kiếm điểm cuối"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <FiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 select-none rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white/50">
                ⌘ S
              </span>
            </div>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<MdAdd className="h-6 w-6" />}
              onClick={() => setShowDialog(true)}
              className="text-black flex-shrink-0 whitespace-nowrap rounded-full bg-white shadow-lg hover:bg-white/90"
            >
              Thêm điểm cuối mới
            </Button>
          </div>
        </motion.div>
        <motion.div
          className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
          variants={itemVariants}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-bold uppercase tracking-wider text-white">
                    ID
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-bold uppercase tracking-wider text-white">
                    Tên CRM
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-bold uppercase tracking-wider text-white">
                    Mô tả CRM
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-bold uppercase tracking-wider text-white">
                    URL điểm cuối
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-bold uppercase tracking-wider text-white">
                    ID xác thực
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-bold uppercase tracking-wider text-white">
                    Mật khẩu
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-center font-bold uppercase tracking-wider text-white">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredData.map((item, idx) => (
                  <motion.tr
                    key={item.id}
                    className="group transition hover:bg-white/10"
                    variants={itemVariants}
                    whileHover={{ scale: 1.01 }}
                  >
                    <td className="px-4 py-3 font-semibold text-white">
                      {item.id}
                    </td>
                    <td className="px-4 py-3 text-white/90">{item.name}</td>
                    <td className="px-4 py-3 text-white/70">
                      {item.description}
                    </td>
                    <td className="max-w-xs break-all px-4 py-3 text-blue-300 underline">
                      {item.url}
                    </td>
                    <td className="px-4 py-3 text-white/70">{item.authId}</td>
                    <td className="px-4 py-3 text-white/70">{item.password}</td>
                    <td className="px-4 py-3 text-center">
                      <ActionButton
                        onClick={() => handleToggle(idx)}
                        tooltip={
                          item.enabled ? "Tắt điểm cuối" : "Bật điểm cuối"
                        }
                        color=""
                      >
                        {item.enabled ? (
                          <BsToggleOn className="h-6 w-6 text-blue-400 transition" />
                        ) : (
                          <BsToggleOff className="h-6 w-6 text-white/40 transition" />
                        )}
                      </ActionButton>
                      <ActionButton tooltip="Lưu thay đổi" color="">
                        <FiSave className="h-6 w-6 text-green-400 transition" />
                      </ActionButton>
                      <ActionButton
                        onClick={() => handleDelete(idx)}
                        tooltip="Xóa điểm cuối"
                        color=""
                      >
                        <MdDelete className="h-6 w-6 text-red-400 transition" />
                      </ActionButton>
                    </td>
                  </motion.tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-white/50">
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          width="48"
                          height="48"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Zm-1-5h2v2h-2v-2Zm0-8h2v6h-2V9Z"
                            fill="currentColor"
                          />
                        </svg>
                        <span className="text-lg font-semibold text-white">
                          Không tìm thấy điểm cuối.
                        </span>
                        <span className="text-sm text-white/70">
                          Thử điều chỉnh tìm kiếm hoặc thêm điểm cuối mới.
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Dialog for adding new endpoint */}
        {showDialog && (
          <motion.div
            className="bg-black/60 fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowDialog(false);
              setError("");
            }}
          >
            <motion.div
              className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl border border-white/20 bg-gray-800/50 p-0 shadow-2xl backdrop-blur-xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between rounded-t-3xl border-b border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <h3 className="flex-1 text-center text-base font-semibold text-white">
                  Thêm điểm cuối mới
                </h3>
                <button
                  className="rounded-full border border-white/20 bg-white/10 p-1 text-white/70 transition duration-200 hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    setShowDialog(false);
                    setError("");
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white">
                      ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="id"
                      value={newEndpoint.id}
                      onChange={handleDialogChange}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white">
                      Tên CRM <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="name"
                      value={newEndpoint.name}
                      onChange={handleDialogChange}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white">
                      Mô tả CRM
                    </label>
                    <input
                      name="description"
                      value={newEndpoint.description}
                      onChange={handleDialogChange}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white">
                      URL điểm cuối <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="url"
                      value={newEndpoint.url}
                      onChange={handleDialogChange}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white">
                      ID xác thực
                    </label>
                    <input
                      name="authId"
                      value={newEndpoint.authId}
                      onChange={handleDialogChange}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white">
                      Mật khẩu
                    </label>
                    <input
                      name="password"
                      value={newEndpoint.password}
                      onChange={handleDialogChange}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                      type="password"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="enabled"
                      checked={newEndpoint.enabled}
                      onChange={handleDialogChange}
                      id="enabled"
                      className="h-4 w-4 rounded border-white/30 bg-white/10 text-blue-400 focus:ring-2 focus:ring-blue-400"
                    />
                    <label htmlFor="enabled" className="text-sm text-white/70">
                      Bật điểm cuối
                    </label>
                  </div>
                  {error && (
                    <div className="mt-1 text-sm text-red-400">{error}</div>
                  )}
                  <Button
                    variant="primary"
                    size="lg"
                    className="text-black mt-4 w-full bg-white shadow-lg hover:bg-white/90"
                    onClick={handleDialogSave}
                  >
                    Lưu
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Synchronization;
