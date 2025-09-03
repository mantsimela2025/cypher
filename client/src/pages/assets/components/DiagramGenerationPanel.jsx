import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Form,
  Label,
  Alert,
  Spinner,
  Card,
  CardBody,
  Badge
} from "reactstrap";
import { useForm } from "react-hook-form";
import { Button, Icon, UserAvatar } from "@/components/Component";
import SlideOutPanel from "@/components/partials/SlideOutPanel";
import MermaidDiagramViewer from "./MermaidDiagramViewer";
import { diagramsApi } from "@/utils/diagramsApi";
import { toast } from "react-toastify";
import "./DiagramGenerationPanel.css";

const DiagramGenerationPanel = ({ 
  isOpen, 
  onClose, 
  selectedAssets = [], 
  onDiagramGenerated 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedDiagram, setGeneratedDiagram] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      diagramType: 'boundary',
      diagramName: '',
      includeMetadata: true,
      aiAnalysis: true
    }
  });

  const watchedDiagramType = watch('diagramType');
  const diagramTypes = diagramsApi.getDiagramTypes();
  const exportFormats = diagramsApi.getExportFormats();

  // Helper function to get first letters for avatar
  const findUpper = (string) => {
    const matches = string.match(/[A-Z]/g);
    return matches ? matches.join("").slice(0, 2) : string.slice(0, 2).toUpperCase();
  };

  // Generate default diagram name based on type and selection
  useEffect(() => {
    if (selectedAssets.length > 0 && watchedDiagramType) {
      const typeLabel = diagramTypes.find(t => t.value === watchedDiagramType)?.label || 'Diagram';
      const defaultName = `${typeLabel} - ${selectedAssets.length} Assets - ${new Date().toLocaleDateString()}`;
      reset({ 
        ...watch(),
        diagramName: defaultName
      });
    }
  }, [watchedDiagramType, selectedAssets.length]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Generating diagram with data:', data);
      
      const requestData = {
        ...data,
        assetUuids: selectedAssets.map(asset => asset.assetUuid),
        assets: selectedAssets // Include full asset data for AI analysis
      };

      const response = await diagramsApi.generateDiagram(requestData);
      
      if (response.success) {
        console.log('✅ Diagram generated successfully:', response.data);
        setGeneratedDiagram(response.data);
        setShowPreview(true);
        toast.success('Diagram generated successfully!');
        
        if (onDiagramGenerated) {
          onDiagramGenerated(response.data);
        }
      } else {
        throw new Error(response.message || 'Failed to generate diagram');
      }
      
    } catch (error) {
      console.error('❌ Error generating diagram:', error);
      setError(error.message || 'Failed to generate diagram');
      toast.error(`Failed to generate diagram: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (!generatedDiagram?.id) {
      toast.error('No diagram to export');
      return;
    }

    setExporting(true);
    try {
      await diagramsApi.exportDiagram(generatedDiagram.id, format);
      toast.success(`Diagram exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('❌ Error exporting diagram:', error);
      toast.error(`Failed to export diagram: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    setGeneratedDiagram(null);
    setShowPreview(false);
    setLoading(false);
    setExporting(false);
    onClose();
  };

  const handleBackToOptions = () => {
    setShowPreview(false);
    setGeneratedDiagram(null);
  };

  const selectedDiagramType = diagramTypes.find(t => t.value === watchedDiagramType);

  const panelTitle = (
    <>
      <Icon name="diagram-3" className="me-2"></Icon>
      {showPreview ? 'Diagram Preview' : 'Generate Diagram'} / <span className="text-primary">{selectedAssets.length} Assets Selected</span>
    </>
  );

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={handleClose}
      title={panelTitle}
      width="1200px"
    >
      <div className="diagram-generation-panel">
        {error && (
          <Alert color="danger" className="mb-4">
            <div className="d-flex align-items-center">
              <Icon name="alert-circle" className="me-2"></Icon>
              <div>
                <strong>Error:</strong> {error}
              </div>
            </div>
          </Alert>
        )}

        {!showPreview ? (
          // Diagram Generation Form
          <Form onSubmit={handleSubmit(onSubmit)} className="form-validate">
            {/* Selected Assets Preview */}
            <div className="form-section mb-4">
              <h6 className="form-section-title">Selected Assets ({selectedAssets.length})</h6>
              <div className="selected-assets-preview">
                {selectedAssets.slice(0, 6).map((asset, index) => (
                  <div key={asset.assetUuid} className="asset-preview-item">
                    <UserAvatar
                      size="sm"
                      theme="primary"
                      text={findUpper(asset.hostname || asset.netbiosName || 'UN')}
                    />
                    <div className="asset-info">
                      <span className="asset-name">{asset.hostname || asset.netbiosName || 'Unknown'}</span>
                      <small className="text-muted">{asset.ipv4Address || 'N/A'}</small>
                    </div>
                  </div>
                ))}
                {selectedAssets.length > 6 && (
                  <div className="asset-preview-item more-assets">
                    <div className="text-muted">+{selectedAssets.length - 6} more</div>
                  </div>
                )}
              </div>
            </div>

            {/* Diagram Configuration */}
            <div className="form-section">
              <h6 className="form-section-title">Diagram Configuration</h6>
              <Row className="g-gs">
                <Col md="12">
                  <div className="form-group">
                    <Label className="form-label" htmlFor="diagramName">
                      Diagram Name <span className="text-danger">*</span>
                    </Label>
                    <div className="form-control-wrap">
                      <input
                        type="text"
                        id="diagramName"
                        className="form-control"
                        placeholder="Enter a name for your diagram"
                        {...register('diagramName', { 
                          required: 'Diagram name is required',
                          maxLength: { value: 100, message: 'Name must be less than 100 characters' }
                        })}
                      />
                      {errors.diagramName && <span className="invalid">{errors.diagramName.message}</span>}
                    </div>
                  </div>
                </Col>

                <Col md="12">
                  <div className="form-group">
                    <Label className="form-label">
                      Diagram Type <span className="text-danger">*</span>
                    </Label>
                    <div className="diagram-type-selector">
                      {diagramTypes.map((type) => (
                        <div key={type.value} className="diagram-type-option">
                          <input
                            type="radio"
                            id={`type-${type.value}`}
                            value={type.value}
                            className="diagram-type-radio"
                            {...register('diagramType', { required: 'Please select a diagram type' })}
                          />
                          <label htmlFor={`type-${type.value}`} className="diagram-type-label">
                            <div className="diagram-type-card">
                              <Icon name={type.icon} className="diagram-type-icon"></Icon>
                              <div className="diagram-type-info">
                                <h6 className="diagram-type-title">{type.label}</h6>
                                <p className="diagram-type-desc">{type.description}</p>
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                    {errors.diagramType && <span className="invalid d-block mt-2">{errors.diagramType.message}</span>}
                  </div>
                </Col>
              </Row>
            </div>

            {/* Advanced Options */}
            <div className="form-section">
              <h6 className="form-section-title">Advanced Options</h6>
              <Row className="g-gs">
                <Col md="6">
                  <div className="form-group">
                    <div className="custom-control custom-checkbox">
                      <input
                        type="checkbox"
                        className="custom-control-input"
                        id="aiAnalysis"
                        {...register('aiAnalysis')}
                      />
                      <label className="custom-control-label" htmlFor="aiAnalysis">
                        <strong>AI-Powered Analysis</strong>
                        <small className="d-block text-muted">Use AI to infer relationships and optimize diagram layout</small>
                      </label>
                    </div>
                  </div>
                </Col>

                <Col md="6">
                  <div className="form-group">
                    <div className="custom-control custom-checkbox">
                      <input
                        type="checkbox"
                        className="custom-control-input"
                        id="includeMetadata"
                        {...register('includeMetadata')}
                      />
                      <label className="custom-control-label" htmlFor="includeMetadata">
                        <strong>Include Metadata</strong>
                        <small className="d-block text-muted">Show additional asset information in the diagram</small>
                      </label>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Selected Type Preview */}
            {selectedDiagramType && (
              <div className="form-section">
                <Alert color="info" className="d-flex align-items-start">
                  <Icon name={selectedDiagramType.icon} className="me-3 mt-1"></Icon>
                  <div>
                    <strong>{selectedDiagramType.label}</strong>
                    <p className="mb-0 mt-1">{selectedDiagramType.description}</p>
                  </div>
                </Alert>
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted">
                  <small>* Required fields</small>
                </div>
                <div className="d-flex gap-3">
                  <Button
                    color="light"
                    size="md"
                    onClick={handleClose}
                    disabled={loading}
                    className="px-4"
                  >
                    <Icon name="cross" className="me-2"></Icon>
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    size="md"
                    type="submit"
                    disabled={loading}
                    className="px-4"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Icon name="diagram-3" className="me-2"></Icon>
                        Generate Diagram
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Form>
        ) : (
          // Diagram Preview and Export
          <div className="diagram-preview-section">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="mb-1">{generatedDiagram?.name}</h5>
                <div className="d-flex align-items-center gap-3">
                  <Badge color="info" pill>
                    <Icon name={selectedDiagramType?.icon} className="me-1"></Icon>
                    {selectedDiagramType?.label}
                  </Badge>
                  <span className="text-muted">
                    <Icon name="clock" className="me-1"></Icon>
                    Generated {new Date(generatedDiagram?.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="d-flex gap-2">
                <Button
                  color="light"
                  size="sm"
                  onClick={handleBackToOptions}
                  disabled={exporting}
                >
                  <Icon name="arrow-left" className="me-1"></Icon>
                  Back
                </Button>
              </div>
            </div>

            {/* Diagram Viewer */}
            <Card className="diagram-viewer-card mb-4">
              <CardBody className="p-0">
                <MermaidDiagramViewer
                  mermaidSyntax={generatedDiagram?.mermaidSyntax}
                  height="500px"
                  className="diagram-preview"
                />
              </CardBody>
            </Card>

            {/* Export Options */}
            <div className="export-section">
              <h6 className="mb-3">Export Diagram</h6>
              <Row className="g-3">
                {exportFormats.map((format) => (
                  <Col md="4" key={format.value}>
                    <Button
                      color="outline-primary"
                      size="lg"
                      block
                      onClick={() => handleExport(format.value)}
                      disabled={exporting}
                      className="export-format-btn"
                    >
                      {exporting ? (
                        <Spinner size="sm" className="me-2" />
                      ) : (
                        <Icon name={format.icon} className="me-2"></Icon>
                      )}
                      {format.label}
                    </Button>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        )}
      </div>
    </SlideOutPanel>
  );
};

export default DiagramGenerationPanel;