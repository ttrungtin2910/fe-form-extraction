import React, { useMemo } from "react";
import Card from "components/card";
import PieChart from "components/charts/PieChart";
import { MdDescription, MdPictureAsPdf, MdImage, MdFolder } from "react-icons/md";

const DocumentTypeDistribution = ({ data, loading }) => {
  // Process status data for chart
  const { chartData, chartOptions, statusDetails, totalCount } = useMemo(() => {
    if (!data || !data.byStatus) {
      return {
        chartData: [],
        chartOptions: {},
        statusDetails: [],
        totalCount: 0,
      };
    }

    const statuses = data.byStatus;
    const total = statuses.reduce((sum, item) => sum + item.count, 0);

    const colors = {
      'Completed': '#10B981',
      'Uploaded': '#3B82F6',
      'Processing': '#F59E0B',
      'Failed': '#EF4444',
    };

    const icons = {
      'Completed': <MdImage className="h-6 w-6" />,
      'Uploaded': <MdPictureAsPdf className="h-6 w-6" />,
      'Processing': <MdDescription className="h-6 w-6" />,
      'Failed': <MdDescription className="h-6 w-6" />,
    };

    const details = statuses.map(item => ({
      type: item.status,
      count: item.count,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0,
      icon: icons[item.status] || <MdDescription className="h-6 w-6" />,
      color: colors[item.status] || '#6B7280',
    }));

    return {
      chartData: statuses.map(item => item.count),
      chartOptions: {
        chart: {
          type: "donut",
          toolbar: {
            show: false,
          },
        },
        labels: statuses.map(item => item.status),
        colors: statuses.map(item => colors[item.status] || '#6B7280'),
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
      },
      statusDetails: details,
      totalCount: total,
    };
  }, [data]);

  return (
    <Card extra="p-6 h-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-navy-700 dark:text-white mb-2">
          Status Distribution
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {loading ? "Loading..." : "Breakdown of images by processing status"}
        </p>
      </div>

      {/* Large Pie Chart */}
      <div className="flex items-center justify-center mb-8">
        <div className="w-64 h-64">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-500"></div>
            </div>
          ) : chartData.length > 0 ? (
            <PieChart options={chartOptions} series={chartData} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Status Details */}
      <div className="space-y-4">
        {statusDetails.map((status, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-navy-700 dark:to-navy-600 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center space-x-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${status.color}20` }}
              >
                <span style={{ color: status.color }}>
                  {status.icon}
                </span>
              </div>
              <div>
                <p className="font-semibold text-navy-700 dark:text-white">
                  {status.type}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {status.count} images
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xl font-bold text-navy-700 dark:text-white">
                {status.percentage}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Card */}
      <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-navy-700 dark:to-navy-600 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Images</p>
            <p className="text-2xl font-bold text-navy-700 dark:text-white">
              {loading ? "..." : totalCount.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {loading ? "..." : `${data?.byFolder?.length || 0} folders`}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DocumentTypeDistribution;