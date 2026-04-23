import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
} from "lucide-react";

export default function MentorRoot() {
  const location = useLocation();

  // Extract base path - could be /mentor or /instructor
  const getBasePath = () => {
    if (location.pathname.startsWith("/instructor")) {
      return "/instructor";
    }
    return "/mentor";
  };

  const basePath = getBasePath();

  const isActive = (relativePath) => {
    if (relativePath === "") {
      return location.pathname === basePath || location.pathname === basePath + "/";
    }
    return location.pathname === `${basePath}/${relativePath}` || 
           location.pathname === `${basePath}/${relativePath}/`;
  };

  const navItems = [
    { path: "", label: "Dashboard", icon: LayoutDashboard },
    { path: "classes", label: "Classes", icon: Users },
    { path: "assignments", label: "Assignments", icon: FileText },
    { path: "reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1428] via-[#0F1B2D] to-[#040B1D] font-[Inter]">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A1428]/50 border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-[#fdfdff] tracking-tight">
                Code<span className="text-blue-400">Learn</span>
              </h1>

              <div className="flex items-center gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  const fullPath = item.path === "" ? basePath : `${basePath}/${item.path}`;

                  return (
                    <Link
                      key={item.path}
                      to={fullPath}
                      className={`
                        relative px-4 py-2 rounded-xl transition-all duration-300
                        ${
                          active
                            ? "bg-blue-500/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                            : "text-[#fdfdff]/70 hover:text-[#fdfdff] hover:bg-white/5"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </div>

                      {active && (
                        <div className="absolute inset-0 rounded-xl border border-blue-500/30 pointer-events-none" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-semibold text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]">
              AI
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
