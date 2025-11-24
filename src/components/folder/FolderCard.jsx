import {
  PlayIcon as FaPlay,
  TrashIcon as FaTrash,
} from "@heroicons/react/24/solid";
import { api } from "config/api";
import { api as apiFE } from "config/api";
import { useEffect, useState } from "react";
import { useToast, useConfirm } from "components/common/ToastProvider";
import { POLLING_CONFIG } from "../../config/polling";
import Button from "components/button/Button";
import { motion } from "framer-motion";
import Folder from "components/ui/Folder";

const FolderCard = ({ path, currentFolder, onNavigate, onRefresh }) => {
  const folderName = path.split("/").pop();
  const [processing, setProcessing] = useState(false);
  const [imgCount, setImgCount] = useState(null);
  const [folderCount, setFolderCount] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        // Get all images with a large limit to get count
        const allImagesResp = await api.images.getAll({
          page: 1,
          limit: 10000,
        });
        const allImages = allImagesResp?.data || [];
        const images = Array.isArray(allImages)
          ? allImages.filter(
              (img) => img.FolderPath && img.FolderPath.startsWith(path)
            )
          : [];
        const folderData = await apiFE.images.getFolders();
        const allFolders = folderData.folders || [];
        const subFolders = allFolders.filter((f) => f.startsWith(path + "/"));
        if (mounted) {
          setImgCount(images.length);
          setFolderCount(subFolders.length);
        }
      } catch (e) {
        console.error("[FolderCard] Failed to fetch count", e);
        if (mounted) {
          setImgCount(0);
          setFolderCount(0);
        }
      }
    };
    fetchCount();
    return () => {
      mounted = false;
    };
  }, [path]);

  const handleAnalyze = async () => {
    setProcessing(true);
    try {
      const allImagesResp = await api.images.getAll();
      const images = allImagesResp.data
        ? allImagesResp.data.filter(
            (img) => img.FolderPath && img.FolderPath.startsWith(path)
          )
        : [];
      if (!images.length) {
        toast.warn("No images in folder");
        setProcessing(false);
        return;
      }

      // Dispatch all
      const dispatch = await Promise.all(
        images.map(async (img) => {
          try {
            const r = await api.queue.extract({
              ImageName: img.ImageName,
              Size: img.Size || 0,
              ImagePath: img.ImagePath,
              Status: img.Status,
              CreatedAt: img.CreatedAt,
              FolderPath: img.FolderPath || "",
            });
            return { taskId: r.task_id, image: img.ImageName };
          } catch (e) {
            console.error("[FolderCard] enqueue failed", img.ImageName, e);
            return { taskId: null, image: img.ImageName, error: e };
          }
        })
      );

      const valid = dispatch.filter((d) => d.taskId);
      const failed = dispatch.length - valid.length;
      let attempts = 0;
      const maxAttempts = 180;
      const stateMap = new Map();
      const pollOnce = async () => {
        attempts++;
        const pending = valid.filter((v) => {
          const st = stateMap.get(v.taskId);
          return !(st === "SUCCESS" || st === "FAILURE");
        });
        if (!pending.length) return true;
        await Promise.all(
          pending.map(async (p) => {
            try {
              const st = await api.queue.taskStatus(p.taskId);
              stateMap.set(p.taskId, st.state);
            } catch (e) {
              /* ignore */
            }
          })
        );
        if (attempts >= maxAttempts) return true;
        const doneCount = valid.filter((v) => {
          const st = stateMap.get(v.taskId);
          return st === "SUCCESS" || st === "FAILURE";
        }).length;
        return doneCount + failed >= images.length;
      };

      while (true) {
        const done = await pollOnce();
        if (done) break;
        await new Promise((r) =>
          setTimeout(r, POLLING_CONFIG.TASK_STATUS_INTERVAL)
        );
      }

      onRefresh();
      toast.success(
        `Parallel analyzed ${images.length - failed} images${
          failed ? ` (${failed} failed enqueue)` : ""
        }`
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete folder",
      message: `Delete '${folderName}' and all its images?`,
      type: "danger",
      confirmText: "Delete",
    });
    if (!ok) return;
    setProcessing(true);
    try {
      await api.images.deleteFolder(path);
      onRefresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProcessing(false);
    }
  };

  // Animation variants for React Bits style
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.5,
      },
    },
    hover: {
      scale: 1.02,
      y: -4,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 17,
      },
    },
  };

  const iconVariants = {
    hidden: {
      opacity: 0,
      scale: 0,
      rotate: -180,
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
        delay: 0.2,
      },
    },
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const contentVariants = {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const buttonVariants = {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <motion.div
      className="group relative flex min-h-[350px] cursor-pointer flex-col rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={() => onNavigate(path)}
    >
      <motion.div
        className="flex flex-1 flex-col items-center justify-center p-6 pb-20"
        variants={contentVariants}
      >
        <motion.div
          className="mb-4 flex items-center justify-center"
          variants={iconVariants}
          whileHover="hover"
        >
          <Folder
            color="#3b82f6"
            size={1.2}
            items={[]}
            className="cursor-default"
          />
        </motion.div>
        <motion.span
          className="mb-2 w-full truncate text-center text-base font-semibold text-white"
          variants={contentVariants}
        >
          {folderName}
        </motion.span>
        {(imgCount !== null || folderCount !== null) && (
          <motion.span
            className="text-sm text-white/70"
            variants={contentVariants}
          >
            {folderCount !== null && `${folderCount} thư mục`}
            {folderCount !== null && imgCount !== null && ", "}
            {imgCount !== null && `${imgCount} hình ảnh`}
          </motion.span>
        )}
      </motion.div>
      {/* Action buttons - Bottom of card */}
      <motion.div
        className="bg-transparent absolute bottom-4 left-4 right-4 flex items-center space-x-2 border-t border-white/10 pt-4"
        variants={buttonVariants}
      >
        {/* Analyze Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="z-10 flex-1"
        >
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleAnalyze();
            }}
            disabled={processing}
            isLoading={processing}
            variant="primary"
            size="md"
            className="text-black w-full bg-white shadow-lg hover:bg-white/90"
            leftIcon={!processing && <FaPlay className="h-4 w-4" />}
          >
            {processing ? "Đang xử lý" : "Phân tích"}
          </Button>
        </motion.div>

        {/* Delete Button */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="z-10"
        >
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={processing}
            isLoading={processing}
            variant="secondary"
            size="icon"
            className="border border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/20"
          >
            <FaTrash className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
      {processing && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.svg
            className="h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </motion.svg>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FolderCard;
