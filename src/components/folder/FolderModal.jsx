import React from "react";

const FolderModal = ({ type, currentName = "", onConfirm, onClose, errorMsg, setInputValue }) => {
  const isRename = type === "rename";
  const [input, setInput] = React.useState(currentName);

  const handleSubmit = () => {
    if (isRename && !input.trim()) return;
    onConfirm(isRename ? input.trim() : null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl w-96 p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          {isRename ? "Rename Folder" : "Delete Folder"}
        </h3>
        {isRename ? (
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); if(setInputValue) setInputValue(e.target.value);} }
            className="w-full px-4 py-2 mb-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to delete this folder and all its images?</p>
        )}
        {errorMsg && <p className="text-red-500 text-sm mb-2">{errorMsg}</p>}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 rounded-lg text-white text-sm ${isRename ? "bg-brand-500 hover:bg-brand-600" : "bg-red-500 hover:bg-red-600"}`}
          >
            {isRename ? "Rename" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderModal; 