import React from "react";
import Card from "components/card";
import BarChart from "components/charts/BarChart";
import { MdCheckCircle, MdPending, MdError, MdSchedule } from "react-icons/md";

const ProcessingStatusChart = () => {
  const chartData = [
    {
      name: "Completed",
      data: [87],
    },
    {
      name: "Pending",
      data: [13],
    },
    {
      name: "Failed",
      data: [2],
    },
  ];

  const chartOptions = {
    chart: {
      type: "bar",
      stacked: true,
      toolbar: {
        show: false,
      },
    },
    colors: ["#10B981", "#F59E0B", "#EF4444"],
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "70%",
        borderRadius: 10,
        dataLabels: {
          position: "center",
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val + "%";
      },
      style: {
        fontSize: "14px",
        colors: ["#fff"],
        fontWeight: "600",
      },
    },
    stroke: {
      width: 0,
    },
    xaxis: {
      categories: ["Processing Status"],
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#A3AED0",
          fontSize: "14px",
          fontWeight: "500",
        },
      },
    },
    grid: {
      show: false,
    },
    tooltip: {
      theme: "dark",
      style: {
        fontSize: "12px",
        fontFamily: undefined,
        backgroundColor: "#000000",
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
      fontSize: "14px",
      fontWeight: "500",
      labels: {
        colors: "#A3AED0",
      },
    },
  };

  const statusData = [
    {
      status: "Completed",
      count: 1089,
      percentage: 87,
      icon: <MdCheckCircle className="h-6 w-6" />,
      color: "#10B981",
      description: "Successfully processed",
    },
    {
      status: "Pending",
      count: 158,
      percentage: 13,
      icon: <MdPending className="h-6 w-6" />,
      color: "#F59E0B",
      description: "Awaiting processing",
    },
    {
      status: "Failed",
      count: 23,
      percentage: 2,
      icon: <MdError className="h-6 w-6" />,
      color: "#EF4444",
      description: "Processing errors",
    },
  ];

  return (
    <Card extra="p-6 h-full">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-navy-700 dark:text-white mb-3">
          Processing Status
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Current document processing status
        </p>
      </div>

      <div className="h-[250px] w-full mb-8">
        <BarChart chartData={chartData} chartOptions={chartOptions} />
      </div>

      <div className="space-y-5">
        {statusData.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-5 rounded-xl border border-gray-200 dark:border-navy-600 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center space-x-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${item.color}20` }}
              >
                <span style={{ color: item.color }}>
                  {item.icon}
                </span>
              </div>
              <div>
                <p className="font-semibold text-navy-700 dark:text-white">
                  {item.status}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xl font-bold text-navy-700 dark:text-white">
                {item.count}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.percentage}%
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-navy-700 dark:to-navy-600 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MdSchedule className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Avg Processing Time</p>
              <p className="text-xl font-bold text-navy-700 dark:text-white">
                2.3 seconds
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-500 font-medium">-0.5s</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">vs last week</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProcessingStatusChart; 