import { MdFolder, MdPlayArrow, MdDelete } from "react-icons/md";
import { api } from "config/api";
import { useEffect, useState } from "react";
import { useToast, useConfirm } from "components/common/ToastProvider";

const FolderCard = ({ path, currentFolder, onNavigate, onRefresh }) => {
  const folderName = path.split("/").pop();
  const [processing, setProcessing] = useState(false);
  const [imgCount, setImgCount] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        const allImages = await api.images.getAll();
        const images = allImages.filter(img => img.FolderPath && img.FolderPath.startsWith(path));
        if (mounted) setImgCount(images.length);
      } catch (e) {
        console.error("[FolderCard] Failed to fetch count", e);
      }
    };
    fetchCount();
    return () => { mounted = false; };
  }, [path]);

  const handleAnalyze = async () => {
    setProcessing(true);
    try {
      const allImages = await api.images.getAll();
      const images = allImages.filter(img => img.FolderPath && img.FolderPath.startsWith(path));
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await api.formExtraction.extract({
          title: img.ImageName,
          size: "—",
          image: img.ImagePath,
          status: img.Status,
          createAt: img.CreatedAt,
          folderPath: img.FolderPath || "",
        });
      }
      onRefresh();
      toast.success(`Analyzed ${images.length} images in '${folderName}'`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({title:"Delete folder",message:`Delete '${folderName}' and all its images?`,type:"danger",confirmText:"Delete"});
    if(!ok) return;
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

  return (
    <div className="group relative flex flex-col items-center justify-center bg-white dark:bg-navy-700 border border-gray-200 rounded-xl p-6 shadow hover:shadow-xl hover:border-brand-500 transition cursor-pointer" onClick={() => onNavigate(path)}>
      <MdFolder className="h-12 w-12 text-brand-500 mb-2" />
      <span className="text-sm font-medium text-gray-800 dark:text-white truncate w-full text-center">{folderName}</span>
      {imgCount !== null && <span className="text-xs text-gray-500 mt-1">{imgCount} images</span>}
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
        <button onClick={(e)=>{e.stopPropagation();handleAnalyze();}} disabled={processing} className="p-1 bg-brand-500 hover:bg-brand-600 rounded text-white text-xs"><MdPlayArrow/></button>
        <button onClick={(e)=>{e.stopPropagation();handleDelete();}} disabled={processing} className="p-1 bg-red-500 hover:bg-red-600 rounded text-white text-xs"><MdDelete/></button>
      </div>
      {processing && (
        <div className="absolute inset-0 bg-white/70 dark:bg-navy-700/70 flex items-center justify-center rounded-xl">
          <svg className="animate-spin h-5 w-5 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
        </div>
      )}
    </div>
  );
};

export default FolderCard;