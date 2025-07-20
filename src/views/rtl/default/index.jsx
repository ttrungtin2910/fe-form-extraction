import MiniCalendar from "components/calendar/MiniCalendar";
import { IoMdHome } from "react-icons/io";
import { IoDocuments, IoStatsChart } from "react-icons/io5";
import { MdBarChart, MdDashboard, MdUpload, MdCheckCircle, MdError, MdPending } from "react-icons/md";
import { FaFileAlt, FaChartLine, FaChartPie, FaChartBar } from "react-icons/fa";

import { columnsDataCheck, columnsDataComplex } from "./variables/columnsData";

import Widget from "views/rtl/default/components/Widget";
import CheckTable from "views/rtl/default/components/CheckTable";
import ComplexTable from "views/rtl/default/components/ComplexTable";
import tableDataCheck from "./variables/tableDataCheck.json";
import tableDataComplex from "./variables/tableDataComplex.json";

// Import new chart components
import FormProcessingChart from "../../admin/default/components/FormProcessingChart";
import UploadTrendsChart from "../../admin/default/components/UploadTrendsChart";
import DocumentTypeDistribution from "../../admin/default/components/DocumentTypeDistribution";
import ProcessingStatusChart from "../../admin/default/components/ProcessingStatusChart";
import RecentActivityChart from "../../admin/default/components/RecentActivityChart";

const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Header Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Widget
          icon={<MdUpload className="h-8 w-8" />}
          title={"Total Uploads"}
          subtitle={"1,247"}
          trend="+12.5%"
          trendColor="green"
        />
        <Widget
          icon={<MdCheckCircle className="h-8 w-8" />}
          title={"Processed"}
          subtitle={"1,089"}
          trend="+8.2%"
          trendColor="green"
        />
        <Widget
          icon={<MdPending className="h-8 w-8" />}
          title={"Pending"}
          subtitle={"158"}
          trend="-3.1%"
          trendColor="red"
        />
        <Widget
          icon={<MdError className="h-8 w-8" />}
          title={"Failed"}
          subtitle={"23"}
          trend="-15.2%"
          trendColor="green"
        />
      </div>

      {/* Main Charts Section - Better Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Form Processing Overview - Takes 2 columns */}
        <div className="lg:col-span-2">
          <FormProcessingChart />
        </div>
        
        {/* Document Type Distribution - Takes 1 column, larger */}
        <div className="lg:col-span-1">
          <DocumentTypeDistribution />
        </div>
      </div>

      {/* Secondary Charts Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Upload Trends */}
        <UploadTrendsChart />
        
        {/* Processing Status */}
        <ProcessingStatusChart />
      </div>

      {/* Third Row - Activity and Calendar */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Activity - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentActivityChart />
        </div>
        
        {/* Calendar - Takes 1 column */}
        <div className="rounded-[20px] bg-white p-6 shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-navy-700 dark:text-white mb-2">
              Calendar
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Schedule and events
            </p>
          </div>
          <MiniCalendar />
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <CheckTable
          columnsData={columnsDataCheck}
          tableData={tableDataCheck}
        />
        <ComplexTable
          columnsData={columnsDataComplex}
          tableData={tableDataComplex}
        />
      </div>
    </div>
  );
};

export default Dashboard;
