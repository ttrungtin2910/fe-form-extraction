import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();
const ConfirmContext = createContext();

// Hook to use toast
export const useToast = () => useContext(ToastContext);
// Hook to use confirm dialog, returns async function confirm(options)
export const useConfirm = () => useContext(ConfirmContext);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null); // {title,message,confirmText,type,resolve}

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const addToast = useCallback((msg, variant = "info") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, msg, variant }]);
    setTimeout(() => removeToast(id), 3000);
  }, []);

  const toastAPI = {
    success: (m) => addToast(m, "success"),
    error: (m) => addToast(m, "error"),
    info: (m) => addToast(m, "info"),
    warn: (m) => addToast(m, "warn"),
  };

  // confirm returns Promise<boolean>
  const confirm = ({ title = "Confirm", message = "Are you sure?", confirmText = "OK", type = "info" }) => {
    return new Promise((resolve) => {
      setConfirmState({ title, message, confirmText, type, resolve });
    });
  };

  const handleConfirm = (result) => {
    if (confirmState) confirmState.resolve(result);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={toastAPI}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        {/* Toast container */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`min-w-[180px] px-4 py-3 rounded-xl shadow-lg border-l-4 text-sm text-gray-800 animate-slide-in-right bg-white ${
                t.variant === "success" ? "border-green-500" : t.variant === "error" ? "border-red-500" : t.variant === "warn" ? "border-yellow-500" : "border-brand-500"
              }`}
            >
              {t.msg}
            </div>
          ))}
        </div>

        {/* Confirm Modal */}
        {confirmState && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl w-96 p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{confirmState.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{confirmState.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirm(true)}
                  className={`px-4 py-2 rounded-lg text-white text-sm ${
                    confirmState.type === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-brand-500 hover:bg-brand-600"
                  }`}
                >
                  {confirmState.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}; 