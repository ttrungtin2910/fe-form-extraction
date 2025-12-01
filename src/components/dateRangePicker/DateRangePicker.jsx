import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarIcon, XMarkIcon } from "@heroicons/react/24/outline";

const DateRangePicker = ({ startDate, endDate, onChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleStartDateChange = (e) => {
    const date = e.target.value;
    onChange({ startDate: date || null, endDate });
  };

  const handleEndDateChange = (e) => {
    const date = e.target.value;
    onChange({ startDate, endDate: date || null });
  };

  const handleClear = () => {
    onChange({ startDate: null, endDate: null });
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    if (startDate) {
      return `Từ ${formatDate(startDate)}`;
    }
    if (endDate) {
      return `Đến ${formatDate(endDate)}`;
    }
    return "Chọn khoảng thời gian";
  };

  // Calculate dropdown position when opening or scrolling
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      // For fixed positioning, use viewport coordinates (no scrollY/scrollX)
      setDropdownPosition({
        top: rect.bottom + 2, // 2px gap below button
        left: rect.left,
        width: rect.width,
      });
    };

    // Initial position
    updatePosition();

    // Update position on scroll and resize - use capture phase to catch all scroll events
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="flex min-w-[240px] items-center justify-between gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/20"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-white/70" />
          <span className="whitespace-nowrap text-sm">{getDisplayText()}</span>
        </div>
        {(startDate || endDate) && (
          <XMarkIcon
            className="h-4 w-4 text-white/70 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          />
        )}
      </button>

      {isOpen &&
        createPortal(
          <AnimatePresence>
            <>
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-black/95 fixed z-[9999] rounded-2xl border border-white/10 p-4 shadow-2xl backdrop-blur-xl"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width}px`,
                }}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white">Khoảng thời gian</h3>
                    {(startDate || endDate) && (
                      <button
                        onClick={handleClear}
                        className="text-sm text-white/70 transition-colors hover:text-white"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="mb-2 block text-sm text-white/70">
                        Từ ngày
                      </label>
                      <input
                        type="date"
                        value={startDate || ""}
                        onChange={handleStartDateChange}
                        max={endDate || undefined}
                        className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-white/70">
                        Đến ngày
                      </label>
                      <input
                        type="date"
                        value={endDate || ""}
                        onChange={handleEndDateChange}
                        min={startDate || undefined}
                        className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="mt-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition-all hover:bg-white/20"
                  >
                    Đóng
                  </button>
                </div>
              </motion.div>
            </>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default DateRangePicker;
