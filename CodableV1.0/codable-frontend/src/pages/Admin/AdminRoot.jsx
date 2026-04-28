import { Link, Outlet, useLocation } from "react-router";
import { LayoutDashboard, Users, GraduationCap, Search } from "lucide-react";

export default function AdminRoot() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/codable-admin") {
      return location.pathname === "/codable-admin";
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: "/codable-admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/codable-admin/students", label: "Students", icon: Users },
    { path: "/codable-admin/instructors", label: "Instructors", icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen bg-[#0A0D14] font-[Inter]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0F1419] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold text-[#fdfdff] tracking-tight">
            Codable<span className="text-blue-400"> Admin</span>
          </h1>
          <p className="text-xs text-[#fdfdff]/40 mt-1">Platform Management</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${
                      active
                        ? "bg-blue-500/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                        : "text-[#fdfdff]/60 hover:text-[#fdfdff] hover:bg-white/5"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {active && <div className="ml-auto w-1 h-6 rounded-full bg-blue-400" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-semibold text-white">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#fdfdff] truncate">Admin User</p>
              <p className="text-xs text-[#fdfdff]/40 truncate">admin@codable.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-16 bg-[#0F1419]/80 backdrop-blur-xl border-b border-white/5">
          <div className="h-full px-6 flex items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fdfdff]/40" />
                <input
                  type="text"
                  placeholder="Search students, instructors, classes..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-[#fdfdff] placeholder:text-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Admin Profile Avatar */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-semibold text-white shadow-lg">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
