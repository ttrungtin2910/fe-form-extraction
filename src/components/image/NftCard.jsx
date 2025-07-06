import { useState } from "react";
import Card from "components/image";
import ImageDialog from "components/image/ImageDialog";

import { FiMoreHorizontal } from "react-icons/fi";
import { FaPlayCircle, FaSpinner } from "react-icons/fa";

const NftCard = ({ title, size, image, extra, status, createAt }) => {
  const [heart, setHeart] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePlayClick = async () => {
  setLoading(true); //
  try {
    const response = await fetch("http://localhost:8000/ExtractForm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        size,
        image,
        status,
        createAt,
      }),
    });

    if (!response.ok) {
      throw new Error("Request failed");
    }

    const result = await response.json();
    console.log("Success:", result);
  } catch (error) {
    console.error("Error sending data:", error);
  } finally {
    setLoading(false); //
  }
};

  return (
    <Card
      extra={`flex flex-col w-full h-full 3xl:p-![18px] bg-white ${extra}`}
    >
      <div className="h-full w-full">
        <div className="relative w-full">
          <img
            src={image}
            className="mb-4 h-full w-full rounded-t-xl 3xl:h-full 3xl:w-full"
            alt=""
            onClick={() => setShowModal(true)}
          />
          <button
            onClick={() => setHeart(!heart)}
            className="absolute top-3 right-3 flex items-center justify-center rounded-full bg-white p-1 text-brand-500 hover:cursor-pointer"
          >
            <div className="flex h-full w-full items-center justify-center rounded-full text-xl hover:bg-gray-50 dark:text-navy-900">
              {heart ? (
                <FiMoreHorizontal />
              ) : (
                <FiMoreHorizontal className="text-brand-500" />
              )}
            </div>
          </button>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span
            className={`ml-5 px-4 py-1 rounded-md text-sm font-medium text-white ${
              status === "Verify"
                ? "bg-purple-500"
                : status === "Synced"
                ? "bg-orange-500"
                : status === "Completed"
                ? "bg-green-500"
                : "bg-gray-400"
            }`}
            >
            {status}
          </span>

          <div className="flex mr-3 items-center text-sm text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {createAt}
          </div>
        </div>
        <div className="mb-0 mt-2 ml-5 flex items-center justify-between px-1 md:flex-col md:items-start lg:flex-row lg:justify-between xl:flex-col xl:items-start 3xl:flex-row 3xl:justify-between">
            <p className="text-lg font-bold text-navy-700 dark:text-white truncate overflow-hidden whitespace-nowrap max-w-full">
              {title}
            </p>
        </div>
        <div className="flex ml-6 items-center justify-between mb-2">
            <p className="mb-1 text-sm font-bold text-gray-600 md:mt-2">
              Size: {size}{" "} <span>MB</span>
            </p>
            
            <button
              onClick={handlePlayClick}
              className="flex mr-6 mb-4 items-center justify-center rounded-full bg-red-300 p-0 text-red-500 hover:cursor-pointer"
            >
              <div className="flex h-full w-full items-center justify-center rounded-full hover:bg-gray-50 dark:text-navy-900">
                {loading ? (
                  <FaSpinner className="text-3xl animate-spin" />
                ) : (
                  <FaPlayCircle className="text-3xl" />
                )}
              </div>
            </button>

        </div>
      </div>

      <ImageDialog
        open={showModal}
        image={image}
        title={title}
        onClose={() => setShowModal(false)}
      />

    </Card>
  );
};

export default NftCard;
