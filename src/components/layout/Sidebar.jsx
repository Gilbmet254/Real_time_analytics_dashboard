import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Activity, BarChart3, AlertTriangle, Search, Zap, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { path: "/", label: "Dashboard", icon: Activity },
  { path: "/pipeline", label: "Pipeline", icon: Zap },
  { path: "/anomalies", label: "Anomalies", icon: AlertTriangle },
  { path: "/explorer", label: "Explorer", icon: Search },
];

export default function Sidebar() {
  const location = useLocation();

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 lg:w-56 bg-[hsl(220,18%,5%)] border-r border-border flex flex-col z-50">
      <div className="h-16 flex items-center px-3 lg:px-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
        </div>
        <span className="hidden lg:block ml-3 font-semibold text-sm tracking-tight text-foreground">
          StreamPulse
        </span>
      </div>

      <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-2.5 lg:px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-400" : ""}`} />
              <span className="hidden lg:block">{item.label}</span>
              {isActive && (
                <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 lg:p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-2.5 lg:px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden lg:block">Log out</span>
        </button>
      </div>
    </aside>
  );
}