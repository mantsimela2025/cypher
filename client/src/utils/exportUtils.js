/**
 * Export Utilities
 * 
 * This file contains utility functions for exporting data in various formats.
 * Use these functions to maintain consistent export functionality across all datatables.
 */

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file without extension
 */
export const exportToCsv = (data, fileName) => {
  try {
    if (!data || !data.length) {
      console.warn('No data to export');
      return;
    }

    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(value => 
        // Handle values with commas by wrapping in quotes
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value === null || value === undefined 
            ? '' 
            : value
      ).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
  }
};

/**
 * Export data to Excel format
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file without extension
 */
export const exportToExcel = (data, fileName) => {
  try {
    if (!data || !data.length) {
      console.warn('No data to export');
      return;
    }

    // Use dynamic import to load the library only when needed
    import('export-from-json').then(module => {
      const exportFromJSON = module.default;
      exportFromJSON({
        data,
        fileName,
        exportType: 'xls',
        processors: [
          // Optional processing for Excel formatting
          data => {
            // You can add Excel-specific formatting here if needed
            return data;
          }
        ]
      });
    }).catch(error => {
      console.error('Error exporting to Excel:', error);
    });
  } catch (error) {
    console.error('Error exporting to Excel:', error);
  }
};

/**
 * Export data to PDF format using browser print functionality
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file without extension
 * @param {string} title - Title for the PDF document
 */
export const exportToPdf = (data, fileName, title = 'Data Export') => {
  try {
    if (!data || !data.length) {
      console.warn('No data to export');
      return;
    }

    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Please allow pop-ups to export as PDF');
      return;
    }
    
    // Create a styled HTML table
    const tableHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${fileName}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          th, td { 
            padding: 8px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
          }
          th { 
            background-color: #f2f2f2; 
            font-weight: bold; 
          }
          .header { 
            margin-bottom: 20px; 
          }
          .header h1 { 
            margin-bottom: 5px; 
            color: #333;
          }
          .header p { 
            color: #666; 
            margin-top: 0; 
          }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        <button onclick="window.print();window.close();" style="padding: 10px; margin-bottom: 20px; cursor: pointer;">
          Print as PDF
        </button>
        <table>
          <thead>
            <tr>
              ${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${Object.values(row).map(value => `<td>${value !== null && value !== undefined ? value : ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          // Auto-trigger print dialog after a short delay
          setTimeout(() => {
            window.print();
          }, 500);
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(tableHTML);
    printWindow.document.close();
  } catch (error) {
    console.error('Error exporting to PDF:', error);
  }
};

/**
 * Prepare data for export by mapping raw data to human-readable format
 * @param {Array} rawData - Raw data from API or state
 * @param {Object} fieldMappings - Object mapping raw field names to display names
 * @returns {Array} - Formatted data ready for export
 * 
 * Example usage:
 * const exportData = prepareDataForExport(
 *   myData,
 *   {
 *     id: 'ID',
 *     firstName: 'First Name',
 *     lastName: 'Last Name',
 *     email: 'Email Address'
 *   }
 * );
 */
export const prepareDataForExport = (rawData, fieldMappings) => {
  if (!rawData || !rawData.length) return [];
  
  return rawData.map(item => {
    const formattedItem = {};
    
    // If fieldMappings is provided, use it to map fields
    if (fieldMappings) {
      Object.entries(fieldMappings).forEach(([rawField, displayName]) => {
        formattedItem[displayName] = item[rawField] !== undefined ? item[rawField] : '';
      });
    } else {
      // Otherwise, use all fields from the raw data
      Object.entries(item).forEach(([key, value]) => {
        formattedItem[key] = value !== undefined ? value : '';
      });
    }
    
    return formattedItem;
  });
};

/**
 * Main export function that handles all export formats
 * @param {string} format - Export format ('csv', 'excel', or 'pdf')
 * @param {Array} data - Data to export
 * @param {string} entityName - Name of the entity being exported (e.g., 'assets', 'users')
 * @param {Object} fieldMappings - Optional mappings from raw field names to display names
 * @param {string} title - Optional title for PDF export
 */
export const handleExport = (format, data, entityName, fieldMappings = null, title = null) => {
  try {
    if (!data || !data.length) {
      console.warn('No data to export');
      return;
    }
    
    // Prepare data for export
    const exportData = fieldMappings 
      ? prepareDataForExport(data, fieldMappings)
      : data;
    
    // Generate filename with current date
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${entityName}_export_${dateStr}`;
    
    // Export based on format
    switch (format) {
      case 'csv':
        exportToCsv(exportData, fileName);
        break;
      case 'excel':
        exportToExcel(exportData, fileName);
        break;
      case 'pdf':
        exportToPdf(exportData, fileName, title || `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} Export`);
        break;
      default:
        console.warn(`Unknown export format: ${format}`);
    }
  } catch (error) {
    console.error(`Error in handleExport (${format}):`, error);
  }
};

export default {
  exportToCsv,
  exportToExcel,
  exportToPdf,
  prepareDataForExport,
  handleExport
};