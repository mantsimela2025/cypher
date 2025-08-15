import React from "react";
import { Row, Col } from "reactstrap";
import { Icon, TooltipComponent } from "@/components/Component";
import "./AssetStatsCards.css";

const AnalyticsStatsCards = ({ loading = false }) => {
  const statsData = [
    {
      id: "total-assets",
      title: "Total Assets",
      subtitle: "Last 30 days",
      amount: "65",
      icon: "package",
      bgColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      tooltip: "Total number of assets in inventory"
    },
    {
      id: "total-value",
      title: "Total Value",
      subtitle: "Last 30 days",
      amount: "$4.2M",
      icon: "coin",
      bgColor: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      tooltip: "Total monetary value of all assets"
    },
    {
      id: "avg-utilization",
      title: "Avg Utilization",
      subtitle: "Last 30 days",
      amount: "87.5%",
      icon: "activity",
      bgColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      tooltip: "Average utilization rate across all assets"
    },
    {
      id: "health-score",
      title: "Health Score",
      subtitle: "Last 30 days",
      amount: "91.2",
      icon: "shield-check",
      bgColor: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      tooltip: "Overall health score of asset portfolio"
    }
  ];

  // SVG Wave Component
  const WavePattern = () => (
    <svg
      className="position-absolute bottom-0 start-0 w-100"
      height="40"
      viewBox="0 0 400 40"
      preserveAspectRatio="none"
      style={{ opacity: 0.3 }}
    >
      <path
        d="M0,20 Q100,5 200,20 T400,20 L400,40 L0,40 Z"
        fill="rgba(255,255,255,0.2)"
      />
    </svg>
  );

  return (
    <Row className="g-3" style={{ paddingBottom: '10px' }}>
      {statsData.map((item) => (
        <Col xl="3" lg="6" sm="6" key={item.id}>
          <div
            className="asset-stats-card card border-0 position-relative overflow-hidden"
            style={{
              background: item.bgColor,
              borderRadius: '12px',
              minHeight: '95px'
            }}
          >
            <div className="card-inner text-white position-relative" style={{ zIndex: 2, padding: '1rem' }}>
              {/* Header with title and info icon */}
              <div className="d-flex justify-content-between align-items-start mb-1">
                <div>
                  <h6 className="text-white mb-1 fw-bold" style={{ fontSize: '13px' }}>
                    {item.title}
                  </h6>
                  <small className="text-white-50" style={{ fontSize: '11px' }}>
                    {item.subtitle}
                  </small>
                </div>
                <TooltipComponent
                  iconClass="text-white-50"
                  icon="help"
                  direction="left"
                  id={`tooltip-${item.id}`}
                  text={item.tooltip}
                  style={{ fontSize: '14px' }}
                />
              </div>

              {/* Main number */}
              <div className="mt-2">
                <h2 className={`text-white mb-0 fw-bold ${loading ? 'asset-stats-loading' : ''}`} style={{ fontSize: '1.8rem', lineHeight: '1' }}>
                  {loading ? '-' : item.amount}
                </h2>
              </div>
            </div>

            {/* Wave pattern background */}
            <WavePattern />

            {/* Decorative border line */}
            <div
              className="position-absolute top-0 start-0"
              style={{
                width: '4px',
                height: '100%',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '2px 0 0 2px'
              }}
            />
          </div>
        </Col>
      ))}
    </Row>
  );
};

export default AnalyticsStatsCards;
