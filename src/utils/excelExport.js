import * as XLSX from 'xlsx';

/**
 * Export data to Excel file with full information
 * @param {Array} data - Array of data objects to export
 * @param {string} filename - Name of the file to export
 * @param {string} sheetName - Name of the worksheet
 */
export const exportToExcel = (data, filename = 'export.xlsx', sheetName = 'Sheet1') => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, filename);
    
    console.log(`Excel file exported successfully: ${filename}`);
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

/**
 * Export images data with full analysis results
 * @param {Array} images - Array of image objects
 * @param {string} filename - Name of the file
 */
export const exportImagesToExcel = async (images, filename = 'images_export.xlsx') => {
  try {
    // Prepare data with all fields
    const exportData = images.map((img, index) => {
      const baseData = {
        'No.': index + 1,
        'Image Name': img.ImageName || '',
        'Status': img.Status || '',
        'Folder Path': img.FolderPath || '',
        'Size (MB)': img.Size || 0,
        'Created At': img.CreatedAt || '',
        'Image URL': img.ImagePath || '',
      };
      
      // Add analysis results if available
      if (img.analysis_result) {
        const analysis = img.analysis_result;
        
        // Add all analysis fields
        Object.keys(analysis).forEach(key => {
          const value = analysis[key];
          // Handle nested objects
          if (typeof value === 'object' && value !== null) {
            baseData[key] = JSON.stringify(value);
          } else {
            baseData[key] = value || '';
          }
        });
      }
      
      return baseData;
    });
    
    exportToExcel(exportData, filename, 'Images');
    return true;
  } catch (error) {
    console.error('Error exporting images to Excel:', error);
    throw error;
  }
};

/**
 * Export multiple sheets to one Excel file
 * @param {Object} sheetsData - Object with sheet names as keys and data arrays as values
 * @param {string} filename - Name of the file
 */
export const exportMultipleSheetsToExcel = (sheetsData, filename = 'export.xlsx') => {
  try {
    const workbook = XLSX.utils.book_new();
    
    Object.keys(sheetsData).forEach(sheetName => {
      const data = sheetsData[sheetName];
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    XLSX.writeFile(workbook, filename);
    console.log(`Multi-sheet Excel file exported successfully: ${filename}`);
    return true;
  } catch (error) {
    console.error('Error exporting multiple sheets to Excel:', error);
    throw error;
  }
};

/**
 * Export dashboard statistics to Excel
 * @param {Object} stats - Statistics object
 * @param {string} filename - Name of the file
 */
export const exportDashboardStats = (stats, filename = 'dashboard_statistics.xlsx') => {
  try {
    const sheetsData = {};
    
    // Summary sheet
    if (stats.summary) {
      sheetsData['Summary'] = [{
        'Total Images': stats.summary.totalImages || 0,
        'Uploaded': stats.summary.uploaded || 0,
        'Processing': stats.summary.processing || 0,
        'Completed': stats.summary.completed || 0,
        'Failed': stats.summary.failed || 0,
        'Total Size (MB)': stats.summary.totalSize || 0,
        'Average Size (MB)': stats.summary.avgSize || 0,
      }];
    }
    
    // By Status sheet
    if (stats.byStatus && Array.isArray(stats.byStatus)) {
      sheetsData['By Status'] = stats.byStatus;
    }
    
    // By Folder sheet
    if (stats.byFolder && Array.isArray(stats.byFolder)) {
      sheetsData['By Folder'] = stats.byFolder;
    }
    
    // By Date sheet
    if (stats.byDate && Array.isArray(stats.byDate)) {
      sheetsData['By Date'] = stats.byDate;
    }
    
    // Recent Activity sheet
    if (stats.recentActivity && Array.isArray(stats.recentActivity)) {
      sheetsData['Recent Activity'] = stats.recentActivity.map((item, index) => ({
        'No.': index + 1,
        'Image Name': item.ImageName || '',
        'Status': item.Status || '',
        'Folder': item.FolderPath || '',
        'Created At': item.CreatedAt || '',
      }));
    }
    
    exportMultipleSheetsToExcel(sheetsData, filename);
    return true;
  } catch (error) {
    console.error('Error exporting dashboard stats to Excel:', error);
    throw error;
  }
};

export default {
  exportToExcel,
  exportImagesToExcel,
  exportMultipleSheetsToExcel,
  exportDashboardStats,
};
