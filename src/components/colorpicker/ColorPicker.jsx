import React, { useState } from 'react';
import { SketchPicker, ChromePicker, BlockPicker, CirclePicker } from 'react-color';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Customizable Color Picker Component
 * 
 * @param {string} color - Initial color (hex format)
 * @param {function} onChange - Callback when color changes
 * @param {string} pickerType - Type of picker: 'sketch' | 'chrome' | 'block' | 'circle'
 * @param {boolean} showPresets - Show preset colors
 * @param {array} presetColors - Custom preset colors array
 * @param {string} width - Custom width
 * @param {boolean} disableAlpha - Disable alpha/transparency
 * @param {string} className - Additional CSS classes
 */
export default function ColorPicker({
  color = '#8b5cf6',
  onChange,
  pickerType = 'sketch',
  showPresets = true,
  presetColors = [
    '#8b5cf6', '#6366f1', '#a855f7', // Purple shades
    '#ef4444', '#f59e0b', '#10b981', // Red, Amber, Green
    '#3b82f6', '#06b6d4', '#ec4899', // Blue, Cyan, Pink
    '#ffffff', '#000000', '#6b7280'  // White, Black, Gray
  ],
  width = '100%',
  disableAlpha = false,
  className = ''
}) {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState(color);

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
  };

  const handleChange = (color) => {
    setCurrentColor(color.hex);
    if (onChange) {
      onChange(color);
    }
  };

  const handleChangeComplete = (color) => {
    setCurrentColor(color.hex);
    if (onChange) {
      onChange(color);
    }
  };

  // Render different picker types
  const renderPicker = () => {
    const commonProps = {
      color: currentColor,
      onChange: handleChange,
      onChangeComplete: handleChangeComplete,
      disableAlpha: disableAlpha,
      presetColors: showPresets ? presetColors : undefined,
      width: width
    };

    switch (pickerType) {
      case 'chrome':
        return <ChromePicker {...commonProps} />;
      case 'block':
        return <BlockPicker {...commonProps} />;
      case 'circle':
        return <CirclePicker {...commonProps} />;
      default:
        return <SketchPicker {...commonProps} />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Color Preview Button */}
      <motion.button
        type="button"
        onClick={handleClick}
        className="w-full flex items-center gap-3 p-3 bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-lg hover:border-purple-500 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div
          className="w-10 h-10 rounded-md border-2 border-gray-200 dark:border-white/20 shadow-sm"
          style={{ backgroundColor: currentColor }}
        />
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-700 dark:text-white">
            {currentColor.toUpperCase()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Click to pick color</p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${displayColorPicker ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.button>

      {/* Color Picker Popover */}
      <AnimatePresence>
        {displayColorPicker && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={handleClose}
            />
            
            {/* Picker Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 mt-2"
              style={{ left: 0 }}
            >
              <div className="bg-white dark:bg-navy-800 rounded-xl shadow-2xl p-4 border border-gray-200 dark:border-white/10">
                {renderPicker()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Compact Color Picker (Inline version)
 */
export function CompactColorPicker({ color, onChange, presetColors, className = '' }) {
  const [currentColor, setCurrentColor] = useState(color);

  const handleChange = (newColor) => {
    setCurrentColor(newColor);
    if (onChange) {
      onChange({ hex: newColor });
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        type="color"
        value={currentColor}
        onChange={(e) => handleChange(e.target.value)}
        className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-white/20 cursor-pointer"
      />
      <input
        type="text"
        value={currentColor}
        onChange={(e) => handleChange(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-navy-800 text-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
        placeholder="#000000"
      />
      {presetColors && (
        <div className="flex gap-1">
          {presetColors.map((presetColor, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleChange(presetColor)}
              className="w-8 h-8 rounded border-2 border-gray-200 dark:border-white/20 hover:scale-110 transition-transform"
              style={{ backgroundColor: presetColor }}
              title={presetColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

