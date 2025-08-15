import React from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";

import { Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Filler, Legend, } from "chart.js";
Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Filler, Legend, );

export const AssetOverviewChart = ({ data }) => {
  const options = {
    legend: {
      display: false,
      labels: {
        boxWidth: 30,
        padding: 20,
        color: "#6783b8",
      },
    },
    maintainAspectRatio: false,
    tooltips: {
      enabled: true,
      callbacks: {
        title: function () {
          return false;
        },
        label: function (tooltipItem, data) {
          return data.dataUnit + " " + tooltipItem.yLabel;
        },
      },
      backgroundColor: "#eff6ff",
      titleFontSize: 13,
      titleFontColor: "#6783b8",
      titleMarginBottom: 6,
      bodyFontColor: "#9eaecf",
      bodyFontSize: 12,
      bodySpacing: 4,
      yPadding: 10,
      xPadding: 10,
      footerMarginTop: 0,
      displayColors: false,
    },
    scales: {
      yAxes: [
        {
          display: true,
          stacked: true,
          position: "left",
          ticks: {
            beginAtZero: true,
            fontSize: 11,
            fontColor: "#9eaecf",
            padding: 10,
            callback: function (value, index, values) {
              return value + " " + data.dataUnit;
            },
            min: 0,
            stepSize: 500,
          },
          gridLines: {
            color: "#e5ecf8",
            tickMarkLength: 0,
            zeroLineColor: "#e5ecf8",
          },
        },
      ],
      xAxes: [
        {
          display: true,
          stacked: true,
          ticks: {
            fontSize: 11,
            fontColor: "#9eaecf",
            padding: 5,
          },
          gridLines: {
            color: "transparent",
            tickMarkLength: 10,
            zeroLineColor: "transparent",
            offsetGridLines: true,
          },
        },
      ],
    },
  };
  return <Line data={data} options={options} />;
};

export const AssetValueChart = ({ data }) => {
  const options = {
    legend: {
      display: false,
      labels: {
        boxWidth: 30,
        padding: 20,
        color: "#6783b8",
      },
    },
    maintainAspectRatio: false,
    tooltips: {
      enabled: true,
      callbacks: {
        title: function () {
          return false;
        },
        label: function (tooltipItem, data) {
          return "$" + tooltipItem.yLabel.toLocaleString();
        },
      },
      backgroundColor: "#eff6ff",
      titleFontSize: 13,
      titleFontColor: "#6783b8",
      titleMarginBottom: 6,
      bodyFontColor: "#9eaecf",
      bodyFontSize: 12,
      bodySpacing: 4,
      yPadding: 10,
      xPadding: 10,
      footerMarginTop: 0,
      displayColors: false,
    },
    scales: {
      yAxes: [
        {
          display: true,
          stacked: false,
          position: "left",
          ticks: {
            beginAtZero: true,
            fontSize: 11,
            fontColor: "#9eaecf",
            padding: 10,
            callback: function (value, index, values) {
              return "$" + (value / 1000000).toFixed(1) + "M";
            },
            min: 0,
          },
          gridLines: {
            color: "#e5ecf8",
            tickMarkLength: 0,
            zeroLineColor: "#e5ecf8",
          },
        },
      ],
      xAxes: [
        {
          display: true,
          stacked: false,
          ticks: {
            fontSize: 11,
            fontColor: "#9eaecf",
            padding: 5,
          },
          gridLines: {
            color: "transparent",
            tickMarkLength: 10,
            zeroLineColor: "transparent",
          },
        },
      ],
    },
  };
  return <Bar data={data} options={options} />;
};

export const AssetUtilizationChart = ({ data }) => {
  const options = {
    legend: {
      display: false,
    },
    maintainAspectRatio: false,
    tooltips: {
      enabled: true,
      callbacks: {
        title: function () {
          return false;
        },
        label: function (tooltipItem, data) {
          return tooltipItem.yLabel + "%";
        },
      },
      backgroundColor: "#eff6ff",
      titleFontSize: 13,
      titleFontColor: "#6783b8",
      titleMarginBottom: 6,
      bodyFontColor: "#9eaecf",
      bodyFontSize: 12,
      bodySpacing: 4,
      yPadding: 10,
      xPadding: 10,
      footerMarginTop: 0,
      displayColors: false,
    },
    scales: {
      yAxes: [
        {
          display: true,
          stacked: false,
          position: "left",
          ticks: {
            beginAtZero: true,
            fontSize: 11,
            fontColor: "#9eaecf",
            padding: 10,
            callback: function (value, index, values) {
              return value + "%";
            },
            min: 0,
            max: 100,
            stepSize: 20,
          },
          gridLines: {
            color: "#e5ecf8",
            tickMarkLength: 0,
            zeroLineColor: "#e5ecf8",
          },
        },
      ],
      xAxes: [
        {
          display: true,
          stacked: false,
          ticks: {
            fontSize: 11,
            fontColor: "#9eaecf",
            padding: 5,
          },
          gridLines: {
            color: "transparent",
            tickMarkLength: 10,
            zeroLineColor: "transparent",
          },
        },
      ],
    },
  };
  return <Line data={data} options={options} />;
};

