import React, { useState, useEffect } from "react";
import {
  UncontrolledDropdown,
  DropdownMenu,
  DropdownToggle,
  DropdownItem,
  Row,
  Col,
} from "reactstrap";
import {
  Button,
  Icon,
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableItem,
  PaginationComponent,
  RSelect,
} from "@/components/Component";
import { handleExport as exportData } from "@/utils/exportUtils";
import "./AssetDataTable.css";

const AssetDataTable = ({ 
  data, 
  columns, 
  loading, 
  onSelectedRowsChange,
  clearSelectedRows,
  className = "nk-tb-list"
}) => {
  const [tableData, setTableData] = useState(data);
  const [onSearch, setOnSearch] = useState(true);
  const [onSearchText, setOnSearchText] = useState("");
  const [tablesm, updateTableSm] = useState(false);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [sort, setSortState] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);

  // Filter state
  const [filterValues, setFilterValues] = useState({
    criticality: null,
    hasAgent: null,
    source: null
  });

  // Filter options for assets
  const filterCriticality = [
    { value: "", label: "Any Criticality" },
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const filterAgent = [
    { value: "", label: "Any Agent Status" },
    { value: "true", label: "With Agent" },
    { value: "false", label: "Without Agent" },
  ];

  const filterSource = [
    { value: "", label: "Any Source" },
    { value: "tenable", label: "Tenable" },
    { value: "manual", label: "Manual" },
    { value: "discovery", label: "Discovery" },
  ];

  // Update table data when props change
  useEffect(() => {
    setTableData(data);
  }, [data]);

  // Handle search
  const onFilterChange = (e) => {
    setOnSearchText(e.target.value);
  };

  // Handle row selection
  const handleRowSelect = (row, isSelected) => {
    let newSelectedRows;
    if (isSelected) {
      newSelectedRows = [...selectedRows, row];
    } else {
      newSelectedRows = selectedRows.filter(r => r.assetUuid !== row.assetUuid);
    }
    setSelectedRows(newSelectedRows);
    onSelectedRowsChange(newSelectedRows);
  };

  // Handle select all
  const handleSelectAll = (isSelected) => {
    const newSelectedRows = isSelected ? [...tableData] : [];
    setSelectedRows(newSelectedRows);
    onSelectedRowsChange(newSelectedRows);
  };

  // Toggle search
  const toggle = () => setOnSearch(!onSearch);

  // Handle sorting
  const handleSort = (field) => {
    if (typeof field === 'function') {
      // Extract field name from selector function
      const fieldName = field.toString().match(/row\.(\w+)/)?.[1] || '';

      if (sortField === fieldName) {
        // Toggle direction if same field
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        // New field, start with ascending
        setSortField(fieldName);
        setSortDirection('asc');
      }
    }
  };

  // Handle export functionality using the global export utility
  const handleExport = (format) => {
    console.log(`Exporting data in ${format} format`);
    
    // Prepare data for export with custom formatting
    const formattedData = tableData.map(row => ({
      Name: row.hostname || row.netbiosName || 'Unknown',
      'AES Score': row.exposureScore || 0,
      'ACR Score': row.acrScore || 'N/A',
      'IPv4 Address': row.ipv4Address || 'N/A',
      'Operating System': row.operatingSystem || 'Unknown',
      'Last Seen': row.lastSeen ? new Date(row.lastSeen).toLocaleDateString() : 'Never',
      Source: row.source || 'Unknown',
      Tags: row.tags ? row.tags.map(tag => `${tag.key}:${tag.value}`).join(', ') : 'None'
    }));

    // Use the global export utility
    exportData(format, formattedData, 'assets', null, 'Asset Inventory Export');
  };

  // Apply sorting to data
  const sortedData = React.useMemo(() => {
    if (!sortField) return tableData;

    return [...tableData].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (typeof aValue === 'number') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [tableData, sortField, sortDirection]);

  // Get current page data
  const indexOfLastItem = currentPage * itemPerPage;
  const indexOfFirstItem = indexOfLastItem - itemPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <DataTable className="card-stretch">
        <div className="card-inner text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading assets...</p>
        </div>
      </DataTable>
    );
  }

  return (
    <DataTable className="card-stretch">
      <div className="card-inner position-relative card-tools-toggle">
        <div className="card-title-group">
          <div className="card-tools">
            <div className="form-inline flex-nowrap gx-3">
              <div className="form-wrap">
                <RSelect
                  options={[
                    { value: "export", label: "Export Selected" },
                    { value: "delete", label: "Delete Selected" },
                  ]}
                  className="w-130px"
                  placeholder="Bulk Action"
                />
              </div>
              <div className="btn-wrap">
                <span className="d-none d-md-block">
                  <Button
                    disabled={selectedRows.length === 0}
                    color="light"
                    outline
                    className="btn-dim"
                  >
                    Apply
                  </Button>
                </span>
              </div>
            </div>
          </div>
          <div className="card-tools me-n1">
            <ul className="btn-toolbar gx-1">
              {/* Export Section */}
              <li className="export-section">
                <span className="export-label">
                  Export
                </span>
                <Button
                  color="light"
                  size="sm"
                  className="btn-icon export-excel"
                  onClick={() => handleExport('excel')}
                  title="Export to Excel"
                >
                  <Icon name="file-xls" className="export-excel"></Icon>
                </Button>
                <Button
                  color="light"
                  size="sm"
                  className="btn-icon export-pdf"
                  onClick={() => handleExport('pdf')}
                  title="Export to PDF"
                >
                  <Icon name="file-pdf" className="export-pdf"></Icon>
                </Button>
                <Button
                  color="light"
                  size="sm"
                  className="btn-icon export-csv"
                  onClick={() => handleExport('csv')}
                  title="Export to CSV"
                >
                  <Icon name="file-text" className="export-csv"></Icon>
                </Button>
              </li>
              <li className="btn-toolbar-sep"></li>

              {/* Show entries dropdown */}
              <li className="show-entries">
                <span className="show-label">
                  Show
                </span>
                <RSelect
                  options={[
                    { value: 10, label: "10" },
                    { value: 25, label: "25" },
                    { value: 50, label: "50" },
                    { value: 100, label: "100" },
                  ]}
                  value={{ value: itemPerPage, label: itemPerPage.toString() }}
                  onChange={(selected) => setItemPerPage(selected.value)}
                  className="w-80px"
                />
              </li>
              <li className="btn-toolbar-sep"></li>

              <li>
                <a
                  href="#search"
                  onClick={(ev) => {
                    ev.preventDefault();
                    toggle();
                  }}
                  className="btn btn-icon search-toggle toggle-search"
                >
                  <Icon name="search"></Icon>
                </a>
              </li>
              <li className="btn-toolbar-sep"></li>
              <li>
                <div className="toggle-wrap">
                  <Button
                    className={`btn-icon btn-trigger toggle ${tablesm ? "active" : ""}`}
                    onClick={() => updateTableSm(true)}
                  >
                    <Icon name="menu-right"></Icon>
                  </Button>
                  <div className={`toggle-content ${tablesm ? "content-active" : ""}`}>
                    <ul className="btn-toolbar gx-1">
                      <li className="toggle-close">
                        <Button className="btn-icon btn-trigger toggle" onClick={() => updateTableSm(false)}>
                          <Icon name="arrow-left"></Icon>
                        </Button>
                      </li>
                      <li>
                        <UncontrolledDropdown>
                          <DropdownToggle tag="a" className="btn btn-trigger btn-icon dropdown-toggle">
                            <div className="dot dot-primary"></div>
                            <Icon name="filter-alt"></Icon>
                          </DropdownToggle>
                          <DropdownMenu end className="filter-wg dropdown-menu-xl" style={{ overflow: "visible" }}>
                            <div className="dropdown-head">
                              <span className="sub-title dropdown-title">Filter Assets</span>
                            </div>
                            <div className="dropdown-body dropdown-body-rg">
                              <Row className="gx-6 gy-3">
                                <Col size="6">
                                  <div className="form-group">
                                    <label className="overline-title overline-title-alt">Criticality</label>
                                    <RSelect
                                      options={filterCriticality}
                                      value={filterValues.criticality}
                                      onChange={(e) => setFilterValues({...filterValues, criticality: e})}
                                    />
                                  </div>
                                </Col>
                                <Col size="6">
                                  <div className="form-group">
                                    <label className="overline-title overline-title-alt">Agent Status</label>
                                    <RSelect
                                      options={filterAgent}
                                      value={filterValues.hasAgent}
                                      onChange={(e) => setFilterValues({...filterValues, hasAgent: e})}
                                    />
                                  </div>
                                </Col>
                              </Row>
                            </div>
                          </DropdownMenu>
                        </UncontrolledDropdown>
                      </li>
                    </ul>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div className={`card-search search-wrap ${!onSearch ? "active" : ""}`}>
          <div className="card-body">
            <div className="search-content">
              <Button
                className="search-back btn-icon"
                onClick={() => {
                  setOnSearch(true);
                  setOnSearchText("");
                }}
              >
                <Icon name="arrow-left"></Icon>
              </Button>
              <input
                type="text"
                className="border-transparent form-focus-none form-control"
                placeholder="Search by hostname, UUID, or IP address"
                value={onSearchText}
                onChange={(e) => onFilterChange(e)}
              />
              <Button className="search-submit btn-icon">
                <Icon name="search"></Icon>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <DataTableBody compact>
        <DataTableHead>
          <DataTableRow className="nk-tb-col-check">
            <div className="custom-control custom-control-sm custom-checkbox notext">
              <input
                type="checkbox"
                className="custom-control-input"
                onChange={(e) => handleSelectAll(e.target.checked)}
                id="uid_all"
              />
              <label className="custom-control-label" htmlFor="uid_all"></label>
            </div>
          </DataTableRow>
          {columns.map((column, index) => (
            <DataTableRow key={index}>
              {column.sortable ? (
                <div
                  className="d-flex align-items-center cursor-pointer"
                  onClick={() => handleSort(column.selector)}
                  style={{ cursor: 'pointer' }}
                >
                  {column.name}
                </div>
              ) : (
                <span className="sub-text">{column.name}</span>
              )}
            </DataTableRow>
          ))}
        </DataTableHead>
        {currentItems.length > 0
          ? currentItems.map((item) => (
              <DataTableItem key={item.assetUuid}>
                <DataTableRow className="nk-tb-col-check">
                  <div className="custom-control custom-control-sm custom-checkbox notext">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      checked={selectedRows.some(row => row.assetUuid === item.assetUuid)}
                      onChange={(e) => handleRowSelect(item, e.target.checked)}
                      id={`uid_${item.assetUuid}`}
                    />
                    <label className="custom-control-label" htmlFor={`uid_${item.assetUuid}`}></label>
                  </div>
                </DataTableRow>
                {columns.map((column, index) => (
                  <DataTableRow key={index}>
                    {column.cell ? column.cell(item) : item[column.selector(item)]}
                  </DataTableRow>
                ))}
              </DataTableItem>
            ))
          : null}
      </DataTableBody>
      <div className="card-inner">
        {currentItems.length > 0 ? (
          <PaginationComponent
            itemPerPage={itemPerPage}
            totalItems={sortedData.length}
            paginate={paginate}
            currentPage={currentPage}
          />
        ) : (
          <div className="text-center">
            <span className="text-silent">No assets found</span>
          </div>
        )}
      </div>
    </DataTable>
  );
};

export default AssetDataTable;
