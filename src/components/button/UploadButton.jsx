import { useRef, useState } from "react";
import { MdCloudUpload, MdCheckCircle, MdError } from "react-icons/md";
import { api } from "config/api";
import { POLLING_CONFIG } from "../../config/polling";

const UploadButton = ({ onUploadComplete, folderPath = "" }) => {
    const inputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("idle"); // idle, processing, done, error
    const [uploadedCount, setUploadedCount] = useState(0);
    const [totalFiles, setTotalFiles] = useState(0);
    const [phase, setPhase] = useState('idle'); // idle | uploading | waiting | extracting | done
    const [extractProgress, setExtractProgress] = useState({done:0,total:0});

    const handleUploadClick = () => {
        if (!isUploading) {
            inputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setPhase('uploading');
        setTotalFiles(files.length);
        setUploadedCount(0);
        setUploadProgress(0);
        setIsUploading(true);
        setUploadStatus("processing");

        let uploaded = 0;
        const uploadTaskIds = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append("status", "Uploaded");
            formData.append("file", file, file.name);
            formData.append("folderPath", folderPath);

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
                const resp = await api.queue.upload(formData); // enqueue upload
                uploadTaskIds.push(resp.task_id);
                uploaded++;
                setUploadedCount(uploaded);
                setUploadProgress(Math.round((uploaded / files.length) * 100));
            } catch {
                setUploadStatus("error");
                setIsUploading(false);
                return;
            }
        }
        // Poll all upload tasks in parallel until done to get generated image names
        setPhase('waiting');
        const uploadsInfo = [];
        let attempts = 0; const maxAttempts = 180;
        while(attempts < maxAttempts){
            attempts++;
            const statuses = await Promise.all(uploadTaskIds.map(id => api.queue.taskStatus(id).catch(()=>null)));
            let allDone = true;
            statuses.forEach((st,idx)=>{
                if(!st || (st.state!=='SUCCESS' && st.state!=='FAILURE')) allDone=false; else if(st.state==='SUCCESS'){ if(!uploadsInfo.find(u=>u.taskId===uploadTaskIds[idx])) uploadsInfo.push({taskId:uploadTaskIds[idx], ...st.result}); }
            });
            if(allDone) break;
            await new Promise(r=>setTimeout(r,POLLING_CONFIG.UPLOAD_INTERVAL));
        }
        // Start extraction for successfully uploaded images
        const toExtract = uploadsInfo.filter(u=>u && u.image_name && u.url);
        setPhase('extracting');
        setExtractProgress({done:0,total:toExtract.length});
        const extractTasks = await Promise.all(toExtract.map(async meta => {
            try {
                const createdAt = meta.image_name.split('.')[0];
                const queueResp = await api.queue.extract({
                    ImageName: meta.image_name,
                    ImagePath: meta.url,
                    Status: 'Uploaded',
                    CreatedAt: createdAt,
                    FolderPath: folderPath || '',
                    Size: 0
                });
                return {taskId: queueResp.task_id, image: meta.image_name};
            } catch(e){ return {taskId:null,image:meta.image_name,error:e}; }
        }));
        // Poll extraction tasks
        let doneCount=0; attempts=0; const maxAttemptsExtract=POLLING_CONFIG.MAX_EXTRACT_ATTEMPTS; const stateMap=new Map();
        while(attempts < maxAttemptsExtract){
            attempts++;
            const pending = extractTasks.filter(t=>t.taskId && !(stateMap.get(t.taskId)==='SUCCESS'||stateMap.get(t.taskId)==='FAILURE'));
            if(!pending.length) break;
            await Promise.all(pending.map(async t=>{ try{ const st= await api.queue.taskStatus(t.taskId); stateMap.set(t.taskId, st.state);}catch{}}));
            doneCount = extractTasks.filter(t=> t.taskId && ['SUCCESS','FAILURE'].includes(stateMap.get(t.taskId))).length + extractTasks.filter(t=>!t.taskId).length;
            setExtractProgress({done:doneCount,total:extractTasks.length});
            if(doneCount>=extractTasks.length) break;
            await new Promise(r=>setTimeout(r,POLLING_CONFIG.UPLOAD_INTERVAL));
        }
        setUploadStatus("done");
        setPhase('done');
        if (onUploadComplete) onUploadComplete();
        setTimeout(()=>{ setIsUploading(false); setUploadStatus('idle'); setUploadProgress(0); setUploadedCount(0); setTotalFiles(0); setPhase('idle'); setExtractProgress({done:0,total:0}); },2000);
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
        if(phase==='uploading') return `Uploading (${uploadedCount}/${totalFiles})`;
        if(phase==='waiting') return 'Finalizing uploads...';
        if(phase==='extracting') return `Extracting (${extractProgress.done}/${extractProgress.total})`;
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
                        : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 shadow-md"
                }`}
            >
                <span className="mr-2">{getStatusIcon()}</span>
                {getStatusText()}
            </button>

            {/* Global progress overlay */}
            {isUploading && (
              <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-1/2 z-50 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">{phase==='extracting' ? 'Extracting...' : phase==='waiting' ? 'Waiting tasks...' : 'Uploading images...'}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {phase==='extracting' ? `${extractProgress.done}/${extractProgress.total}` : `${uploadedCount}/${totalFiles}`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-brand-500 transition-all"
                    style={{ width: phase==='extracting' && extractProgress.total ? `${(extractProgress.done / extractProgress.total) * 100}%` : `${totalFiles ? (uploadedCount / totalFiles) * 100 : 0}%` }}
                  ></div>
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