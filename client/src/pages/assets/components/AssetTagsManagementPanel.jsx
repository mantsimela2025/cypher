import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  Badge,
  Alert,
  UncontrolledDropdown,
  DropdownMenu,
  DropdownToggle,
  DropdownItem
} from 'reactstrap';
import {
  Icon,
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableItem,
  PaginationComponent,
  RSelect
} from '@/components/Component';
import SlideOutPanel from '@/components/partials/SlideOutPanel';
import { assetTagsApi } from '@/utils/assetTagsApi';
import { toast } from 'react-toastify';
import './AssetSlideOutPanels.css';

const AssetTagsManagementPanel = ({ 
  isOpen, 
  onClose, 
  assetData,
  onTagsUpdated 
}) => {
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [availableTagKeys, setAvailableTagKeys] = useState([]);
  const [availableTagValues, setAvailableTagValues] = useState([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState({
    tagKey: '',
    tagValue: ''
  });
  const [selectedTagKey, setSelectedTagKey] = useState('');

  // DataTable state
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(25);
  const [onSearch, setOnSearch] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Inline editing state
  const [editingTag, setEditingTag] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  // Fetch asset tags when panel opens
  useEffect(() => {
    if (isOpen && assetData?.assetUuid) {
      fetchAssetTags();
      fetchAvailableTagKeys();
    }
  }, [isOpen, assetData]);

  // Fetch available tag values when tag key changes
  useEffect(() => {
    if (selectedTagKey) {
      fetchAvailableTagValues(selectedTagKey);
    } else {
      setAvailableTagValues([]);
    }
  }, [selectedTagKey]);

  const fetchAssetTags = async () => {
    try {
      setLoading(true);
      const response = await assetTagsApi.getAssetTags(assetData.assetUuid);
      if (response.success) {
        setTags(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching asset tags:', error);
      toast.error('Failed to fetch asset tags');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTagKeys = async () => {
    try {
      const response = await assetTagsApi.getTagKeys();
      if (response.success) {
        setAvailableTagKeys(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching tag keys:', error);
    }
  };

  const fetchAvailableTagValues = async (tagKey) => {
    try {
      const response = await assetTagsApi.getTagValues(tagKey);
      if (response.success) {
        setAvailableTagValues(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching tag values:', error);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.tagKey || !newTag.tagValue) {
      toast.error('Please select both tag key and value');
      return;
    }

    try {
      setLoading(true);
      const response = await assetTagsApi.addAssetTag(
        assetData.assetUuid,
        newTag.tagKey,
        newTag.tagValue
      );

      if (response.success) {
        toast.success('Tag added successfully');
        setNewTag({ tagKey: '', tagValue: '' });
        setSelectedTagKey('');
        setIsAddingTag(false);
        await fetchAssetTags();
        
        // Notify parent component to refresh asset data
        if (onTagsUpdated) {
          onTagsUpdated();
        }
      } else {
        toast.error(response.message || 'Failed to add tag');
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('Failed to add tag');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      setLoading(true);
      const response = await assetTagsApi.removeAssetTag(tagId);

      if (response.success) {
        toast.success('Tag removed successfully');
        await fetchAssetTags();
        
        // Notify parent component to refresh asset data
        if (onTagsUpdated) {
          onTagsUpdated();
        }
      } else {
        toast.error(response.message || 'Failed to remove tag');
      }
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Failed to remove tag');
    } finally {
      setLoading(false);
    }
  };

  const handleTagKeyChange = (e) => {
    const tagKey = e.target.value;
    setNewTag({ ...newTag, tagKey });
    setSelectedTagKey(tagKey);
  };

  const handleTagValueChange = (e) => {
    setNewTag({ ...newTag, tagValue: e.target.value });
  };

  // DataTable functionality
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

  const handleExport = (format) => {
    const exportData = tags.map(tag => ({
      'Tag Key': tag.tagKey,
      'Tag Value': tag.tagValue,
      'Created': tag.createdAt ? new Date(tag.createdAt).toLocaleDateString() : 'N/A'
    }));

    switch (format) {
      case 'csv':
        const csvContent = [
          Object.keys(exportData[0]).join(','),
          ...exportData.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asset_tags_${assetData?.hostname || 'asset'}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        break;
      case 'excel':
        console.log('Excel export data:', exportData);
        toast.info('Excel export functionality coming soon');
        break;
      case 'pdf':
        console.log('PDF export data:', exportData);
        toast.info('PDF export functionality coming soon');
        break;
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows([...tags]);
    } else {
      setSelectedRows([]);
    }
  };

  const handleRowSelect = (tag, checked) => {
    if (checked) {
      setSelectedRows([...selectedRows, tag]);
    } else {
      setSelectedRows(selectedRows.filter(row => row.id !== tag.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    try {
      setLoading(true);
      const promises = selectedRows.map(tag => assetTagsApi.removeAssetTag(tag.id));
      await Promise.all(promises);

      toast.success(`${selectedRows.length} tags removed successfully`);
      setSelectedRows([]);
      await fetchAssetTags();

      if (onTagsUpdated) {
        onTagsUpdated();
      }
    } catch (error) {
      console.error('Error removing tags:', error);
      toast.error('Failed to remove selected tags');
    } finally {
      setLoading(false);
    }
  };

  // Inline editing functions
  const handleStartEdit = (tag) => {
    setEditingTag(tag.id);
    setEditingValue(tag.tagValue);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditingValue('');
  };

  const handleSaveEdit = async (tagId) => {
    if (!editingValue.trim()) {
      toast.error('Tag value cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const response = await assetTagsApi.updateAssetTag(tagId, editingValue.trim());

      if (response.success) {
        toast.success('Tag updated successfully');
        setEditingTag(null);
        setEditingValue('');
        await fetchAssetTags();

        if (onTagsUpdated) {
          onTagsUpdated();
        }
      } else {
        toast.error(response.message || 'Failed to update tag');
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('Failed to update tag');
    } finally {
      setLoading(false);
    }
  };

  // Apply sorting and filtering
  const processedTags = useMemo(() => {
    let filtered = tags;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(tag =>
        tag.tagKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.tagValue.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
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
    }

    return filtered;
  }, [tags, searchTerm, sortField, sortDirection]);

  // Pagination
  const indexOfLastItem = currentPage * itemPerPage;
  const indexOfFirstItem = indexOfLastItem - itemPerPage;
  const currentItems = processedTags.slice(indexOfFirstItem, indexOfLastItem);

  // Column definitions
  const tagColumns = [
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Tag Key</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.tagKey,
      sortable: true,
      grow: 1.5,
      cell: (row) => (
        <div className="d-flex align-items-center py-1">
          <Icon
            name={assetTagsApi.getTagIcon(row.tagKey)}
            className="me-2"
            style={{ color: `var(--bs-${assetTagsApi.getTagColor(row.tagKey)})`, fontSize: '1rem' }}
          />
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
            {row.tagKey.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Tag Value</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.tagValue,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="py-1">
          {editingTag === row.id ? (
            <div className="d-flex align-items-center gap-1 edit-mode-container">
              <Input
                type="text"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit(row.id);
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
                className="compact-edit-input"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.125rem 0.375rem',
                  minWidth: '100px',
                  maxWidth: '150px',
                  height: '24px',
                  lineHeight: '1.2'
                }}
                autoFocus
              />
              <button
                type="button"
                className="btn-icon-compact save-btn"
                onClick={() => handleSaveEdit(row.id)}
                title="Save"
              >
                <Icon name="check" style={{ fontSize: '0.75rem', color: '#28a745' }}></Icon>
              </button>
              <button
                type="button"
                className="btn-icon-compact cancel-btn"
                onClick={handleCancelEdit}
                title="Cancel"
              >
                <Icon name="cross" style={{ fontSize: '0.75rem', color: '#dc3545' }}></Icon>
              </button>
            </div>
          ) : (
            <Badge
              color={assetTagsApi.getTagColor(row.tagKey)}
              className="cursor-pointer tag-value-badge"
              style={{ fontSize: '0.75rem', fontWeight: '600' }}
              onClick={() => handleStartEdit(row)}
              title="Click to edit"
            >
              {row.tagValue}
            </Badge>
          )}
        </div>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Created</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.createdAt,
      sortable: true,
      cell: (row) => (
        <div style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#526484' }}>
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
        </div>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <UncontrolledDropdown>
          <DropdownToggle tag="a" className="dropdown-toggle btn btn-icon btn-trigger">
            <Icon name="more-h"></Icon>
          </DropdownToggle>
          <DropdownMenu end>
            <ul className="link-list-opt no-bdr">
              <li>
                <DropdownItem onClick={() => handleStartEdit(row)}>
                  <Icon name="edit"></Icon>
                  <span>Edit Value</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem onClick={() => handleRemoveTag(row.id)}>
                  <Icon name="trash"></Icon>
                  <span>Remove Tag</span>
                </DropdownItem>
              </li>
            </ul>
          </DropdownMenu>
        </UncontrolledDropdown>
      ),
      allowOverflow: true,
      button: true,
    },
  ];

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={onClose}
      title={`Tags Management`}
      subtitle={assetData?.hostname || 'Asset'}
      size="lg"
    >
      <div className="p-4">
        {loading && (
          <div className="text-center p-4">
            <Icon name="spinner" className="spinning"></Icon>
            <p>Loading tags...</p>
          </div>
        )}

        {!loading && (
          <div>
            {/* Header with Add Tag button */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">
                <Icon name="tags" className="me-2"></Icon>
                Asset Tags ({tags.length})
              </h5>
              <Button
                color="primary"
                size="sm"
                onClick={() => setIsAddingTag(!isAddingTag)}
                disabled={loading}
                style={{ height: '32px' }}
              >
                <Icon name="plus" className="me-1"></Icon>
                Add Tag
              </Button>
            </div>

            {/* Add Tag Form */}
            {isAddingTag && (
              <div className="border rounded p-3 mb-4 bg-light">
                <h6 className="mb-3">Add New Tag</h6>
                <Form>
                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="tagKey" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Tag Key</Label>
                        <Input
                          type="select"
                          name="tagKey"
                          id="tagKey"
                          value={newTag.tagKey}
                          onChange={handleTagKeyChange}
                        >
                          <option value="">Select tag key...</option>
                          {availableTagKeys.map(key => (
                            <option key={key.tagKey} value={key.tagKey}>
                              {key.tagKey} ({key.count} assets)
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="tagValue" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Tag Value</Label>
                        {availableTagValues.length > 0 ? (
                          <Input
                            type="select"
                            name="tagValue"
                            id="tagValue"
                            value={newTag.tagValue}
                            onChange={handleTagValueChange}
                          >
                            <option value="">Select tag value...</option>
                            {availableTagValues.map(value => (
                              <option key={value.tagValue} value={value.tagValue}>
                                {value.tagValue} ({value.count} assets)
                              </option>
                            ))}
                          </Input>
                        ) : (
                          <Input
                            type="text"
                            name="tagValue"
                            id="tagValue"
                            placeholder="Enter custom tag value..."
                            value={newTag.tagValue}
                            onChange={handleTagValueChange}
                          />
                        )}
                      </FormGroup>
                    </Col>
                  </Row>
                  <div className="d-flex" style={{ gap: '8px' }}>
                    <Button
                      color="primary"
                      size="sm"
                      onClick={handleAddTag}
                      disabled={loading || !newTag.tagKey || !newTag.tagValue}
                      style={{ height: '32px' }}
                    >
                      <Icon name="check" className="me-1"></Icon>
                      Add Tag
                    </Button>
                    <Button
                      color="secondary"
                      size="sm"
                      onClick={() => {
                        setIsAddingTag(false);
                        setNewTag({ tagKey: '', tagValue: '' });
                        setSelectedTagKey('');
                      }}
                      style={{ height: '32px' }}
                    >
                      <Icon name="cross" className="me-1"></Icon>
                      Cancel
                    </Button>
                  </div>
                </Form>
              </div>
            )}

            {/* Tags DataTable */}
            <DataTable className="card-stretch tags-compact-table">
              <div className="card-inner position-relative card-tools-toggle">
                <div className="card-title-group">
                  {/* Left side - Bulk Actions */}
                  <div className="card-tools">
                    <div className="form-inline flex-nowrap gx-3">
                      <div className="form-wrap">
                        <RSelect
                          options={[
                            { value: "delete", label: "Delete Selected" },
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
                          onClick={handleBulkDelete}
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
                        onClick={() => setOnSearch(true)}
                      >
                        <Icon name="arrow-left"></Icon>
                      </Button>
                      <Input
                        type="text"
                        className="border-transparent form-focus-none form-control"
                        placeholder="Search tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Button className="search-submit btn-icon">
                        <Icon name="search"></Icon>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <DataTableBody compact className="tags-table-body">
                <DataTableHead>
                  {/* Select All Checkbox */}
                  <DataTableRow className="nk-tb-col-check">
                    <div className="custom-control custom-control-sm custom-checkbox notext">
                      <input
                        type="checkbox"
                        className="custom-control-input"
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        id="uid_all_tags"
                        checked={selectedRows.length === tags.length && tags.length > 0}
                      />
                      <label className="custom-control-label" htmlFor="uid_all_tags"></label>
                    </div>
                  </DataTableRow>

                  {/* Column Headers */}
                  {tagColumns.map((column, index) => (
                    <DataTableRow key={index}>
                      {column.sortable ? (
                        <div
                          className="d-flex align-items-center cursor-pointer sortable-header"
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

                {/* Table Rows */}
                {currentItems.length > 0 ? (
                  currentItems.map((tag) => (
                    <DataTableItem key={tag.id}>
                      {/* Row Checkbox */}
                      <DataTableRow className="nk-tb-col-check">
                        <div className="custom-control custom-control-sm custom-checkbox notext">
                          <input
                            type="checkbox"
                            className="custom-control-input"
                            checked={selectedRows.some(row => row.id === tag.id)}
                            onChange={(e) => handleRowSelect(tag, e.target.checked)}
                            id={`uid_tag_${tag.id}`}
                          />
                          <label className="custom-control-label" htmlFor={`uid_tag_${tag.id}`}></label>
                        </div>
                      </DataTableRow>

                      {/* Data Cells */}
                      {tagColumns.map((column, index) => (
                        <DataTableRow key={index}>
                          {column.cell ? column.cell(tag) : tag[column.selector(tag)]}
                        </DataTableRow>
                      ))}
                    </DataTableItem>
                  ))
                ) : (
                  <DataTableItem>
                    <DataTableRow colSpan={tagColumns.length + 1}>
                      <div className="text-center py-4">
                        <Icon name="info" className="me-2"></Icon>
                        {searchTerm ? 'No tags match your search criteria.' : 'No tags assigned to this asset. Click "Add Tag" to get started.'}
                      </div>
                    </DataTableRow>
                  </DataTableItem>
                )}
              </DataTableBody>

              {/* Pagination */}
              <div className="card-inner">
                {processedTags.length > 0 ? (
                  <PaginationComponent
                    itemPerPage={itemPerPage}
                    totalItems={processedTags.length}
                    paginate={setCurrentPage}
                    currentPage={currentPage}
                  />
                ) : null}
              </div>
            </DataTable>
          </div>
        )}
      </div>
    </SlideOutPanel>
  );
};

export default AssetTagsManagementPanel;
