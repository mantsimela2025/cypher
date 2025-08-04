import React, { useState, useMemo } from "react";
import {
  UncontrolledDropdown,
  DropdownMenu,
  DropdownToggle,
  DropdownItem,
  Button,
  Badge,
} from "reactstrap";
import {
  Icon,
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableItem,
  UserAvatar,
  PaginationComponent,
  RSelect,
} from "@/components/Component";
import { handleExport as exportData } from "@/utils/exportUtils";
import "./CategoriesDataTable.css";

const CategoriesDataTable = ({ 
  data, 
  loading, 
  onView,
  onEdit,
  onDelete,
  onAddSubcategory
}) => {
  // State management
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(50);
  const [onSearch, setOnSearch] = useState(true);
  const [searchText, setSearchText] = useState("");

  // Helper function to get first letters for avatar
  const findUpper = (string) => {
    const matches = string.match(/[A-Z]/g);
    return matches ? matches.join("").slice(0, 2) : string.slice(0, 2).toUpperCase();
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'draft': return 'warning';
      default: return 'light';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  // Sorting functionality
  const handleSort = (field) => {
    if (typeof field === 'function') {
      const fieldName = field.toString().match(/row\.(\w+)/)?.[1] || '';
      if (sortField === fieldName) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(fieldName);
        setSortDirection('asc');
      }
    }
  };

  // Row selection handlers
  const handleRowSelect = (row, isSelected) => {
    let newSelectedRows;
    if (isSelected) {
      newSelectedRows = [...selectedRows, row];
    } else {
      newSelectedRows = selectedRows.filter(r => r.id !== row.id);
    }
    setSelectedRows(newSelectedRows);
  };

  const handleSelectAll = (isSelected) => {
    const newSelectedRows = isSelected ? [...data] : [];
    setSelectedRows(newSelectedRows);
  };

  // Export functionality using the global export utility
  const handleExport = (format) => {
    // Prepare data for export with custom formatting
    const formattedData = data.map(row => ({
      'Category Name': row.name,
      'Description': row.description || 'N/A',
      'Parent Category': row.parentName || 'Root',
      'Status': row.status,
      'Document Count': row.documentCount || 0,
      'Created Date': formatDate(row.createdAt),
      'Updated Date': formatDate(row.updatedAt)
    }));

    // Use the global export utility
    exportData(format, formattedData, 'categories', null, 'Document Categories Export');
  };

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  // Apply search filter
  const filteredData = useMemo(() => {
    if (!searchText) return sortedData;
    return sortedData.filter(item =>
      item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.parentName?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [sortedData, searchText]);

  // Pagination
  const indexOfLastItem = currentPage * itemPerPage;
  const indexOfFirstItem = indexOfLastItem - itemPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <DataTable className="card-stretch">
        <div className="card-inner text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading categories...</p>
        </div>
      </DataTable>
    );
  }

  return (
    <DataTable className="card-stretch">
      <div className="card-inner position-relative card-tools-toggle">
        <div className="card-title-group">
          {/* Left side - Bulk Actions */}
          <div className="card-tools">
            <div className="form-inline flex-nowrap gx-3">
              <div className="form-wrap">
                <RSelect
                  options={[
                    { value: "export", label: "Export Selected" },
                    { value: "delete", label: "Delete Selected" },
                    { value: "activate", label: "Activate Selected" },
                    { value: "deactivate", label: "Deactivate Selected" },
                  ]}
                  className="w-130px"
                  placeholder="Bulk Action"
                />
              </div>
              <div className="btn-wrap">
                <Button
                  disabled={selectedRows.length === 0}
                  color="light"
                  outline
                  className="btn-dim"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>

          {/* Right side - Export, Show, Search */}
          <div className="card-tools me-n1">
            <ul className="btn-toolbar gx-1">
              {/* Export Section */}
              <li className="export-section">
                <span className="export-label">Export</span>
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

              {/* Show entries */}
              <li className="show-entries">
                <span className="show-label">Show</span>
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

              {/* Search toggle */}
              <li>
                <a
                  href="#search"
                  onClick={(ev) => {
                    ev.preventDefault();
                    setOnSearch(!onSearch);
                  }}
                  className="btn btn-icon search-toggle toggle-search"
                >
                  <Icon name="search"></Icon>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`card-search search-wrap ${!onSearch ? "active" : ""}`}>
          <div className="card-body">
            <div className="search-content">
              <Button
                className="search-back btn-icon"
                onClick={() => {
                  setOnSearch(true);
                  setSearchText("");
                }}
              >
                <Icon name="arrow-left"></Icon>
              </Button>
              <input
                type="text"
                className="border-transparent form-focus-none form-control"
                placeholder="Search categories by name, description, or parent..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button className="search-submit btn-icon">
                <Icon name="search"></Icon>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <DataTableBody compact>
        <DataTableHead>
          {/* Select All Checkbox */}
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

          {/* Column Headers */}
          <DataTableRow>
            <div
              className="d-flex align-items-center cursor-pointer"
              onClick={() => handleSort((row) => row.name)}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Category</span>
              <div className="ms-1 d-flex flex-column">
                <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
                <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
              </div>
            </div>
          </DataTableRow>

          <DataTableRow>
            <div
              className="d-flex align-items-center cursor-pointer"
              onClick={() => handleSort((row) => row.parentName)}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Parent Category</span>
              <div className="ms-1 d-flex flex-column">
                <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
                <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
              </div>
            </div>
          </DataTableRow>

          <DataTableRow>
            <div
              className="d-flex align-items-center cursor-pointer"
              onClick={() => handleSort((row) => row.documentCount)}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Documents</span>
              <div className="ms-1 d-flex flex-column">
                <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
                <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
              </div>
            </div>
          </DataTableRow>

          <DataTableRow>
            <div
              className="d-flex align-items-center cursor-pointer"
              onClick={() => handleSort((row) => row.status)}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Status</span>
              <div className="ms-1 d-flex flex-column">
                <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
                <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
              </div>
            </div>
          </DataTableRow>

          <DataTableRow>
            <div
              className="d-flex align-items-center cursor-pointer"
              onClick={() => handleSort((row) => row.createdAt)}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Created</span>
              <div className="ms-1 d-flex flex-column">
                <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
                <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
              </div>
            </div>
          </DataTableRow>

          <DataTableRow>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Actions</span>
          </DataTableRow>
        </DataTableHead>

        {/* Table Rows */}
        {currentItems.length > 0 ? (
          currentItems.map((item) => (
            <DataTableItem key={item.id}>
              {/* Row Checkbox */}
              <DataTableRow className="nk-tb-col-check">
                <div className="custom-control custom-control-sm custom-checkbox notext">
                  <input
                    type="checkbox"
                    className="custom-control-input"
                    checked={selectedRows.some(row => row.id === item.id)}
                    onChange={(e) => handleRowSelect(item, e.target.checked)}
                    id={`uid_${item.id}`}
                  />
                  <label className="custom-control-label" htmlFor={`uid_${item.id}`}></label>
                </div>
              </DataTableRow>

              {/* Category Name */}
              <DataTableRow>
                <div className="user-card mt-2 mb-2">
                  <UserAvatar
                    theme="primary"
                    text={findUpper(item.name)}
                  />
                  <div className="user-info">
                    <span className="tb-lead" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                      {item.name}
                    </span>
                    <div className="text-soft" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
                      {item.description || 'No description'}
                    </div>
                  </div>
                </div>
              </DataTableRow>

              {/* Parent Category */}
              <DataTableRow>
                <div style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
                  {item.parentName ? (
                    <Badge color="outline-info" className="badge-dim">
                      {item.parentName}
                    </Badge>
                  ) : (
                    <span className="text-soft">Root Category</span>
                  )}
                </div>
              </DataTableRow>

              {/* Document Count */}
              <DataTableRow>
                <div style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
                  <Badge color="outline-primary" className="badge-dim">
                    {item.documentCount || 0} docs
                  </Badge>
                </div>
              </DataTableRow>

              {/* Status */}
              <DataTableRow>
                <Badge className={`badge-dim bg-${getStatusBadgeColor(item.status)}`}>
                  {item.status || 'Active'}
                </Badge>
              </DataTableRow>

              {/* Created Date */}
              <DataTableRow>
                <div style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#526484' }}>
                  {formatDate(item.createdAt)}
                </div>
              </DataTableRow>

              {/* Actions */}
              <DataTableRow>
                <UncontrolledDropdown>
                  <DropdownToggle tag="a" className="dropdown-toggle btn btn-icon btn-trigger">
                    <Icon name="more-h"></Icon>
                  </DropdownToggle>
                  <DropdownMenu end>
                    <ul className="link-list-opt no-bdr">
                      <li>
                        <DropdownItem onClick={() => onView(item)}>
                          <Icon name="eye"></Icon>
                          <span>View Details</span>
                        </DropdownItem>
                      </li>
                      <li>
                        <DropdownItem onClick={() => onEdit(item)}>
                          <Icon name="edit"></Icon>
                          <span>Edit Category</span>
                        </DropdownItem>
                      </li>
                      <li>
                        <DropdownItem onClick={() => onAddSubcategory(item)}>
                          <Icon name="folder-plus"></Icon>
                          <span>Add Subcategory</span>
                        </DropdownItem>
                      </li>
                      <li className="divider"></li>
                      <li>
                        <DropdownItem onClick={() => onDelete(item)} className="text-danger">
                          <Icon name="trash"></Icon>
                          <span>Delete</span>
                        </DropdownItem>
                      </li>
                    </ul>
                  </DropdownMenu>
                </UncontrolledDropdown>
              </DataTableRow>
            </DataTableItem>
          ))
        ) : (
          <DataTableItem>
            <DataTableRow colSpan="7">
              <div className="text-center py-4">
                <Icon name="folder" className="text-soft mb-2" style={{ fontSize: '2rem' }}></Icon>
                <p className="text-soft">No categories found</p>
              </div>
            </DataTableRow>
          </DataTableItem>
        )}
      </DataTableBody>

      {/* Pagination */}
      <div className="card-inner">
        {currentItems.length > 0 ? (
          <PaginationComponent
            itemPerPage={itemPerPage}
            totalItems={filteredData.length}
            paginate={setCurrentPage}
            currentPage={currentPage}
          />
        ) : null}
      </div>
    </DataTable>
  );
};

export default CategoriesDataTable;