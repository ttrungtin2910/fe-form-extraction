import React, { useMemo } from "react";
import Card from "components/card";
import LineChart from "components/charts/LineChart";
import { MdTrendingUp, MdTrendingDown } from "react-icons/md";

const FormProcessingChart = ({ data, loading }) => {
  // Process date data for chart
  const chartData = useMemo(() => {
    if (!data || !data.byDate) {
      return [
        { name: "Total", data: [] },
      ];
    }

    // Get last 12 data points or all if less
    const dateData = data.byDate.slice(-12);
    
    return [
      {
        name: "Images",
        data: dateData.map(item => item.count),
      },
    ];
  }, [data]);

  const chartOptions = {
    chart: {
      type: "area",
      toolbar: {
        show: false,
      },
      dropShadow: {
        enabled: true,
        top: 2,
        left: 0,
        blur: 4,
        opacity: 0.1,
      },
    },
    colors: ["#4318FF", "#6AD2FF", "#FF6B6B"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: data && data.byDate ? data.byDate.slice(-12).map(item => {
        // Format date YYYYMMDD to readable format
        const dateStr = item.date;
        if (dateStr && dateStr.length === 8) {
          return `${dateStr.slice(4,6)}/${dateStr.slice(6,8)}`;
        }
        return dateStr;
      }) : [],
      labels: {
        style: {
          colors: "#A3AED0",
          fontSize: "13px",
          fontWeight: "500",
        },
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
          fontSize: "13px",
          fontWeight: "500",
        },
      },
    },
    grid: {
      show: true,
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
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
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontSize: "13px",
      fontWeight: "500",
      labels: {
        colors: "#A3AED0",
      },
    },
  };

  const stats = useMemo(() => {
    if (!data || !data.summary) {
      return [
        { label: "Total Images", value: "0", change: "-", isPositive: true, color: "#4318FF" },
        { label: "Success Rate", value: "0%", change: "-", isPositive: true, color: "#6AD2FF" },
        { label: "Total Size", value: "0 MB", change: "-", isPositive: true, color: "#FF6B6B" },
      ];
    }

    const summary = data.summary;
    const successRate = summary.totalImages > 0 
      ? ((summary.completed / summary.totalImages) * 100).toFixed(1) 
      : 0;

    return [
      {
        label: "Total Images",
        value: summary.totalImages.toLocaleString(),
        change: `${summary.completed} completed`,
        isPositive: true,
        color: "#4318FF",
      },
      {
        label: "Success Rate",
        value: `${successRate}%`,
        change: `${summary.failed} failed`,
        isPositive: summary.failed === 0,
        color: "#6AD2FF",
      },
      {
        label: "Total Size",
        value: `${summary.totalSize.toFixed(1)} MB`,
        change: `Avg: ${summary.avgSize.toFixed(2)} MB`,
        isPositive: true,
        color: "#FF6B6B",
      },
    ];
  }, [data]);

  return (
    <Card extra="p-6 h-full">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-navy-700 dark:text-white mb-3">
            Form Processing Overview
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {loading ? "Loading..." : "Trends for all images across all folders"}
          </p>
        </div>
        
        <div className="flex gap-6 mt-6 lg:mt-0">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div 
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: stat.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-xl font-bold text-navy-700 dark:text-white mr-3">
                  {stat.value}
                </span>
                <div className="flex items-center text-sm">
                  {stat.isPositive ? (
                    <MdTrendingUp className="text-green-500 mr-1" />
                  ) : (
                    <MdTrendingDown className="text-red-500 mr-1" />
                  )}
                  <span className={stat.isPositive ? "text-green-500" : "text-red-500"}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[450px] w-full">
        <LineChart options={chartOptions} series={chartData} />
      </div>
    </Card>
  );
};

export default FormProcessingChart; 