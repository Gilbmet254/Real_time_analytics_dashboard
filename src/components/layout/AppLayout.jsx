import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import AnomalyAlertToast from "@/components/AnomalyAlertToast";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-16 lg:ml-56 min-h-screen">
        <Outlet />
      </main>
      <AnomalyAlertToast />
    </div>
  );
}