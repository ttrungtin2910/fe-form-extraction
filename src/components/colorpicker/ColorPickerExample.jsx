import React, { useState } from 'react';
import ColorPicker, { CompactColorPicker } from './ColorPicker';

/**
 * Example usage of ColorPicker component
 */
export default function ColorPickerExample() {
  const [color1, setColor1] = useState('#8b5cf6');
  const [color2, setColor2] = useState('#6366f1');
  const [color3, setColor3] = useState('#a855f7');

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Color Picker Examples
      </h2>

      {/* Sketch Picker (Default) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sketch Picker (Default)
        </label>
        <ColorPicker
          color={color1}
          onChange={(color) => setColor1(color.hex)}
          pickerType="sketch"
          showPresets={true}
        />
      </div>

      {/* Chrome Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Chrome Picker
        </label>
        <ColorPicker
          color={color2}
          onChange={(color) => setColor2(color.hex)}
          pickerType="chrome"
          showPresets={true}
        />
      </div>

      {/* Block Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Block Picker
        </label>
        <ColorPicker
          color={color3}
          onChange={(color) => setColor3(color.hex)}
          pickerType="block"
          showPresets={true}
        />
      </div>

      {/* Compact Inline Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Compact Inline Picker
        </label>
        <CompactColorPicker
          color={color1}
          onChange={(color) => setColor1(color.hex)}
          presetColors={['#8b5cf6', '#6366f1', '#a855f7', '#ef4444', '#10b981']}
        />
      </div>

      {/* Custom Preset Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Custom Preset Colors
        </label>
        <ColorPicker
          color={color1}
          onChange={(color) => setColor1(color.hex)}
          pickerType="sketch"
          presetColors={[
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
          ]}
        />
      </div>

      {/* Without Alpha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Without Alpha Channel
        </label>
        <ColorPicker
          color={color2}
          onChange={(color) => setColor2(color.hex)}
          pickerType="sketch"
          disableAlpha={true}
        />
      </div>

      {/* Display Selected Colors */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-navy-900 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          Selected Colors:
        </h3>
        <div className="flex gap-4">
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-lg border-2 border-gray-200 dark:border-white/20 mb-2"
              style={{ backgroundColor: color1 }}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">{color1}</p>
          </div>
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-lg border-2 border-gray-200 dark:border-white/20 mb-2"
              style={{ backgroundColor: color2 }}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">{color2}</p>
          </div>
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-lg border-2 border-gray-200 dark:border-white/20 mb-2"
              style={{ backgroundColor: color3 }}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">{color3}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

