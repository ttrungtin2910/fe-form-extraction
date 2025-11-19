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

