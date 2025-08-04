import React, { useState } from "react";
import { Row, Col, Input, Button } from "reactstrap";
import { Icon, RSelect } from "@/components/Component";

const AssetSearchFilter = ({ filters, onFilterChange, onRefresh }) => {
  const [searchText, setSearchText] = useState(filters.search || "");

  // Filter options matching the screenshot
  const assetTypeOptions = [
    { value: "", label: "All Asset Types" },
    { value: "host", label: "Hosts" },
    { value: "cloud", label: "Cloud Resources" },
    { value: "web_application", label: "Web Applications" },
    { value: "domain", label: "Domain Inventory" }
  ];

  const criticalityOptions = [
    { value: "", label: "All Criticality Levels" },
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" }
  ];

  const agentOptions = [
    { value: "", label: "All Assets" },
    { value: "true", label: "With Agent" },
    { value: "false", label: "Without Agent" }
  ];

  const sourceOptions = [
    { value: "", label: "All Sources" },
    { value: "tenable", label: "Tenable" },
    { value: "manual", label: "Manual Entry" },
    { value: "discovery", label: "Network Discovery" }
  ];

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange({ ...filters, search: searchText });
  };

  const handleFilterChange = (filterName, value) => {
    onFilterChange({ ...filters, [filterName]: value?.value || "" });
  };





  return (
    <div className="card card-bordered">
      <div className="card-inner">
        <Row className="g-3 align-items-center">
          {/* Search */}
          <Col md="3">
            <form onSubmit={handleSearchSubmit}>
              <div className="form-group">
                <div className="form-control-wrap">
                  <div className="form-icon form-icon-left">
                    <Icon name="search"></Icon>
                  </div>
                  <Input
                    type="text"
                    className="form-control"
                    placeholder="Search assets by hostname, UUID..."
                    value={searchText}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
            </form>
          </Col>

          {/* Asset Type Filter */}
          <Col md="2">
            <div className="form-group">
              <RSelect
                options={assetTypeOptions}
                placeholder="All Asset Types"
                value={assetTypeOptions.find(opt => opt.value === filters.assetType)}
                onChange={(value) => handleFilterChange('assetType', value)}
              />
            </div>
          </Col>

          {/* Criticality Filter */}
          <Col md="2">
            <div className="form-group">
              <RSelect
                options={criticalityOptions}
                placeholder="All Criticality Levels"
                value={criticalityOptions.find(opt => opt.value === filters.criticality)}
                onChange={(value) => handleFilterChange('criticality', value)}
              />
            </div>
          </Col>

          {/* Agent Filter */}
          <Col md="2">
            <div className="form-group">
              <RSelect
                options={agentOptions}
                placeholder="All Assets"
                value={agentOptions.find(opt => opt.value === filters.hasAgent)}
                onChange={(value) => handleFilterChange('hasAgent', value)}
              />
            </div>
          </Col>

          {/* Source Filter */}
          <Col md="2">
            <div className="form-group">
              <RSelect
                options={sourceOptions}
                placeholder="All Sources"
                value={sourceOptions.find(opt => opt.value === filters.source)}
                onChange={(value) => handleFilterChange('source', value)}
              />
            </div>
          </Col>

          {/* Action Buttons */}
          <Col md="1">
            <div className="form-group">
              <Button
                color="primary"
                size="md"
                onClick={onRefresh}
                className="btn-icon"
                style={{ backgroundColor: '#526dff', borderColor: '#526dff' }}
              >
                <Icon name="reload"></Icon>
              </Button>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default AssetSearchFilter;
