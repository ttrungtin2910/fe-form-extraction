import { useRef } from "react";

const UploadButton = () => {
    const inputRef = useRef(null);

    const handleUploadClick = () => {
        inputRef.current.click(); // Kích hoạt input file ẩn
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);

        for (const file of files) {
            const formData = new FormData();
            formData.append("status", "Synced");
            formData.append("file", file);

            try {
                const res = await fetch("http://localhost:8000/upload-image/", {
                method: "POST",
                body: formData,
                });

                if (!res.ok) throw new Error("Upload failed");
                const result = await res.json();
                console.log("Uploaded:", result);
            } catch (err) {
                console.error("Error uploading file:", err);
            }
        }

        e.target.value = ""; // Reset input để có thể chọn lại cùng file sau
    };

    return (
        <>
        <button
            onClick={handleUploadClick}
            className="linear mb-8 flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
        >
            Upload image
        </button>

        <input
            type="file"
            multiple
            ref={inputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
        />
        </>
    );
    };

export default UploadButton;