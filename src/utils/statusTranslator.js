/**
 * Translate status from English to Vietnamese
 * @param {string} status - Status in English
 * @returns {string} - Status in Vietnamese
 */
export const translateStatus = (status) => {
  const statusMap = {
    'Completed': 'Hoàn thành',
    'Uploaded': 'Đã tải lên',
    'Processing': 'Đang xử lý',
    'Verify': 'Xác minh',
    'Synced': 'Đã đồng bộ',
    'Failed': 'Thất bại',
    'Pending': 'Đang chờ',
    'Error': 'Lỗi',
    'Success': 'Thành công'
  };

  return statusMap[status] || status;
};

/**
 * Get color class for status badge
 * @param {string} status - Status in English
 * @returns {string} - Tailwind CSS classes
 */
export const getStatusColor = (status) => {
  const colorMap = {
    'Completed': 'bg-green-100 text-green-700 border-green-200',
    'Uploaded': 'bg-red-100 text-red-700 border-red-200',
    'Processing': 'bg-orange-100 text-orange-800 border-orange-200',
    'Verify': 'bg-purple-100 text-purple-700 border-purple-200',
    'Synced': 'bg-orange-100 text-orange-700 border-orange-200',
    'Failed': 'bg-red-100 text-red-700 border-red-200',
    'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Error': 'bg-red-100 text-red-700 border-red-200',
    'Success': 'bg-green-100 text-green-700 border-green-200'
  };

  return colorMap[status] || 'bg-gray-100 text-gray-700 border-gray-200';
};

