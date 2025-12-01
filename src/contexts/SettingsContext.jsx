import React, { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext();

// Default column visibility settings
const DEFAULT_COLUMN_VISIBILITY = {
  imageName: true, // Tên hình ảnh
  folderPath: true, // Thư mục
  status: true, // Trạng thái
  createdAt: true, // Ngày tạo
  size: true, // Kích thước
  uploadBy: true, // Tải lên bởi
  hoVaTen: true, // Họ và Tên
  cccd: true, // CCCD
  dienThoai: true, // Điện thoại
  dienThoaiPhuHuynh: true, // Điện thoại phụ huynh
  email: true, // Email
  truongThpt: true, // Trường THPT
  lop: true, // Lớp
  tinh: true, // Tỉnh
  nganhXetTuyen: true, // Ngành xét tuyển
};

const STORAGE_KEY = "dashboard_table_column_visibility";

export const SettingsProvider = ({ children }) => {
  const [columnVisibility, setColumnVisibility] = useState(
    DEFAULT_COLUMN_VISIBILITY
  );

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setColumnVisibility({ ...DEFAULT_COLUMN_VISIBILITY, ...parsed });
      }
    } catch (error) {
      console.error("[Settings] Failed to load settings:", error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  const updateColumnVisibility = (newVisibility) => {
    setColumnVisibility(newVisibility);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVisibility));
    } catch (error) {
      console.error("[Settings] Failed to save settings:", error);
    }
  };

  // Toggle individual column visibility
  const toggleColumn = (columnKey) => {
    updateColumnVisibility({
      ...columnVisibility,
      [columnKey]: !columnVisibility[columnKey],
    });
  };

  // Reset to default settings
  const resetToDefault = () => {
    updateColumnVisibility(DEFAULT_COLUMN_VISIBILITY);
  };

  const value = {
    columnVisibility,
    updateColumnVisibility,
    toggleColumn,
    resetToDefault,
    DEFAULT_COLUMN_VISIBILITY,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
};

