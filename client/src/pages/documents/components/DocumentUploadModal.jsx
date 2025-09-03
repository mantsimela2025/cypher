import React, { useState, useRef } from 'react';
import { Icon, Button } from '@/components/Component';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  FormGroup,
  Label,
  Progress,
  Badge
} from 'reactstrap';

const DocumentUploadModal = ({ isOpen, onClose, onUpload }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Add file validation logic here
      const maxSize = 50 * 1024 * 1024; // 50MB
      return file.size <= maxSize;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    const type = file.type;
    if (type.includes('pdf')) return 'file-pdf';
    if (type.includes('word')) return 'file-word';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'file-excel';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'file-ppt';
    if (type.includes('image')) return 'img';
    if (type.includes('video')) return 'video';
    if (type.includes('audio')) return 'music';
    if (type.includes('text')) return 'file-text';
    return 'file';
  };

  const getFileTypeColor = (file) => {
    const type = file.type;
    if (type.includes('pdf')) return 'danger';
    if (type.includes('word')) return 'primary';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'success';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'warning';
    if (type.includes('image')) return 'info';
    if (type.includes('video')) return 'dark';
    return 'secondary';
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          onUpload(selectedFiles);
          setSelectedFiles([]);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFiles([]);
      setUploadProgress(0);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={handleClose} size="lg">
      <ModalHeader toggle={handleClose}>
        <Icon name="upload" className="me-2" />
        Upload Documents
      </ModalHeader>
      <ModalBody>
        {/* Drop Zone */}
        <div
          className={`upload-dropzone ${dragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center py-4">
            <Icon name="upload" className="text-muted mb-3" style={{ fontSize: '3rem' }} />
            <h6 className="mb-2">Drop files here or click to browse</h6>
            <p className="text-muted small mb-0">
              Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, Images
              <br />
              Maximum file size: 50MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
          />
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h6 className="mb-3">Selected Files ({selectedFiles.length})</h6>
            <div className="selected-files-list">
              {selectedFiles.map((file, index) => (
                <div key={index} className="d-flex align-items-center justify-content-between p-3 border rounded mb-2">
                  <div className="d-flex align-items-center">
                    <Icon
                      name={getFileIcon(file)}
                      className={`text-${getFileTypeColor(file)} me-3`}
                      style={{ fontSize: '1.5rem' }}
                    />
                    <div>
                      <div className="fw-medium" style={{ fontSize: '0.875rem' }}>
                        {file.name}
                      </div>
                      <div className="text-muted small">
                        {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Badge
                      color={getFileTypeColor(file)}
                      className="badge-dim"
                      style={{ fontSize: '0.7rem' }}
                    >
                      {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </Badge>
                    <Button
                      size="sm"
                      color="transparent"
                      className="btn-icon"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <Icon name="cross" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-medium">Uploading files...</span>
              <span className="text-muted">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} color="primary" />
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          color="primary"
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || uploading}
        >
          {uploading ? (
            <>
              <Icon name="loader" className="me-2" />
              Uploading...
            </>
          ) : (
            <>
              <Icon name="upload" className="me-2" />
              Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </ModalFooter>

      <style jsx>{`
        .upload-dropzone {
          border: 2px dashed #e5e9f2;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .upload-dropzone:hover,
        .upload-dropzone.drag-over {
          border-color: #6576ff;
          background-color: #f8f9ff;
        }
        
        .selected-files-list {
          max-height: 300px;
          overflow-y: auto;
        }
      `}</style>
    </Modal>
  );
};

export default DocumentUploadModal;
