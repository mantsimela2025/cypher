// ✅ Following API Development Best Practices Guide - Enhanced API Client Pattern

import { apiClient } from './apiClient';

export const diagramsApi = {
  /**
   * Generate a new diagram from selected assets
   */
  generateDiagram: async (data) => {
    try {
      console.log('🎨 API: Generating diagram with data:', data);
      const response = await apiClient.post('/api/diagrams/generate', data);
      console.log('✅ API: Diagram generation response:', response);
      return response;
    } catch (error) {
      console.error('❌ API: Error generating diagram:', error);
      throw error;
    }
  },

  /**
   * Get user's diagrams with pagination
   */
  getUserDiagrams: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/diagrams', { params });
      console.log('📊 API: Retrieved user diagrams:', response.data);
      return response;
    } catch (error) {
      console.error('❌ API: Error fetching user diagrams:', error);
      throw error;
    }
  },

  /**
   * Get specific diagram by ID
   */
  getDiagramById: async (diagramId) => {
    try {
      const response = await apiClient.get(`/api/diagrams/${diagramId}`);
      return response;
    } catch (error) {
      console.error('❌ API: Error fetching diagram:', error);
      throw error;
    }
  },

  /**
   * Export diagram in specified format
   */
  exportDiagram: async (diagramId, format) => {
    try {
      console.log(`📤 API: Exporting diagram ${diagramId} as ${format}`);
      const response = await apiClient.get(`/api/diagrams/${diagramId}/export/${format}`, {
        responseType: 'blob' // Important for file downloads
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `diagram.${format}`;
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ API: Successfully exported diagram as ${filename}`);
      return { success: true, filename };
    } catch (error) {
      console.error('❌ API: Error exporting diagram:', error);
      throw error;
    }
  },

  /**
   * Delete diagram
   */
  deleteDiagram: async (diagramId) => {
    try {
      const response = await apiClient.delete(`/api/diagrams/${diagramId}`);
      console.log('🗑️ API: Deleted diagram:', diagramId);
      return response;
    } catch (error) {
      console.error('❌ API: Error deleting diagram:', error);
      throw error;
    }
  },

  // Helper functions for diagram types and options
  getDiagramTypes: () => [
    {
      value: 'boundary',
      label: 'Boundary Diagram',
      description: 'Show security zones and asset boundaries',
      icon: 'shield'
    },
    {
      value: 'network',
      label: 'Network Diagram',
      description: 'Display network topology and connections',
      icon: 'globe'
    },
    {
      value: 'dataflow',
      label: 'Data Flow Diagram',
      description: 'Visualize data flow between systems',
      icon: 'arrow-long-right'
    },
    {
      value: 'workflow',
      label: 'Workflow Diagram',
      description: 'Show business processes and workflows',
      icon: 'activity'
    }
  ],

  getExportFormats: () => [
    {
      value: 'png',
      label: 'PNG Image',
      icon: 'img'
    },
    {
      value: 'pdf',
      label: 'PDF Document',
      icon: 'file-pdf'
    },
    {
      value: 'svg',
      label: 'SVG Vector',
      icon: 'code'
    }
  ]
};