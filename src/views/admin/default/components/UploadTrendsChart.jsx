import React from "react";
import Card from "components/card";
import BarChart from "components/charts/BarChart";
import { MdCalendarToday, MdTrendingUp } from "react-icons/md";

const UploadTrendsChart = () => {
  const chartData = [
    {
      name: "Uploads",
      data: [24, 32, 18, 45, 38, 52, 67, 58, 72, 85, 78, 92, 88, 95],
    },
  ];

  const chartOptions = {
    chart: {
      type: "bar",
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
    colors: ["#4318FF"],
    plotOptions: {
      bar: {
        borderRadius: 10,
        columnWidth: "65%",
        distributed: false,
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 0,
    },
    xaxis: {
      categories: [
        "1", "2", "3", "4", "5", "6", "7", 
        "8", "9", "10", "11", "12", "13", "14"
      ],
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
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.25,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 0.85,
        stops: [50, 0, 100],
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

  const weeklyStats = {
    total: "1,247",
    average: "89",
    peak: "95",
    growth: "+15.2%",
  };

  return (
    <Card extra="p-6 h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-navy-700 dark:text-white mb-3">
            Daily Upload Trends
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last 14 days upload activity
          </p>
        </div>
        <div className="flex items-center gap-2 text-brand-500">
          <MdCalendarToday className="h-6 w-6" />
          <span className="text-sm font-medium">This Week</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-navy-700 dark:to-navy-600 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Uploads</p>
              <p className="text-2xl font-bold text-navy-700 dark:text-white">
                {weeklyStats.total}
              </p>
            </div>
            <MdTrendingUp className="h-10 w-10 text-brand-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-navy-700 dark:to-navy-600 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Daily Average</p>
              <p className="text-2xl font-bold text-navy-700 dark:text-white">
                {weeklyStats.average}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-500 font-medium">
                {weeklyStats.growth}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[350px] w-full">
        <BarChart chartData={chartData} chartOptions={chartOptions} />
      </div>
    </Card>
  );
};

export default UploadTrendsChart; 