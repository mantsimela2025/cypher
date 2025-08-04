import React from "react";
import { Row, Col } from "reactstrap";
import { Icon } from "@/components/Component";
import { Line } from "react-chartjs-2";

const SystemsStatsCards = ({ stats }) => {
  const {
    totalSystems = 0,
    activeSystems = 0,
    criticalAlerts = 0,
    pendingUpdates = 0,
    compliancePercentage = 0,
    growthRate = 0
  } = stats;

  // Generate sample chart data for each card
  const generateChartData = (trend = 'up') => {
    const baseData = [12, 19, 15, 25, 22, 30, 28, 35, 32, 38, 42, 45];
    const data = trend === 'up'
      ? baseData.map((val, idx) => val + Math.random() * 10 + idx * 2)
      : baseData.map((val, idx) => val + Math.random() * 5 - idx * 0.5);

    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        data: data,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: {
      point: { radius: 0 }
    }
  };

  const statsCards = [
    {
      title: "Total Systems",
      value: totalSystems.toLocaleString(),
      icon: "info",
      bgColor: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)", // Red gradient
      chartData: generateChartData('up'),
      subtitle: "Last 30 days"
    },
    {
      title: "Active Systems",
      value: activeSystems.toLocaleString(),
      icon: "info",
      bgColor: "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)", // Orange gradient
      chartData: generateChartData('up'),
      subtitle: "Last 30 days"
    },
    {
      title: "Critical Alerts",
      value: criticalAlerts.toLocaleString(),
      icon: "info",
      bgColor: "linear-gradient(135deg, #27ae60 0%, #229954 100%)", // Green gradient
      chartData: generateChartData('down'),
      subtitle: "Last 30 days"
    },
    {
      title: "Pending Updates",
      value: pendingUpdates.toLocaleString(),
      icon: "info",
      bgColor: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)", // Blue gradient
      chartData: generateChartData('up'),
      subtitle: "Last 30 days"
    },
    {
      title: "Compliant Systems",
      value: `${compliancePercentage}%`,
      icon: "info",
      bgColor: "linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)", // Purple gradient
      chartData: generateChartData('up'),
      subtitle: "Last 30 days"
    },
    {
      title: "Growth Rate",
      value: `${growthRate >= 0 ? '+' : ''}${growthRate}%`,
      icon: "info",
      bgColor: "linear-gradient(135deg, #1abc9c 0%, #16a085 100%)", // Teal gradient
      chartData: generateChartData(growthRate >= 0 ? 'up' : 'down'),
      subtitle: "Last 30 days"
    }
  ];

  return (
    <div className="nk-block">
      <Row className="g-4">
        {statsCards.map((card, index) => (
          <Col key={index} xxl="2" md="4" sm="6">
            <div
              className="card"
              style={{
                background: card.bgColor,
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                height: '160px' // Fixed height to make cards shorter
              }}
            >
              <div className="card-inner" style={{ padding: '1rem' }}>
                {/* Header with icon */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="text-white mb-1" style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                      {card.title}
                    </h6>
                    <p className="text-white mb-0" style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                      {card.subtitle}
                    </p>
                  </div>
                  <Icon
                    name={card.icon}
                    className="text-white"
                    style={{ opacity: 0.7, fontSize: '1rem' }}
                  />
                </div>

                {/* Main Value */}
                <div className="mb-2">
                  <h2 className="text-white mb-0" style={{ fontSize: '2rem', fontWeight: '700' }}>
                    {card.value}
                  </h2>
                </div>

                {/* Chart */}
                <div style={{ height: '40px', marginTop: 'auto' }}>
                  <Line
                    data={card.chartData}
                    options={chartOptions}
                  />
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default SystemsStatsCards;