export const AssetHealthChart = ({ data }) => {
  const options = {
    legend: {
      display: false,
    },
    maintainAspectRatio: false,
    tooltips: {
      enabled: true,
      callbacks: {
        title: function () {
          return false;
        },
        label: function (tooltipItem, data) {
          return "Health Score: " + tooltipItem.yLabel;
        },
      },
      backgroundColor: "#eff6ff",
      titleFontSize: 13,
      titleFontColor: "#6783b8",
      titleMarginBottom: 6,
      bodyFontColor: "#9eaecf",
      bodyFontSize: 12,
      bodySpacing: 4,
      yPadding: 10,
      xPadding: 10,
      footerMarginTop: 0,
      displayColors: false,
    },
    scales: {
      yAxes: [
        {
          display: true,
          ticks: {
            beginAtZero: false,
            fontSize: 11,
            fontColor: "#9eaecf",
            padding: 10,
            min: 75,
            max: 100,
            stepSize: 5,
          },
          gridLines: {
            color: "#e5ecf8",
            tickMarkLength: 0,
            zeroLineColor: "#e5ecf8",
          },
        },
      ],
      xAxes: [
        {
          display: true,
          ticks: {
            fontSize: 11,
            fontColor: "#9eaecf",
            padding: 5,
          },
          gridLines: {
            color: "transparent",
            tickMarkLength: 10,
            zeroLineColor: "transparent",
          },
        },
      ],
    },
  };
  return <Line data={data} options={options} />;
};

export const MaintenanceCostChart = ({ data }) => {
  const options = {
    legend: {
      display: false,
    },
    maintainAspectRatio: false,
    tooltips: {
      enabled: true,
      callbacks: {
        title: function () {
          return false;
        },
        label: function (tooltipItem, data) {
          return "$" + tooltipItem.yLabel.toLocaleString();
        },
      },
      backgroundColor: "#eff6ff",
      titleFontSize: 13,
      titleFontColor: "#6783b8",
      titleMarginBottom: 6,
      bodyFontColor: "#9eaecf",
      bodyFontSize: 12,
      bodySpacing: 4,
      yPadding: 10,
      xPadding: 10,
      footerMarginTop: 0,
      displayColors: false,
    },
    scales: {
      yAxes: [
        {
          display: true,
          ticks: {
            beginAtZero: false,
            fontSize: 11,
            fontColor: "#9eaecf",
            padding: 10,
            callback: function (value, index, values) {
              return "$" + (value / 1000).toFixed(0) + "K";
            },
            min: 40000,
            max: 75000,
            stepSize: 5000,
          },
          gridLines: {
            color: "#e5ecf8",
            tickMarkLength: 0,
            zeroLineColor: "#e5ecf8",
          },
        },
      ],
      xAxes: [
        {
          display: true,
          ticks: {
            fontSize: 11,
            fontColor: "#9eaecf",
            padding: 5,
          },
          gridLines: {
            color: "transparent",
            tickMarkLength: 10,
            zeroLineColor: "transparent",
          },
        },
      ],
    },
  };
  return <Line data={data} options={options} />;
};

export const AssetCategoryDoughnut = ({ data }) => {
  const options = {
    legend: {
      display: false,
    },
    rotation: -0.5 * Math.PI,
    cutoutPercentage: 60,
    maintainAspectRatio: false,
    tooltips: {
      enabled: true,
      callbacks: {
        title: function () {
          return false;
        },
        label: function (tooltipItem, data) {
          return data.labels[tooltipItem.index] + ": " + data.datasets[0].data[tooltipItem.index];
        },
      },
      backgroundColor: "#eff6ff",
      titleFontSize: 13,
      titleFontColor: "#6783b8",
      titleMarginBottom: 6,
      bodyFontColor: "#9eaecf",
      bodyFontSize: 12,
      bodySpacing: 4,
      yPadding: 10,
      xPadding: 10,
      footerMarginTop: 0,
      displayColors: false,
    },
  };
  return <Doughnut data={data} options={options} />;
};

export const AssetStatusDoughnut = ({ data }) => {
  const options = {
    legend: {
      display: false,
    },
    rotation: -0.5 * Math.PI,
    cutoutPercentage: 60,
    maintainAspectRatio: false,
    tooltips: {
      enabled: true,
      callbacks: {
        title: function () {
          return false;
        },
        label: function (tooltipItem, data) {
          return data.labels[tooltipItem.index] + ": " + data.datasets[0].data[tooltipItem.index];
        },
      },
      backgroundColor: "#eff6ff",
      titleFontSize: 13,
      titleFontColor: "#6783b8",
      titleMarginBottom: 6,
      bodyFontColor: "#9eaecf",
      bodyFontSize: 12,
      bodySpacing: 4,
      yPadding: 10,
      xPadding: 10,
      footerMarginTop: 0,
      displayColors: false,
    },
  };
  return <Doughnut data={data} options={options} />;
};