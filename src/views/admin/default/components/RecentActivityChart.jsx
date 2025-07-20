import React from "react";
import Card from "components/card";
import { MdUpload, MdCheckCircle, MdError, MdSchedule } from "react-icons/md";

const RecentActivityChart = () => {
  const recentActivities = [
    {
      id: 1,
      type: "upload",
      document: "invoice_2024_001.pdf",
      status: "completed",
      time: "2 minutes ago",
      icon: <MdUpload className="h-5 w-5" />,
      color: "#4318FF",
      bgColor: "#4318FF20",
    },
    {
      id: 2,
      type: "processing",
      document: "receipt_jan_15.jpg",
      status: "completed",
      time: "5 minutes ago",
      icon: <MdCheckCircle className="h-5 w-5" />,
      color: "#10B981",
      bgColor: "#10B98120",
    },
    {
      id: 3,
      type: "processing",
      document: "form_application.pdf",
      status: "pending",
      time: "8 minutes ago",
      icon: <MdSchedule className="h-5 w-5" />,
      color: "#F59E0B",
      bgColor: "#F59E0B20",
    },
    {
      id: 4,
      type: "processing",
      document: "contract_draft.docx",
      status: "failed",
      time: "12 minutes ago",
      icon: <MdError className="h-5 w-5" />,
      color: "#EF4444",
      bgColor: "#EF444420",
    },
    {
      id: 5,
      type: "upload",
      document: "expense_report.xlsx",
      status: "completed",
      time: "15 minutes ago",
      icon: <MdUpload className="h-5 w-5" />,
      color: "#4318FF",
      bgColor: "#4318FF20",
    },
    {
      id: 6,
      type: "processing",
      document: "scan_document.pdf",
      status: "completed",
      time: "18 minutes ago",
      icon: <MdCheckCircle className="h-5 w-5" />,
      color: "#10B981",
      bgColor: "#10B98120",
    },
  ];

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Processing";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "pending":
        return "text-yellow-500";
      case "failed":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const stats = {
    today: 45,
    thisWeek: 234,
    thisMonth: 1247,
    avgTime: "2.3s",
  };

  return (
    <Card extra="p-6 h-full">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-navy-700 dark:text-white mb-3">
          Recent Activity
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Latest document processing activities
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-navy-700 dark:to-navy-600 rounded-xl p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Today</p>
          <p className="text-2xl font-bold text-navy-700 dark:text-white">
            {stats.today}
          </p>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-navy-700 dark:to-navy-600 rounded-xl p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">This Week</p>
          <p className="text-2xl font-bold text-navy-700 dark:text-white">
            {stats.thisWeek}
          </p>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4 mb-8">
        {recentActivities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-navy-700 transition-all duration-300"
          >
            {/* Icon */}
            <div
              className="flex-shrink-0 p-3 rounded-xl"
              style={{ backgroundColor: activity.bgColor }}
            >
              <span style={{ color: activity.color }}>
                {activity.icon}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">
                  {activity.document}
                </p>
                <span className={`text-xs font-medium ${getStatusColor(activity.status)}`}>
                  {getStatusText(activity.status)}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-navy-700 dark:to-navy-600 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total This Month</p>
            <p className="text-2xl font-bold text-navy-700 dark:text-white">
              {stats.thisMonth}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-500 font-medium">+12.5%</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">vs last month</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RecentActivityChart; 