import { MdFolder, MdPlayArrow, MdDelete } from "react-icons/md";
import { IoFolderOpenOutline, IoPlayOutline, IoTrashOutline } from "react-icons/io5";
import { FaFolderOpen, FaPlay, FaTrash, FaSpinner } from "react-icons/fa";
import { api } from "config/api";
import { api as apiFE } from "config/api";
import { useEffect, useState } from "react";
import { useToast, useConfirm } from "components/common/ToastProvider";
import { POLLING_CONFIG } from "../../config/polling";

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
        const allImages = await api.images.getAll();
        const images = allImages.filter(img => img.FolderPath && img.FolderPath.startsWith(path));
        const folderData = await apiFE.images.getFolders();
        const allFolders = folderData.folders || [];
        const subFolders = allFolders.filter(f=> f.startsWith(path+"/") );
        if (mounted) {
          setImgCount(images.length);
          setFolderCount(subFolders.length);
        }
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
      const allImagesResp = await api.images.getAll();
      const images = allImagesResp.data ? allImagesResp.data.filter(img => img.FolderPath && img.FolderPath.startsWith(path)) : [];
      if(!images.length){ toast.warn('No images in folder'); setProcessing(false); return; }

      // Dispatch all
      const dispatch = await Promise.all(images.map(async img => {
        try {
          const r = await api.queue.extract({
            ImageName: img.ImageName,
            Size: img.Size || 0,
            ImagePath: img.ImagePath,
            Status: img.Status,
            CreatedAt: img.CreatedAt,
            FolderPath: img.FolderPath || "",
          });
          return {taskId: r.task_id, image: img.ImageName};
        } catch(e){
          console.error('[FolderCard] enqueue failed', img.ImageName, e);
          return {taskId: null, image: img.ImageName, error: e};
        }
      }));

      const valid = dispatch.filter(d=>d.taskId);
      const failed = dispatch.length - valid.length;
      let attempts=0; const maxAttempts=180; const stateMap=new Map();
      const pollOnce = async () => {
        attempts++;
        const pending = valid.filter(v=> {
          const st = stateMap.get(v.taskId);
          return !(st==='SUCCESS'||st==='FAILURE');
        });
        if(!pending.length) return true;
        await Promise.all(pending.map(async p => {
          try { const st = await api.queue.taskStatus(p.taskId); stateMap.set(p.taskId, st.state);} catch(e){/* ignore */}
        }));
        if(attempts>=maxAttempts) return true;
        const doneCount = valid.filter(v=>{const st=stateMap.get(v.taskId); return st==='SUCCESS'||st==='FAILURE';}).length;
        return (doneCount + failed) >= images.length;
      };

      while(true){
        const done = await pollOnce();
        if(done) break;
        await new Promise(r=>setTimeout(r,POLLING_CONFIG.TASK_STATUS_INTERVAL));
      }

      onRefresh();
      toast.success(`Parallel analyzed ${images.length - failed} images${failed?` (${failed} failed enqueue)`:''}`);
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
    <div className="group relative flex flex-col bg-gradient-to-br from-white to-gray-50 dark:bg-gradient-to-br dark:from-navy-700 dark:to-navy-800 border border-gray-200 dark:border-navy-600 rounded-2xl shadow-lg hover:shadow-2xl hover:border-blue-400 transition-all duration-300 cursor-pointer min-h-[220px]" onClick={() => onNavigate(path)}>
      <div className="flex flex-col items-center justify-center flex-1 p-6 pb-20">
        <div className="p-5 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-2xl mb-4">
          <IoFolderOpenOutline className="h-14 w-14 text-blue-600 dark:text-blue-400" />
        </div>
        <span className="text-base font-semibold text-gray-800 dark:text-white truncate w-full text-center mb-2">{folderName}</span>
        {(imgCount!==null || folderCount!==null) && (
          <span className="text-sm text-gray-500">
            {folderCount!==null && `${folderCount} thư mục`}{folderCount!==null && imgCount!==null && ", "}{imgCount!==null && `${imgCount} hình ảnh`}
          </span>
        )}
      </div>
      {/* Action buttons - Bottom of card */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-navy-600 bg-white dark:bg-transparent">
        {/* Analyze Button */}
        <button
          onClick={(e)=>{e.stopPropagation();handleAnalyze();}}
          disabled={processing}
          className={`flex-1 flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 z-10 ${
            processing
              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 shadow-md hover:shadow-lg"
          }`}
        >
          {processing ? (
            <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FaPlay className="h-4 w-4 mr-2" />
          )}
          {processing ? "Đang xử lý" : "Phân tích"}
        </button>

        {/* Delete Button */}
        <button
          onClick={(e)=>{e.stopPropagation();handleDelete();}}
          disabled={processing}
          className={`flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 z-10 ${
            processing
              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 active:from-gray-700 active:to-gray-800 shadow-md hover:shadow-lg"
          }`}
        >
          {processing ? (
            <FaSpinner className="h-4 w-4 animate-spin" />
          ) : (
            <FaTrash className="h-4 w-4" />
          )}
        </button>
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