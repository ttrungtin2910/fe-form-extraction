import React from "react";

// Admin Imports
import Dashboard from "views/admin/default";
import ImageManagement from "views/admin/imagemanagement";
import Synchronization from "views/admin/Synchronization";
import Settings from "views/admin/Settings";

// Auth Imports
import SignIn from "views/auth/SignIn";

// Icon Imports
import { MdSync } from "react-icons/md";
import { IoIosDocument } from "react-icons/io";
import { MdDashboard } from "react-icons/md";
import { CogIcon } from "@heroicons/react/24/solid";

const routes = [
  {
    name: "Tổng quan",
    layout: "/admin",
    path: "dashboard",
    icon: <MdDashboard className="h-6 w-6" />,
    component: <Dashboard />,
  },
  {
    name: "Quản lý hình ảnh",
    layout: "/admin",
    path: "imagemanagement",
    icon: <IoIosDocument className="h-6 w-6" />,
    component: <ImageManagement />,
  },
  {
    name: "Đồng bộ hóa",
    layout: "/admin",
    path: "synchronization",
    icon: <MdSync className="h-6 w-6" />,
    component: <Synchronization />,
  },
  {
    name: "Cài đặt",
    layout: "/admin",
    path: "settings",
    icon: <CogIcon className="h-6 w-6" />,
    component: <Settings />,
    hidden: true, // Don't show in sidebar - accessible via button in dashboard
  },
  // Hidden routes (not shown in sidebar)
  {
    name: "Đăng nhập",
    layout: "/auth",
    path: "sign-in",
    component: <SignIn />,
    hidden: true, // Don't show in sidebar
  },
];
export default routes;
