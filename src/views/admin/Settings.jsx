import React, { useState } from "react";
import { motion } from "framer-motion";
import { useSettings } from "contexts/SettingsContext";
import Button from "components/button/Button";
import BlurText from "components/animations/BlurText";
import {
  CogIcon,
  ArrowPathIcon as MdRefresh,
  CheckIcon,
} from "@heroicons/react/24/solid";

// Custom checkbox outline icon
const CheckboxOutlineIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <rect
      x="4"
      y="4"
      width="16"
      height="16"
      rx="3"
      stroke="currentColor"
      fill="none"
    />
  </svg>
);

// Column definitions with Vietnamese labels
const COLUMN_DEFINITIONS = [
  { key: "imageName", label: "Tên hình ảnh", icon: "📷" },
  { key: "folderPath", label: "Thư mục", icon: "📁" },
  { key: "status", label: "Trạng thái", icon: "✓" },
  { key: "createdAt", label: "Ngày tạo", icon: "📅" },
  { key: "size", label: "Kích thước", icon: "💾" },
  { key: "uploadBy", label: "Tải lên bởi", icon: "👤" },
  { key: "hoVaTen", label: "Họ và Tên", icon: "✍️" },
  { key: "cccd", label: "CCCD", icon: "🆔" },
  { key: "dienThoai", label: "Điện thoại", icon: "📞" },
  { key: "dienThoaiPhuHuynh", label: "Điện thoại phụ huynh", icon: "📱" },
  { key: "email", label: "Email", icon: "✉️" },
  { key: "truongThpt", label: "Trường THPT", icon: "🏫" },
  { key: "lop", label: "Lớp", icon: "📚" },
  { key: "tinh", label: "Tỉnh", icon: "📍" },
  { key: "nganhXetTuyen", label: "Ngành xét tuyển", icon: "🎓" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const Settings = () => {
  const {
    columnVisibility,
    toggleColumn,
    resetToDefault,
  } = useSettings();
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (key) => {
    toggleColumn(key);
    setHasChanges(true);
  };

  const handleReset = () => {
    resetToDefault();
    setHasChanges(false);
  };

  const Checkbox = ({ checked, label, icon, onToggle }) => (
    <motion.label
      className="flex cursor-pointer items-center space-x-3 rounded-xl border border-white/20 bg-white/5 p-4 transition-all hover:border-white/30 hover:bg-white/10"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {checked ? (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <div className="relative">
            <svg
              className="h-6 w-6"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="2"
                y="2"
                width="16"
                height="16"
                rx="3"
                fill="currentColor"
                className="text-white"
              />
              <path
                d="M6 10L9 13L14 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-800"
                fill="none"
              />
            </svg>
          </div>
        </motion.div>
      ) : (
        <CheckboxOutlineIcon className="h-6 w-6 text-gray-400" />
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="sr-only"
      />
    </motion.label>
  );

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="mb-4 flex items-center gap-3">
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <CogIcon className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <BlurText
                text="Cài đặt"
                animateBy="words"
                direction="top"
                delay={100}
                className="text-3xl font-bold leading-normal text-white"
              />
              <p className="mt-1 text-sm text-white/70">
                Tùy chỉnh hiển thị và các tùy chọn khác
              </p>
            </div>
          </div>
        </motion.div>

        {/* Column Visibility Settings */}
        <motion.div
          variants={itemVariants}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Hiển thị cột trong bảng
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Chọn các cột bạn muốn hiển thị trong bảng "Danh sách hình ảnh
                chi tiết"
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleReset}
                variant="secondary"
                size="md"
                className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
                leftIcon={<MdRefresh className="h-5 w-5" />}
              >
                Đặt lại mặc định
              </Button>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {COLUMN_DEFINITIONS.map((column) => (
              <motion.div
                key={column.key}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <Checkbox
                  checked={columnVisibility[column.key] || false}
                  label={column.label}
                  icon={column.icon}
                  onToggle={() => handleToggle(column.key)}
                />
              </motion.div>
            ))}
          </div>

          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-center gap-2 rounded-xl border border-green-400/30 bg-green-500/20 px-4 py-3 backdrop-blur-sm"
            >
              <CheckIcon className="h-5 w-5 text-green-400" />
              <p className="text-sm text-green-300">
                Cài đặt đã được lưu tự động
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Settings;

