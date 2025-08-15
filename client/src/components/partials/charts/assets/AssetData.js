// Asset Analytics Chart Data

export var assetOverviewData = {
  labels: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ],
  dataUnit: "Assets",
  datasets: [
    {
      label: "Current Year",
      borderDash: [5],
      borderWidth: 2,
      fill: false,
      borderColor: "#9d72ff",
      backgroundColor: "transparent",
      pointBorderColor: "transparent",
      pointBackgroundColor: "transparent",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "#9d72ff",
      pointBorderWidth: 2,
      pointHoverRadius: 4,
      pointHoverBorderWidth: 2,
      pointRadius: 4,
      pointHitRadius: 4,
      data: [1250, 1380, 1420, 1580, 1650, 1720, 1830, 1920, 2050, 2180, 2250, 2350],
    },
    {
      label: "Previous Year",
      color: "#9d72ff",
      borderWidth: 2,
      lineTension: 0,
      fill: true,
      dash: 0,
      borderColor: "#9d72ff",
      backgroundColor: "rgba(157, 114, 255, 0.15)",
      borderCapStyle: "square",
      pointBorderColor: "transparent",
      pointBackgroundColor: "transparent",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "#9d72ff",
      pointBorderWidth: 2,
      pointHoverRadius: 4,
      pointHoverBorderWidth: 2,
      pointRadius: 4,
      pointHitRadius: 4,
      data: [1180, 1220, 1350, 1450, 1520, 1650, 1750, 1820, 1950, 2080, 2150, 2280],
    },
  ],
};

export var assetValueData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  dataUnit: "USD",
  datasets: [
    {
      label: "Asset Value Analytics",
      color: "#798bff",
      barPercentage: 0.7,
      categoryPercentage: 0.7,
      backgroundColor: "rgba(121, 139, 255, 0.75)",
      data: [2400000, 2650000, 2800000, 2900000, 3100000, 3250000, 3400000, 3550000, 3700000, 3850000, 4000000, 4200000],
    },
  ],
};

// Asset Performance Data
export var AssetUtilizationData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  dataUnit: "Percentage",
  datasets: [
    {
      label: "Asset Utilization",
      lineTension: 0,
      borderWidth: 2,
      fill: true,
      color: "#798bff",
      backgroundColor: "rgba(121, 139, 255, 0.25)",
      borderColor: "#798bff",
      pointBorderColor: "transparent",
      pointBackgroundColor: "transparent",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "#798bff",
      pointBorderWidth: 2,
      pointHoverRadius: 4,
      pointHoverBorderWidth: 2,
      pointRadius: 4,
      pointHitRadius: 4,
      data: [78, 82, 85, 79, 88, 92, 87, 85, 90, 93, 89, 91],
    },
  ],
};

export var AssetHealthData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  dataUnit: "Score",
  datasets: [
    {
      label: "Asset Health Score",
      lineTension: 0,
      borderWidth: 2,
      fill: true,
      color: "#9a89ff",
      backgroundColor: "rgba(154, 137, 255, 0.25)",
      borderColor: "#9a89ff",
      pointRadius: "0",
      data: [85, 87, 84, 88, 90, 89, 92, 91, 88, 90, 93, 94],
    },
  ],
};

export var MaintenanceCostData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  dataUnit: "USD",
  datasets: [
    {
      label: "Maintenance Costs",
      lineTension: 0,
      borderWidth: 2,
      fill: true,
      color: "#ffa9ce",
      backgroundColor: "rgba(255, 169, 206, 0.25)",
      borderColor: "#ffa9ce",
      pointRadius: "0",
      data: [45000, 52000, 48000, 58000, 61000, 55000, 62000, 59000, 64000, 67000, 71000, 68000],
    },
  ],
};

