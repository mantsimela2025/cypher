import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Form,
  Label,
  Alert,
  Spinner
} from "reactstrap";
import { useForm } from "react-hook-form";
import { Button, Icon } from "@/components/Component";
import SlideOutPanel from "@/components/partials/SlideOutPanel";
import { assetsApi } from "@/utils/assetsApi";
import { systemsApi } from "@/utils/systemsApi";
import "./AddAssetPanel.css";

const AddAssetPanel = ({ isOpen, onClose, onAssetAdded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [systems, setSystems] = useState([]);
  const [systemsLoading, setSystemsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      hostname: '',
      netbiosName: '',
      systemId: '',
      hasAgent: false,
      hasPluginResults: false,
      exposureScore: '',
      acrScore: '',
      criticalityRating: '',
      source: 'manual',
      operatingSystem: '',
      systemType: '',
      fqdn: '',
      ipv4Address: '',
      macAddress: '',
      networkType: ''
    }
  });

  // Fetch systems when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchSystems();
    }
  }, [isOpen]);

  const fetchSystems = async () => {
    setSystemsLoading(true);
    try {
      console.log('🔍 Fetching systems for dropdown...');
      const response = await systemsApi.getSystems({ limit: 1000 });
      console.log('📋 Systems response:', response);

      // Handle different response structures
      const systemsData = response.data || response.systems || [];
      setSystems(systemsData);
      console.log(`✅ Loaded ${systemsData.length} systems`);
    } catch (error) {
      console.error('❌ Error fetching systems:', error);
      // Don't show error to user for systems fetch failure, just log it
    } finally {
      setSystemsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('🚀 Creating asset with data:', data);
      
      // Clean up empty strings and convert types
      const cleanedData = {
        ...data,
        exposureScore: data.exposureScore ? parseInt(data.exposureScore) : null,
        acrScore: data.acrScore ? parseFloat(data.acrScore) : null,
        hasAgent: Boolean(data.hasAgent),
        hasPluginResults: Boolean(data.hasPluginResults)
      };

      // Remove empty strings
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '') {
          cleanedData[key] = null;
        }
      });

      const response = await assetsApi.createAsset(cleanedData);
      console.log('✅ Asset created successfully:', response);
      
      setSuccess(true);
      
      // Reset form
      reset();
      
      // Notify parent component
      if (onAssetAdded) {
        onAssetAdded(response.data);
      }
      
      // Close panel after a short delay to show success message
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error creating asset:', error);
      setError(error.message || 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    setSuccess(false);
    setSystems([]);
    setSystemsLoading(false);
    onClose();
  };

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Asset"
      width="900px"
    >
      <div className="add-asset-panel">
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

        {success && (
          <Alert color="success" className="mb-4">
            <div className="d-flex align-items-center">
              <Icon name="check-circle" className="me-2"></Icon>
              <div>
                <strong>Success!</strong> Asset created successfully!
              </div>
            </div>
          </Alert>
        )}

        <Form onSubmit={handleSubmit(onSubmit)} className="form-validate">
          {/* Basic Information Section */}
          <div className="form-section">
            <h6 className="form-section-title">Basic Information</h6>
            <Row className="g-gs">
              <Col md="6">
                <div className="form-group">
                  <Label className="form-label" htmlFor="hostname">
                    Hostname <span className="text-danger">*</span>
                  </Label>
                  <div className="form-control-wrap">
                    <input
                      type="text"
                      id="hostname"
                      className="form-control"
                      placeholder="e.g., web-server-01"
                      {...register('hostname', { 
                        required: 'Hostname is required',
                        maxLength: { value: 255, message: 'Hostname must be less than 255 characters' }
                      })}
                    />
                    {errors.hostname && <span className="invalid">{errors.hostname.message}</span>}
                  </div>
                </div>
              </Col>
              
              <Col md="6">
                <div className="form-group">
                  <Label className="form-label" htmlFor="netbiosName">
                    NetBIOS Name
                  </Label>
                  <div className="form-control-wrap">
                    <input
                      type="text"
                      id="netbiosName"
                      className="form-control"
                      placeholder="e.g., WEBSRV01"
                      {...register('netbiosName', {
                        maxLength: { value: 100, message: 'NetBIOS name must be less than 100 characters' }
                      })}
                    />
                    {errors.netbiosName && <span className="invalid">{errors.netbiosName.message}</span>}
                  </div>
                </div>
              </Col>

              <Col md="6">
                <div className="form-group">
                  <Label className="form-label" htmlFor="systemId">
                    System ID
                  </Label>
                  <div className="form-control-wrap">
                    <select
                      id="systemId"
                      className="form-control"
                      disabled={systemsLoading}
                      {...register('systemId')}
                    >
                      <option value="">
                        {systemsLoading ? 'Loading systems...' : 'Select System'}
                      </option>
                      {systems.map((system) => (
                        <option key={system.systemId} value={system.systemId}>
                          {system.systemId} - {system.name || 'Unnamed System'}
                        </option>
                      ))}
                    </select>
                    {errors.systemId && <span className="invalid">{errors.systemId.message}</span>}
                    {systemsLoading && (
                      <small className="text-muted mt-1 d-block">
                        <Spinner size="sm" className="me-1" />
                        Loading available systems...
                      </small>
                    )}
                  </div>
                </div>
              </Col>

              <Col md="6">
                <div className="form-group">
                  <Label className="form-label" htmlFor="source">
                    Source
                  </Label>
                  <div className="form-control-wrap">
                    <select
                      id="source"
                      className="form-control"
                      {...register('source')}
                    >
                      <option value="manual">Manual</option>
                      <option value="tenable">Tenable</option>
                      <option value="import">Import</option>
                      <option value="discovery">Discovery</option>
                    </select>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* System Information Section */}
          <div className="form-section">
            <h6 className="form-section-title">System Information</h6>
            <Row className="g-gs">
              <Col md="6">
                <div className="form-group">
                  <Label className="form-label" htmlFor="operatingSystem">
                    Operating System
                  </Label>
                  <div className="form-control-wrap">
                    <input
                      type="text"
                      id="operatingSystem"
                      className="form-control"
                      placeholder="e.g., Windows Server 2019"
                      {...register('operatingSystem', {
                        maxLength: { value: 255, message: 'Operating system must be less than 255 characters' }
                      })}
                    />
                    {errors.operatingSystem && <span className="invalid">{errors.operatingSystem.message}</span>}
                  </div>
                </div>
              </Col>

              <Col md="6">
                <div className="form-group">
                  <Label className="form-label" htmlFor="systemType">
                    System Type
                  </Label>
                  <div className="form-control-wrap">
                    <select
                      id="systemType"
                      className="form-control"
                      {...register('systemType')}
                    >
                      <option value="">Select Type</option>
                      <option value="server">Server</option>
                      <option value="workstation">Workstation</option>
                      <option value="laptop">Laptop</option>
                      <option value="mobile">Mobile</option>
                      <option value="network">Network Device</option>
                      <option value="printer">Printer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Network Information Section */}
          <div className="form-section">
            <h6 className="form-section-title">Network Information</h6>
            <Row className="g-gs">
              <Col md="6">
                <div className="form-group">
                  <Label className="form-label" htmlFor="ipv4Address">
                    IPv4 Address
                  </Label>
                  <div className="form-control-wrap">
                    <input
                      type="text"
                      id="ipv4Address"
                      className="form-control"
                      placeholder="e.g., 192.168.1.100"
                      {...register('ipv4Address', {
                        pattern: {
                          value: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                          message: 'Please enter a valid IPv4 address'
                        }
                      })}
                    />
                    {errors.ipv4Address && <span className="invalid">{errors.ipv4Address.message}</span>}
                  </div>
                </div>
              </Col>

              <Col md="6">
                <div className="form-group">
                  <Label className="form-label" htmlFor="fqdn">
                    FQDN
                  </Label>
                  <div className="form-control-wrap">
                    <input
                      type="text"
                      id="fqdn"
                      className="form-control"
                      placeholder="e.g., web-server-01.company.com"
                      {...register('fqdn', {
                        maxLength: { value: 255, message: 'FQDN must be less than 255 characters' }
                      })}
                    />
                    {errors.fqdn && <span className="invalid">{errors.fqdn.message}</span>}
                  </div>
                </div>
              </Col>

              <Col md="6">
                <div className="form-group">
                  <Label className="form-label" htmlFor="macAddress">
                    MAC Address
                  </Label>
                  <div className="form-control-wrap">
                    <input
                      type="text"
                      id="macAddress"
                      className="form-control"
                      placeholder="e.g., 00:1B:44:11:3A:B7"
                      {...register('macAddress', {
                        pattern: {
                          value: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
                          message: 'Please enter a valid MAC address (e.g., 00:1B:44:11:3A:B7)'
                        }
                      })}
                    />
                    {errors.macAddress && <span className="invalid">{errors.macAddress.message}</span>}
                  </div>
                </div>
              </Col>

              <Col md="6">
                <div className="form-group">
                  <Label className="form-label" htmlFor="networkType">
                    Network Type
                  </Label>
                  <div className="form-control-wrap">
                    <select
                      id="networkType"
                      className="form-control"
                      {...register('networkType')}
                    >
                      <option value="">Select Type</option>
                      <option value="ethernet">Ethernet</option>
                      <option value="wifi">WiFi</option>
                      <option value="cellular">Cellular</option>
                      <option value="vpn">VPN</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Security & Risk Section */}
          <div className="form-section">
            <h6 className="form-section-title">Security & Risk</h6>
            <Row className="g-gs">
              <Col md="6">
                <div className="form-group">
                  <Label className="form-label" htmlFor="criticalityRating">
                    Criticality Rating
                  </Label>
                  <div className="form-control-wrap">
                    <select
                      id="criticalityRating"
                      className="form-control"
                      {...register('criticalityRating')}
                    >
                      <option value="">Select Criticality</option>
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              </Col>

              <Col md="6">
                <div className="form-group">
                  <Label className="form-label" htmlFor="exposureScore">
                    Exposure Score (0-1000)
                  </Label>
                  <div className="form-control-wrap">
                    <input
                      type="number"
                      id="exposureScore"
                      className="form-control"
                      placeholder="e.g., 250"
                      min="0"
                      max="1000"
                      {...register('exposureScore', {
                        min: { value: 0, message: 'Exposure score must be at least 0' },
                        max: { value: 1000, message: 'Exposure score must be at most 1000' }
                      })}
                    />
                    {errors.exposureScore && <span className="invalid">{errors.exposureScore.message}</span>}
                  </div>
                </div>
              </Col>

              <Col md="6">
                <div className="form-group">
                  <Label className="form-label" htmlFor="acrScore">
                    ACR Score (0-10)
                  </Label>
                  <div className="form-control-wrap">
                    <input
                      type="number"
                      id="acrScore"
                      className="form-control"
                      placeholder="e.g., 7.5"
                      min="0"
                      max="10"
                      step="0.1"
                      {...register('acrScore', {
                        min: { value: 0, message: 'ACR score must be at least 0' },
                        max: { value: 10, message: 'ACR score must be at most 10' }
                      })}
                    />
                    {errors.acrScore && <span className="invalid">{errors.acrScore.message}</span>}
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Agent & Plugin Status Section */}
          <div className="form-section">
            <h6 className="form-section-title">Agent & Plugin Status</h6>
            <Row className="g-gs">
              <Col md="6">
                <div className="form-group">
                  <div className="custom-control custom-checkbox">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="hasAgent"
                      {...register('hasAgent')}
                    />
                    <label className="custom-control-label" htmlFor="hasAgent">
                      Has Agent Installed
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
                      id="hasPluginResults"
                      {...register('hasPluginResults')}
                    />
                    <label className="custom-control-label" htmlFor="hasPluginResults">
                      Has Plugin Results
                    </label>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

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
                      Creating Asset...
                    </>
                  ) : (
                    <>
                      <Icon name="plus" className="me-2"></Icon>
                      Create Asset
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Form>
      </div>
    </SlideOutPanel>
  );
};

export default AddAssetPanel;
