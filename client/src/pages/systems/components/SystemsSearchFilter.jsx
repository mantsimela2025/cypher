import React, { useState } from "react";
import { Row, Col, Card, CardBody, Input, Button } from "reactstrap";
import { Icon, RSelect } from "@/components/Component";

const SystemsSearchFilter = ({
  filters,
  onFilterUpdate
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "maintenance", label: "Maintenance" },
    { value: "error", label: "Error" }
  ];

  const systemTypeOptions = [
    { value: "", label: "All Types" },
    { value: "web", label: "Web Server" },
    { value: "database", label: "Database" },
    { value: "application", label: "Application" },
    { value: "network", label: "Network Device" },
    { value: "security", label: "Security Device" }
  ];

  const riskLevelOptions = [
    { value: "", label: "All Risk Levels" },
    { value: "low", label: "Low Risk" },
    { value: "medium", label: "Medium Risk" },
    { value: "high", label: "High Risk" },
    { value: "critical", label: "Critical Risk" }
  ];

  const sourceOptions = [
    { value: "", label: "All Sources" },
    { value: "xacta", label: "Xacta" },
    { value: "tenable", label: "Tenable" },
    { value: "manual", label: "Manual Entry" }
  ];

  const handleFilterChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onFilterUpdate(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      status: "",
      systemType: "",
      riskLevel: "",
      source: ""
    };
    setLocalFilters(clearedFilters);
    onFilterUpdate(clearedFilters);
  };

  const saveCurrentFilter = () => {
    // TODO: Implement save filter functionality
    console.log("Save filter:", localFilters);
  };

  return (
    <div className="nk-block">
      <Card className="card-bordered">
        <CardBody>
          <div className="nk-block-head nk-block-head-sm">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h6 className="nk-block-title">Filter Systems</h6>
                <p className="text-soft">Use the search box in the table below to search by system name. Apply filters here to narrow down results.</p>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <Row className="g-3 align-center">
            <Col lg="3" md="6">
              <div className="form-group">
                <label className="form-label">Status</label>
                <RSelect
                  options={statusOptions}
                  value={statusOptions.find(option => option.value === localFilters.status)}
                  onChange={(selected) => handleFilterChange('status', selected.value)}
                  placeholder="All Status"
                />
              </div>
            </Col>
            <Col lg="3" md="6">
              <div className="form-group">
                <label className="form-label">System Type</label>
                <RSelect
                  options={systemTypeOptions}
                  value={systemTypeOptions.find(option => option.value === localFilters.systemType)}
                  onChange={(selected) => handleFilterChange('systemType', selected.value)}
                  placeholder="All Types"
                />
              </div>
            </Col>
            <Col lg="3" md="6">
              <div className="form-group">
                <label className="form-label">Risk Level</label>
                <RSelect
                  options={riskLevelOptions}
                  value={riskLevelOptions.find(option => option.value === localFilters.riskLevel)}
                  onChange={(selected) => handleFilterChange('riskLevel', selected.value)}
                  placeholder="All Risk Levels"
                />
              </div>
            </Col>
            <Col lg="3" md="6">
              <div className="form-group">
                <label className="form-label">Source</label>
                <RSelect
                  options={sourceOptions}
                  value={sourceOptions.find(option => option.value === localFilters.source)}
                  onChange={(selected) => handleFilterChange('source', selected.value)}
                  placeholder="All Sources"
                />
              </div>
            </Col>
          </Row>

          {/* Filter Actions */}
          <Row className="g-3 align-center">
            <Col lg="6">
              <div className="form-group">
                <Button 
                  color="light" 
                  size="sm"
                  onClick={clearAllFilters}
                >
                  <Icon name="cross" className="me-1" />
                  Clear All Filters
                </Button>
              </div>
            </Col>
            <Col lg="6" className="text-end">
              <div className="form-group">
                <Button 
                  color="outline-primary" 
                  size="sm"
                  onClick={saveCurrentFilter}
                >
                  <Icon name="save" className="me-1" />
                  Save Current Filter
                </Button>
              </div>
            </Col>
          </Row>

          {/* Active Filters Display */}
          {Object.values(localFilters).some(filter => filter) && (
            <div className="mt-3 pt-3 border-top">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span className="text-soft">Active filters:</span>
                {localFilters.status && (
                  <span className="badge badge-dim bg-info">
                    Status: {statusOptions.find(opt => opt.value === localFilters.status)?.label}
                    <button
                      className="btn-close ms-1"
                      onClick={() => handleFilterChange('status', '')}
                      style={{ fontSize: '0.7rem' }}
                    ></button>
                  </span>
                )}
                {localFilters.systemType && (
                  <span className="badge badge-dim bg-warning">
                    Type: {systemTypeOptions.find(opt => opt.value === localFilters.systemType)?.label}
                    <button
                      className="btn-close ms-1"
                      onClick={() => handleFilterChange('systemType', '')}
                      style={{ fontSize: '0.7rem' }}
                    ></button>
                  </span>
                )}
                {localFilters.riskLevel && (
                  <span className="badge badge-dim bg-danger">
                    Risk: {riskLevelOptions.find(opt => opt.value === localFilters.riskLevel)?.label}
                    <button
                      className="btn-close ms-1"
                      onClick={() => handleFilterChange('riskLevel', '')}
                      style={{ fontSize: '0.7rem' }}
                    ></button>
                  </span>
                )}
                {localFilters.source && (
                  <span className="badge badge-dim bg-success">
                    Source: {sourceOptions.find(opt => opt.value === localFilters.source)?.label}
                    <button
                      className="btn-close ms-1"
                      onClick={() => handleFilterChange('source', '')}
                      style={{ fontSize: '0.7rem' }}
                    ></button>
                  </span>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default SystemsSearchFilter;
