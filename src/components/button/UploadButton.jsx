import { useRef, useState } from "react";
import { MdCloudUpload, MdCheckCircle, MdError } from "react-icons/md";
import { api } from "config/api";

const UploadButton = ({ onUploadComplete }) => {
    const inputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("idle"); // idle, processing, done, error
    const [uploadedCount, setUploadedCount] = useState(0);
    const [totalFiles, setTotalFiles] = useState(0);

    const handleUploadClick = () => {
        if (!isUploading) {
            inputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setTotalFiles(files.length);
        setUploadedCount(0);
        setUploadProgress(0);
        setIsUploading(true);
        setUploadStatus("processing");

        let uploaded = 0;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append("status", "Uploaded");
            formData.append("file", file, file.name);

            // Validate file before upload
            if (!file || file.size === 0) {
                console.error("[UploadButton] Invalid file selected");
                setUploadStatus("error");
                setIsUploading(false);
                return;
            }
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                console.error("[UploadButton] Unsupported file type:", file.type);
                setUploadStatus("error");
                setIsUploading(false);
                return;
            }
            try {
                await api.images.upload(formData);
                uploaded++;
                setUploadedCount(uploaded);
                setUploadProgress(Math.round((uploaded / files.length) * 100));
            } catch (err) {
                setUploadStatus("error");
                setIsUploading(false);
                return;
            }
        }
        setUploadStatus("done");
        if (onUploadComplete) onUploadComplete();
        setTimeout(() => {
            setIsUploading(false);
            setUploadStatus("idle");
            setUploadProgress(0);
            setUploadedCount(0);
            setTotalFiles(0);
        }, 2000);
        e.target.value = "";
    };

    const getStatusIcon = () => {
        switch (uploadStatus) {
            case "processing":
                return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>;
            case "done":
                return <MdCheckCircle className="h-4 w-4 text-green-400" />;
            case "error":
                return <MdError className="h-4 w-4 text-red-400" />;
            default:
                return <MdCloudUpload className="h-4 w-4" />;
        }
    };

    const getStatusText = () => {
        switch (uploadStatus) {
            case "processing":
                return `Processing (${uploadedCount}/${totalFiles})`;
            case "done":
                return "Done";
            case "error":
                return "Error";
            default:
                return "Upload image";
        }
    };

    return (
        <div>
            <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className={`linear inline-flex items-center justify-center rounded-xl px-4 py-2 text-base font-medium text-white transition duration-200 ${
                    isUploading 
                        ? "bg-gray-400 cursor-not-allowed" 
                        : "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
                }`}
            >
                <span className="mr-2">{getStatusIcon()}</span>
                {getStatusText()}
            </button>

            {/* Progress Bar */}
            {isUploading && (
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                            className="bg-brand-500 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {uploadedCount} of {totalFiles} files uploaded
                    </div>
                </div>
            )}

            <input
                type="file"
                ref={inputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
            />
        </div>
    );
};

export default UploadButton;