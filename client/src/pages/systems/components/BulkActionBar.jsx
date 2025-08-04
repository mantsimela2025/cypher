import React from "react";
import { Card, CardBody, Button } from "reactstrap";
import { Icon } from "@/components/Component";
import { systemsApi } from "@/utils/systemsApi";
import { toast } from "react-toastify";

const BulkActionBar = ({
  selectedCount,
  selectedSystems,
  onClearSelection,
  onRefresh
}) => {
  const handleBulkAction = async (action, data = {}) => {
    try {
      const result = await systemsApi.bulkOperations(action, selectedSystems, data);

      if (result.success) {
        toast.success(`Bulk ${action} completed: ${result.data.success} successful, ${result.data.failed} failed`);
        onClearSelection();
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast.error(`Failed to perform bulk ${action}. Please try again.`);
    }
  };

  const handleAddTags = () => {
    // TODO: Open tag selection modal
    console.log('Add tags to selected systems');
  };

  const handleUpdateStatus = () => {
    // TODO: Open status selection modal
    console.log('Update status for selected systems');
  };

  const handleRunScan = () => {
    // TODO: Open scan configuration modal
    console.log('Run scan on selected systems');
  };

  const handleExport = () => {
    // TODO: Export selected systems
    console.log('Export selected systems');
  };

  const handleDelete = () => {
    // TODO: Show confirmation dialog
    if (window.confirm(`Are you sure you want to delete ${selectedCount} systems? This action cannot be undone.`)) {
      handleBulkAction('delete');
    }
  };

  return (
    <div className="nk-block">
      <Card className="card-bordered bg-light">
        <CardBody className="py-3">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <Icon name="check-circle" className="text-success me-1" />
                <strong>{selectedCount}</strong> systems selected
              </div>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <Button
                size="sm"
                color="outline-primary"
                onClick={handleAddTags}
              >
                <Icon name="tag" className="me-1" />
                Add Tags
              </Button>
              
              <Button
                size="sm"
                color="outline-info"
                onClick={handleUpdateStatus}
              >
                <Icon name="activity" className="me-1" />
                Update Status
              </Button>
              
              <Button
                size="sm"
                color="outline-warning"
                onClick={handleRunScan}
              >
                <Icon name="shield-check" className="me-1" />
                Run Scan
              </Button>
              
              <Button
                size="sm"
                color="outline-success"
                onClick={handleExport}
              >
                <Icon name="download" className="me-1" />
                Export
              </Button>
              
              <div className="border-start ps-2 ms-2">
                <Button
                  size="sm"
                  color="outline-danger"
                  onClick={handleDelete}
                >
                  <Icon name="trash" className="me-1" />
                  Delete
                </Button>
              </div>
              
              <Button
                size="sm"
                color="light"
                onClick={onClearSelection}
                className="ms-2"
              >
                <Icon name="cross" className="me-1" />
                Clear Selection
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default BulkActionBar;