export var DepreciationData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  dataUnit: "USD",
  datasets: [
    {
      label: "Depreciation",
      lineTension: 0,
      borderWidth: 2,
      fill: true,
      color: "#f9db7b",
      backgroundColor: "rgba(249, 219, 123, 0.25)",
      borderColor: "#f9db7b",
      pointRadius: "0",
      data: [85000, 88000, 91000, 94000, 97000, 100000, 103000, 106000, 109000, 112000, 115000, 118000],
    },
  ],
};

// Asset Category Distribution Data
export var AssetCategoryData = {
  labels: ["Hardware", "Software", "Infrastructure", "Vehicles", "Equipment"],
  dataUnit: "Assets",
  legend: false,
  datasets: [
    {
      borderColor: "#fff",
      backgroundColor: ["#798bff", "#b8acff", "#ffa9ce", "#f9db7b", "#7de1f8"],
      data: [1245, 687, 432, 289, 197],
    },
  ],
};

// Asset Status Distribution
export var AssetStatusData = {
  labels: ["Active", "Maintenance", "Retired", "In Transit"],
  dataUnit: "Assets",
  legend: false,
  datasets: [
    {
      borderColor: "#fff",
      backgroundColor: ["#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"],
      data: [2156, 234, 156, 89],
    },
  ],
};

// Asset Lifecycle Data
export var AssetLifecycleData = [
  {
    id: 1,
    stage: "New (0-2 years)",
    count: "892",
    percentage: "35.2",
    value: "$2,840,000",
    theme: "success",
  },
  {
    id: 2,
    stage: "Prime (3-5 years)",
    count: "756",
    percentage: "29.8",
    value: "$1,890,000",
    theme: "info",
  },
  {
    id: 3,
    stage: "Mature (6-8 years)",
    count: "534",
    percentage: "21.1",
    value: "$980,000",
    theme: "warning",
  },
  {
    id: 4,
    stage: "End of Life (9+ years)",
    count: "353",
    percentage: "13.9",
    value: "$420,000",
    theme: "danger",
  },
];

// Cost Analysis Data
export var CostAnalysisData = [
  {
    id: 1,
    category: "Hardware",
    currentValue: "$2,450,000",
    maintenanceCost: "$125,000",
    utilizationRate: "87.5%",
    roi: "145%",
    theme: "primary",
  },
  {
    id: 2,
    category: "Software",
    currentValue: "$890,000",
    maintenanceCost: "$67,000",
    utilizationRate: "92.1%",
    roi: "210%",
    theme: "info",
  },
  {
    id: 3,
    category: "Infrastructure",
    currentValue: "$1,680,000",
    maintenanceCost: "$89,000",
    utilizationRate: "78.9%",
    roi: "128%",
    theme: "success",
  },
  {
    id: 4,
    category: "Vehicles",
    currentValue: "$750,000",
    maintenanceCost: "$45,000",
    utilizationRate: "83.2%",
    roi: "95%",
    theme: "warning",
  },
];

// Top Assets by Value
export var TopAssetsData = [
  {
    id: 1,
    name: "Data Center Infrastructure",
    category: "Infrastructure", 
    value: "$1,250,000",
    condition: "Excellent",
    utilization: "94%",
    theme: "success",
  },
  {
    id: 2,
    name: "Enterprise Server Cluster",
    category: "Hardware",
    value: "$890,000", 
    condition: "Good",
    utilization: "89%",
    theme: "info",
  },
  {
    id: 3,
    name: "ERP Software Suite",
    category: "Software",
    value: "$450,000",
    condition: "Excellent", 
    utilization: "97%",
    theme: "success",
  },
  {
    id: 4,
    name: "Vehicle Fleet",
    category: "Vehicles",
    value: "$380,000",
    condition: "Good",
    utilization: "76%", 
    theme: "warning",
  },
  {
    id: 5,
    name: "Manufacturing Equipment",
    category: "Equipment",
    value: "$320,000",
    condition: "Fair",
    utilization: "82%",
    theme: "orange",
  },
];