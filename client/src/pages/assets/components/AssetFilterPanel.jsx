import React, { useState } from "react";
import { Row, Col, Input, Button } from "reactstrap";
import { Icon } from "@/components/Component";

const AssetFilterPanel = ({ filters, onFilterChange, onRefresh }) => {
  const [searchText, setSearchText] = useState(filters.search || "");



  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange({ ...filters, search: searchText });
  };



  return (
    <div className="card card-bordered">
      <div className="card-inner">
        {/* Search and Filter Toggle Row */}
        <Row className="g-3 align-items-center">
          {/* Search */}
          <Col md="6">
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

          {/* Filter Toggle and Actions */}
          <Col md="6" className="text-end">
            <div className="d-flex justify-content-end align-items-center gap-2">
              {/* Filter Assets Button (Non-functional, just for display) */}
              <Button
                color="light"
                size="sm"
                className="btn-outline-light"
                disabled
              >
                <Icon name="filter" className="me-1"></Icon>
                Filter Assets
                <Icon name="chevron-down" className="ms-1"></Icon>
              </Button>

              {/* Refresh Button */}
              <Button
                color="primary"
                size="sm"
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

export default AssetFilterPanel;
