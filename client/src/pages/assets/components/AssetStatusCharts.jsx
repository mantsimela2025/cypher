import React from "react";
import { Row, Col } from "reactstrap";
import { Icon } from "@/components/Component";

const AssetStatusCharts = ({ assets, loading }) => {
  // Calculate chart data
  const calculateChartData = () => {
    if (!assets || assets.length === 0) {
      return {
        liveStatus: { terminated: 0, live: 0 },
        scanStatus: { discovered: 0, scanned: 0, authenticated: 0 },
        licenseStatus: { licensed: 0, unlicensed: 0 }
      };
    }

    const liveStatus = {
      terminated: assets.filter(a => !a.lastSeen || new Date(a.lastSeen) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      live: assets.filter(a => a.lastSeen && new Date(a.lastSeen) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
    };

    const scanStatus = {
      discovered: assets.filter(a => !a.hasPluginResults).length,
      scanned: assets.filter(a => a.hasPluginResults && !a.hasAgent).length,
      authenticated: assets.filter(a => a.hasAgent).length
    };

    const licenseStatus = {
      licensed: assets.filter(a => a.hasAgent || a.hasPluginResults).length,
      unlicensed: assets.filter(a => !a.hasAgent && !a.hasPluginResults).length
    };

    return { liveStatus, scanStatus, licenseStatus };
  };

  const chartData = calculateChartData();

  const ChartCard = ({ title, data, colors, icon }) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    
    return (
      <div className="card card-bordered">
        <div className="card-inner">
          <div className="card-title-group align-start mb-3">
            <div className="card-title">
              <h6 className="title d-flex align-items-center">
                <Icon name={icon} className="me-2"></Icon>
                {title}
              </h6>
            </div>
            <div className="card-tools">
              <Icon name="more-h" className="text-soft"></Icon>
            </div>
          </div>
          
          {/* Simple horizontal bar chart */}
          <div className="mb-3">
            {Object.entries(data).map(([key, value], index) => {
              const percentage = total > 0 ? (value / total) * 100 : 0;
              const color = colors[key] || 'secondary';
              
              return (
                <div key={key} className="mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-soft text-capitalize" style={{ fontSize: '0.875rem' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                      {value}
                    </span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div 
                      className={`progress-bar bg-${color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="d-flex flex-wrap gap-3">
            {Object.entries(data).map(([key, value]) => {
              const color = colors[key] || 'secondary';
              return (
                <div key={key} className="d-flex align-items-center">
                  <div 
                    className={`bg-${color}`}
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '2px',
                      marginRight: '6px'
                    }}
                  ></div>
                  <span style={{ fontSize: '0.75rem' }} className="text-soft text-capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-3 text-center">
            <span className="text-soft" style={{ fontSize: '0.75rem' }}>
              Total Assets: {total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Row className="g-gs mb-4">
        <Col lg="12">
          <div className="card card-bordered">
            <div className="card-inner text-center py-5">
              <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
                <span className="sr-only">Loading assets...</span>
              </div>
              <div className="mt-3">
                <p className="text-soft">Loading assets...</p>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    );
  }

  return (
    <Row className="g-gs mb-4">
      <Col lg="4">
        <ChartCard
          title="Assets by Live Status"
          data={chartData.liveStatus}
          colors={{
            terminated: 'secondary',
            live: 'primary'
          }}
          icon="activity"
        />
      </Col>
      <Col lg="4">
        <ChartCard
          title="Assets by Scan Status"
          data={chartData.scanStatus}
          colors={{
            discovered: 'info',
            scanned: 'warning',
            authenticated: 'success'
          }}
          icon="shield-check"
        />
      </Col>
      <Col lg="4">
        <ChartCard
          title="Assets by License Status"
          data={chartData.licenseStatus}
          colors={{
            licensed: 'success',
            unlicensed: 'secondary'
          }}
          icon="award"
        />
      </Col>
    </Row>
  );
};

export default AssetStatusCharts;
