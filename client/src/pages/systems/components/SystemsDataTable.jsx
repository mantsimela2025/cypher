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

const SystemsDataTable = ({
  data,
  columns,
  loading,
  onSelectedRowsChange,
  clearSelectedRows,
  onViewDetails,
  className = "nk-tb-list"
}) => {
  const [tableData, setTableData] = useState(data);
  const [onSearch, setOnSearch] = useState(true);
  const [onSearchText, setOnSearchText] = useState("");
  const [tablesm, updateTableSm] = useState(false);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [sort, setSortState] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);

  // Filter state
  const [filterValues, setFilterValues] = useState({
    status: null,
    type: null,
    riskLevel: null
  });

  // Filter options for systems
  const filterStatus = [
    { value: "", label: "Any Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "maintenance", label: "Maintenance" },
  ];

  const filterType = [
    { value: "", label: "Any Type" },
    { value: "server", label: "Server" },
    { value: "workstation", label: "Workstation" },
    { value: "network", label: "Network Device" },
    { value: "database", label: "Database" },
    { value: "web", label: "Web Server" },
    { value: "application", label: "Application" },
    { value: "storage", label: "Storage" },
  ];

  const filterRiskLevel = [
    { value: "", label: "Any Risk Level" },
    { value: "low", label: "Low Risk" },
    { value: "medium", label: "Medium Risk" },
    { value: "high", label: "High Risk" },
    { value: "critical", label: "Critical Risk" },
  ];

  // Update table data when props change
  useEffect(() => {
    setTableData(data);
  }, [data]);

  // Search functionality
  useEffect(() => {
    if (onSearchText !== "") {
      const filteredObject = data.filter((item) => {
        return (
          item.name.toLowerCase().includes(onSearchText.toLowerCase()) ||
          item.systemId.toLowerCase().includes(onSearchText.toLowerCase()) ||
          (item.systemOwner && item.systemOwner.toLowerCase().includes(onSearchText.toLowerCase()))
        );
      });
      setTableData([...filteredObject]);
    } else {
      setTableData([...data]);
    }
  }, [onSearchText, data]);

  // Sorting functionality
  const sortFunc = (params) => {
    let defaultData = tableData;
    if (params === "asc") {
      let sortedData = defaultData.sort((a, b) => a.name.localeCompare(b.name));
      setTableData([...sortedData]);
    } else if (params === "dsc") {
      let sortedData = defaultData.sort((a, b) => b.name.localeCompare(a.name));
      setTableData([...sortedData]);
    }
  };

  // Toggle search
  const toggle = () => setOnSearch(!onSearch);

  // Handle search input change
  const onFilterChange = (e) => {
    setOnSearchText(e.target.value);
  };

  // Handle row selection
  const onSelectChange = (e, id) => {
    let newSelectedRows;
    if (e.target.checked) {
      newSelectedRows = [...selectedRows, id];
    } else {
      newSelectedRows = selectedRows.filter(item => item !== id);
    }
    setSelectedRows(newSelectedRows);
    
    // Call parent callback if provided
    if (onSelectedRowsChange) {
      const selectedRowsData = tableData.filter(row => newSelectedRows.includes(row.id));
      onSelectedRowsChange({ selectedRows: selectedRowsData });
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemPerPage;
  const indexOfFirstItem = indexOfLastItem - itemPerPage;
  const currentItems = tableData.slice(indexOfFirstItem, indexOfLastItem);
  const totalItems = tableData.length;

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Filter handling functions
  const handleFilterChange = (filterType, selectedOption) => {
    setFilterValues(prev => ({
      ...prev,
      [filterType]: selectedOption
    }));
  };

  const applyFilters = () => {
    let filteredData = data;

    // Apply status filter
    if (filterValues.status && filterValues.status.value) {
      filteredData = filteredData.filter(item =>
        item.status && item.status.toLowerCase() === filterValues.status.value.toLowerCase()
      );
    }

    // Apply type filter
    if (filterValues.type && filterValues.type.value) {
      filteredData = filteredData.filter(item =>
        item.systemType && item.systemType.toLowerCase() === filterValues.type.value.toLowerCase()
      );
    }

    // Apply risk level filter
    if (filterValues.riskLevel && filterValues.riskLevel.value) {
      filteredData = filteredData.filter(item =>
        item.riskLevel && item.riskLevel.toLowerCase() === filterValues.riskLevel.value.toLowerCase()
      );
    }

    setTableData(filteredData);
    setCurrentPage(1); // Reset to first page
  };

  const clearAllFilters = () => {
    setFilterValues({
      status: null,
      type: null,
      riskLevel: null
    });
    setTableData(data); // Reset to original data
    setCurrentPage(1);
  };

  return (
    <div className="card card-bordered card-preview">
      <div className="card-inner-group">
        <div className="card-inner position-relative card-tools-toggle">
          <div className="card-title-group">
            <div className="card-tools">
              <div className="form-inline flex-nowrap gx-3">
                <div className="form-wrap w-150px">
                  <RSelect
                    options={[
                      { value: "", label: "Bulk Action" },
                      { value: "delete", label: "Delete Selected" },
                      { value: "export", label: "Export Selected" },
                    ]}
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
                <li>
                  <Button
                    onClick={(ev) => {
                      ev.preventDefault();
                      toggle();
                    }}
                    className="btn-icon search-toggle toggle-search"
                  >
                    <Icon name="search"></Icon>
                  </Button>
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
                            <DropdownMenu
                              end
                              className="filter-wg dropdown-menu-xl"
                              style={{
                                overflow: "visible",
                                minWidth: "700px",
                                width: "auto",
                                maxWidth: "800px"
                              }}
                            >
                              <div className="dropdown-head">
                                <span className="sub-title dropdown-title">Advanced Filter</span>
                              </div>
                              <div className="dropdown-body dropdown-body-rg" style={{ padding: "1.5rem" }}>
                                <Row className="gx-5 gy-4">
                                  <Col lg="4" md="6" sm="12">
                                    <div className="form-group">
                                      <label className="overline-title overline-title-alt" style={{ marginBottom: "0.5rem", display: "block" }}>
                                        Status
                                      </label>
                                      <RSelect
                                        options={filterStatus}
                                        placeholder="Any Status"
                                        styles={{
                                          control: (base) => ({
                                            ...base,
                                            minWidth: "180px",
                                            width: "100%"
                                          }),
                                          menu: (base) => ({
                                            ...base,
                                            minWidth: "180px",
                                            zIndex: 9999
                                          })
                                        }}
                                      />
                                    </div>
                                  </Col>
                                  <Col lg="4" md="6" sm="12">
                                    <div className="form-group">
                                      <label className="overline-title overline-title-alt" style={{ marginBottom: "0.5rem", display: "block" }}>
                                        System Type
                                      </label>
                                      <RSelect
                                        options={filterType}
                                        placeholder="Any Type"
                                        styles={{
                                          control: (base) => ({
                                            ...base,
                                            minWidth: "180px",
                                            width: "100%"
                                          }),
                                          menu: (base) => ({
                                            ...base,
                                            minWidth: "180px",
                                            zIndex: 9999
                                          })
                                        }}
                                      />
                                    </div>
                                  </Col>
                                  <Col lg="4" md="12" sm="12">
                                    <div className="form-group">
                                      <label className="overline-title overline-title-alt" style={{ marginBottom: "0.5rem", display: "block" }}>
                                        Risk Level
                                      </label>
                                      <RSelect
                                        options={filterRiskLevel}
                                        placeholder="Any Risk Level"
                                        styles={{
                                          control: (base) => ({
                                            ...base,
                                            minWidth: "180px",
                                            width: "100%"
                                          }),
                                          menu: (base) => ({
                                            ...base,
                                            minWidth: "180px",
                                            zIndex: 9999
                                          })
                                        }}
                                      />
                                    </div>
                                  </Col>

                                </Row>
                              </div>
                              <div className="dropdown-foot between">
                                <a
                                  className="clickable"
                                  href="#reset"
                                  onClick={(ev) => {
                                    ev.preventDefault();
                                  }}
                                >
                                  Reset Filter
                                </a>
                                <a
                                  href="#save"
                                  onClick={(ev) => {
                                    ev.preventDefault();
                                  }}
                                >
                                  Save Filter
                                </a>
                              </div>
                            </DropdownMenu>
                          </UncontrolledDropdown>
                        </li>
                        <li>
                          <UncontrolledDropdown>
                            <DropdownToggle tag="a" className="btn btn-trigger btn-icon dropdown-toggle">
                              <Icon name="setting"></Icon>
                            </DropdownToggle>
                            <DropdownMenu end className="dropdown-menu-xs">
                              <ul className="link-check">
                                <li>
                                  <span>Show</span>
                                </li>
                                <li className={itemPerPage === 10 ? "active" : ""}>
                                  <DropdownItem
                                    tag="a"
                                    href="#dropdownitem"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                      setItemPerPage(10);
                                    }}
                                  >
                                    10
                                  </DropdownItem>
                                </li>
                                <li className={itemPerPage === 15 ? "active" : ""}>
                                  <DropdownItem
                                    tag="a"
                                    href="#dropdownitem"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                      setItemPerPage(15);
                                    }}
                                  >
                                    15
                                  </DropdownItem>
                                </li>
                                <li className={itemPerPage === 25 ? "active" : ""}>
                                  <DropdownItem
                                    tag="a"
                                    href="#dropdownitem"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                      setItemPerPage(25);
                                    }}
                                  >
                                    25
                                  </DropdownItem>
                                </li>
                                <li className={itemPerPage === 50 ? "active" : ""}>
                                  <DropdownItem
                                    tag="a"
                                    href="#dropdownitem"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                      setItemPerPage(50);
                                    }}
                                  >
                                    50
                                  </DropdownItem>
                                </li>
                              </ul>
                              <ul className="link-check">
                                <li>
                                  <span>Order</span>
                                </li>
                                <li className={sort === "dsc" ? "active" : ""}>
                                  <DropdownItem
                                    tag="a"
                                    href="#dropdownitem"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                      setSortState("dsc");
                                      sortFunc("dsc");
                                    }}
                                  >
                                    DESC
                                  </DropdownItem>
                                </li>
                                <li className={sort === "asc" ? "active" : ""}>
                                  <DropdownItem
                                    tag="a"
                                    href="#dropdownitem"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                      setSortState("asc");
                                      sortFunc("asc");
                                    }}
                                  >
                                    ASC
                                  </DropdownItem>
                                </li>
                              </ul>
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
          <div className={`card-search search-wrap ${!onSearch && "active"}`}>
            <div className="card-body">
              <div className="search-content">
                <Button
                  onClick={() => {
                    setOnSearchText("");
                    toggle();
                  }}
                  className="search-back btn-icon toggle-search"
                >
                  <Icon name="arrow-left"></Icon>
                </Button>
                <input
                  type="text"
                  className="border-transparent form-focus-none form-control"
                  placeholder="Search by system name, ID, or owner"
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
      </div>

      {/* DataTable */}
      <DataTable className={className}>
        <DataTableBody>
          <DataTableHead>
            <DataTableRow className="nk-tb-col-check">
              <div className="custom-control custom-control-sm custom-checkbox notext">
                <input
                  type="checkbox"
                  className="custom-control-input"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(currentItems.map(item => item.id));
                    } else {
                      setSelectedRows([]);
                    }
                  }}
                  id="uid"
                />
                <label className="custom-control-label" htmlFor="uid"></label>
              </div>
            </DataTableRow>
            {columns.map((column, index) => (
              <DataTableRow key={index} size={column.grow ? "lg" : "md"}>
                <span className="sub-text">{column.name}</span>
              </DataTableRow>
            ))}
            <DataTableRow className="nk-tb-col-tools text-end">
              <span className="sub-text">Action</span>
            </DataTableRow>
          </DataTableHead>

          {loading ? (
            <div className="p-4 text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : currentItems.length > 0 ? (
            currentItems.map((item) => (
              <DataTableItem key={item.id}>
                <DataTableRow className="nk-tb-col-check">
                  <div className="custom-control custom-control-sm custom-checkbox notext">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      checked={selectedRows.includes(item.id)}
                      onChange={(e) => onSelectChange(e, item.id)}
                      id={item.id + "uid1"}
                    />
                    <label className="custom-control-label" htmlFor={item.id + "uid1"}></label>
                  </div>
                </DataTableRow>
                {columns.map((column, colIndex) => (
                  <DataTableRow key={colIndex}>
                    {column.cell ? column.cell(item) : column.selector(item)}
                  </DataTableRow>
                ))}
                <DataTableRow className="nk-tb-col-tools">
                  <ul className="nk-tb-actions gx-1">
                    <li>
                      <UncontrolledDropdown>
                        <DropdownToggle tag="a" className="dropdown-toggle btn btn-icon btn-trigger">
                          <Icon name="more-h"></Icon>
                        </DropdownToggle>
                        <DropdownMenu end>
                          <ul className="link-list-opt no-bdr">
                            <li>
                              <DropdownItem
                                tag="a"
                                href="#view"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  if (onViewDetails) {
                                    onViewDetails(item);
                                  }
                                }}
                              >
                                <Icon name="eye"></Icon>
                                <span>View Details</span>
                              </DropdownItem>
                            </li>
                            <li>
                              <DropdownItem
                                tag="a"
                                href="#edit"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                }}
                              >
                                <Icon name="edit"></Icon>
                                <span>Edit</span>
                              </DropdownItem>
                            </li>
                            <li>
                              <DropdownItem
                                tag="a"
                                href="#remove"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                }}
                              >
                                <Icon name="trash"></Icon>
                                <span>Remove</span>
                              </DropdownItem>
                            </li>
                          </ul>
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    </li>
                  </ul>
                </DataTableRow>
              </DataTableItem>
            ))
          ) : (
            <div className="p-4 text-center">
              <span className="text-soft">No systems found</span>
            </div>
          )}
        </DataTableBody>

        {/* Pagination */}
        <div className="card-inner">
          <div className="nk-block-between-md g-3">
            <div className="g">
              <PaginationComponent
                itemPerPage={itemPerPage}
                totalItems={totalItems}
                paginate={paginate}
                currentPage={currentPage}
              />
            </div>
            <div className="g">
              <div className="pagination-goto d-flex justify-content-center justify-content-md-start gx-3">
                <div>Page</div>
                <div>
                  <select
                    className="form-select form-select-sm js-select2"
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                  >
                    {Array.from({ length: Math.ceil(totalItems / itemPerPage) }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div>OF {Math.ceil(totalItems / itemPerPage)}</div>
              </div>
            </div>
          </div>
        </div>
      </DataTable>
    </div>
  );
};

export default SystemsDataTable;
