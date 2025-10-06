# 📊 Polling Configuration

Cấu hình tập trung cho tất cả polling intervals trong ứng dụng.

## 🔧 Cấu hình hiện tại

### ⏱️ **Intervals (5 giây)**
- `DEFAULT_INTERVAL`: 5000ms - Interval mặc định
- `UPLOAD_INTERVAL`: 5000ms - Polling cho upload tasks
- `EXTRACT_INTERVAL`: 5000ms - Polling cho extract tasks  
- `ANALYSIS_INTERVAL`: 5000ms - Polling cho analysis tasks
- `TASK_STATUS_INTERVAL`: 5000ms - Polling cho task status

### 🚀 **Quick Intervals (1 giây)**
- `QUICK_INTERVAL`: 1000ms - Polling nhanh cho feedback tức thì
- `QUICK_MAX_ATTEMPTS`: 30 - Tối đa 30 giây cho quick polling

### ⏰ **Max Attempts (5 phút)**
- `MAX_ATTEMPTS`: 60 - Tổng số attempts (5 phút với 5s interval)
- `MAX_UPLOAD_ATTEMPTS`: 60 - Max attempts cho upload
- `MAX_EXTRACT_ATTEMPTS`: 60 - Max attempts cho extract
- `MAX_ANALYSIS_ATTEMPTS`: 60 - Max attempts cho analysis

## 📁 **Files sử dụng polling config**

### Hooks
- `src/hooks/useImageAnalysis.js` - Image analysis polling

### Components
- `src/components/button/UploadButton.jsx` - Upload & extract polling
- `src/components/image/NftCard.jsx` - Task status polling
- `src/components/image/ImageDialog.jsx` - Task status polling
- `src/components/folder/FolderCard.jsx` - Task status polling

### Views
- `src/views/admin/imagemanagement/index.jsx` - Parallel analysis polling
- `src/views/admin/dashboard/index.jsx` - Task status polling

## 🎯 **Lợi ích**

### ✅ **Performance**
- Giảm tải server từ 1s → 5s
- Giảm 80% số lượng API calls
- Tiết kiệm bandwidth và CPU

### ✅ **Maintainability**
- Cấu hình tập trung trong 1 file
- Dễ dàng thay đổi interval cho toàn bộ app
- Consistent polling behavior

### ✅ **User Experience**
- Vẫn responsive với 5s interval
- Có quick polling cho feedback tức thì
- Timeout hợp lý (5 phút)

## 🔄 **Cách sử dụng**

```javascript
import { POLLING_CONFIG } from '../config/polling';

// Sử dụng interval
setTimeout(poll, POLLING_CONFIG.ANALYSIS_INTERVAL);

// Sử dụng max attempts
const maxAttempts = POLLING_CONFIG.MAX_ATTEMPTS;

// Sử dụng quick polling
setTimeout(poll, POLLING_CONFIG.QUICK_INTERVAL);
```

## ⚙️ **Tùy chỉnh**

Để thay đổi polling interval, chỉ cần sửa file `src/config/polling.js`:

```javascript
export const POLLING_CONFIG = {
  DEFAULT_INTERVAL: 3000, // 3 giây
  // ... other configs
};
```

Tất cả components sẽ tự động sử dụng interval mới! 🚀
