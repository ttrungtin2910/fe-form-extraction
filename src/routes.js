import React from "react";

// Admin Imports
import Dashboard from "views/admin/dashboard";
import ImageManagement from "views/admin/imagemanagement";
import Synchronization from "views/admin/Synchronization";

// Icon Imports
import { MdSync } from "react-icons/md";
import { IoIosDocument } from "react-icons/io";
import { MdDashboard } from "react-icons/md";

const routes = [
  {
    name: "Dashboard",
    layout: "/admin",
    path: "dashboard",
    icon: <MdDashboard className="h-6 w-6" />,
    component: <Dashboard />,
  },
  {
    name: "Image Management",
    layout: "/admin",
    path: "imagemanagement",
    icon: <IoIosDocument className="h-6 w-6" />,
    component: <ImageManagement />,
  },
  {
    name: "Synchronization",
    layout: "/admin",
    path: "synchronization",
    icon: <MdSync className="h-6 w-6" />,
    component: <Synchronization />,
  },
  // {
  //   name: "Main Dashboard",
  //   layout: "/admin",
  //   path: "default",
  //   icon: <MdHome className="h-6 w-6" />,
  //   component: <MainDashboard />,
  // },
  // {
  //   name: "NFT Marketplace",
  //   layout: "/admin",
  //   path: "nft-marketplace",
  //   icon: <MdOutlineShoppingCart className="h-6 w-6" />,
  //   component: <NFTMarketplace />,
  //   secondary: true,
  // },
  // {
  //   name: "Data Tables",
  //   layout: "/admin",
  //   icon: <MdBarChart className="h-6 w-6" />,
  //   path: "data-tables",
  //   component: <DataTables />,
  // },
  // {
  //   name: "Profile",
  //   layout: "/admin",
  //   path: "profile",
  //   icon: <MdPerson className="h-6 w-6" />,
  //   component: <Profile />,
  // },
  // {
  //   name: "RTL Admin",
  //   layout: "/rtl",
  //   path: "rtl",
  //   icon: <MdHome className="h-6 w-6" />,
  //   component: <RTLDefault />,
  // },
];
export default routes;
