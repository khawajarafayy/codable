import { Home, TrendingUp, Dumbbell, Terminal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import codableLogo from "../../../../assets/codable-logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { getInitialsFromName } from "../../../../utils/profileImage";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  // Get user's display name
  const userName = user?.name || user?.email?.split('@')[0] || 'User';
  const userInitials = getInitialsFromName(userName);
  const profileImage = user?.profileImage || user?.avatar || "";

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: Home, path: "/student/dashboard" },
    { key: "progress", label: "Progress", icon: TrendingUp, path: "/student/profile-and-analytics" },
    { key: "compiler", label: "Compiler", icon: Terminal, path: "/workspace" }
  ];

  const isActive = (path) => {
    if (path === "/student") {
      return location.pathname === "/student" || location.pathname === "/dashboard";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const baseBtn = "px-3 py-2 text-sm rounded flex items-center gap-3 transition-colors focus:outline-none focus:ring-2";

  return (
    <nav className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center p-1">
              <img
                src={codableLogo}
                alt="Codable Logo"
                className="w-6 h-6 object-contain"
                draggable="false"
              />
            </div>
            <span className="text-white font-semibold">Codable</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  className={`${baseBtn} ${
                    active
                      ? "bg-gray-800 text-white rounded-lg mx-1 ring-1 ring-cyan-100"
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-gray-300"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profileImage} alt={userName} />
                    <AvatarFallback className="bg-cyan-700 text-white text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-gray-300 hidden sm:block">{userName}</span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800">
                <DropdownMenuItem
                  className="text-gray-300 focus:bg-gray-800 focus:text-white cursor-pointer"
                  onClick={() => navigate("/student/profile-and-analytics")}
                >
                  Profile & Analytics
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-800" />

                <DropdownMenuItem
                  className="text-gray-300 focus:bg-gray-800 focus:text-white cursor-pointer"
                  onClick={() => navigate("/account-settings")}
                >
                  Profile Settings
                </DropdownMenuItem>

                {/* <DropdownMenuItem
                  className="text-gray-300 focus:bg-gray-800 focus:text-white cursor-pointer"
                  onClick={() => navigate("/billing")}
                >
                  Billing
                </DropdownMenuItem> */}

              

                <DropdownMenuSeparator className="bg-gray-800" />

                <DropdownMenuItem
                  className="text-red-400 focus:bg-gray-800 focus:text-red-400 cursor-pointer"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}