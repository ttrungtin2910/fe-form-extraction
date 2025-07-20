import React from "react";
import Card from "components/card";
import PieChart from "components/charts/PieChart";
import { MdDescription, MdPictureAsPdf, MdImage } from "react-icons/md";

const DocumentTypeDistribution = () => {
  const chartData = [45, 32, 23];
  
  const chartOptions = {
    chart: {
      type: "donut",
      toolbar: {
        show: false,
      },
    },
    labels: ["PDF Documents", "Images", "Other Formats"],
    colors: ["#4318FF", "#6AD2FF", "#FF6B6B"],
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          background: "transparent",
        },
        offsetY: 0,
      },
      stroke: {
        colors: undefined,
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: "bottom",
      fontSize: "14px",
      fontWeight: "500",
      labels: {
        colors: "#A3AED0",
      },
      markers: {
        width: 16,
        height: 16,
        radius: 8,
      },
    },
    tooltip: {
      theme: "dark",
      style: {
        fontSize: "12px",
        fontFamily: undefined,
        backgroundColor: "#000000",
      },
    },
  };

  const documentTypes = [
    {
      type: "PDF Documents",
      count: 561,
      percentage: 45,
      icon: <MdPictureAsPdf className="h-6 w-6" />,
      color: "#4318FF",
      trend: "+8.2%",
    },
    {
      type: "Images",
      count: 399,
      percentage: 32,
      icon: <MdImage className="h-6 w-6" />,
      color: "#6AD2FF",
      trend: "+12.1%",
    },
    {
      type: "Other Formats",
      count: 287,
      percentage: 23,
      icon: <MdDescription className="h-6 w-6" />,
      color: "#FF6B6B",
      trend: "-2.3%",
    },
  ];

  return (
    <Card extra="p-6 h-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-navy-700 dark:text-white mb-2">
          Document Type Distribution
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Breakdown of uploaded document formats
        </p>
      </div>

      {/* Large Pie Chart */}
      <div className="flex items-center justify-center mb-8">
        <div className="w-64 h-64">
          <PieChart options={chartOptions} series={chartData} />
        </div>
      </div>

      {/* Document Type Details */}
      <div className="space-y-4">
        {documentTypes.map((docType, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-navy-700 dark:to-navy-600 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center space-x-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${docType.color}20` }}
              >
                <span style={{ color: docType.color }}>
                  {docType.icon}
                </span>
              </div>
              <div>
                <p className="font-semibold text-navy-700 dark:text-white">
                  {docType.type}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {docType.count} documents
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xl font-bold text-navy-700 dark:text-white">
                {docType.percentage}%
              </p>
              <p className="text-xs text-green-500 font-medium">
                {docType.trend}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Card */}
      <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-navy-700 dark:to-navy-600 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Documents</p>
            <p className="text-2xl font-bold text-navy-700 dark:text-white">
              1,247
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-500 font-medium">+15.3%</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">vs last month</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DocumentTypeDistribution; 