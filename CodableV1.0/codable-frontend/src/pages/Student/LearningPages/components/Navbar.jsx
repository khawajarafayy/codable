import { Code2, Home, TrendingUp, Dumbbell, Terminal, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { getInitialsFromName } from '../../../../utils/profileImage';

export function Navbar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Get user's display name and initials
  const userName = user?.name || user?.email?.split('@')[0] || 'User';
  const userInitials = getInitialsFromName(userName);
  const profileImage = user?.profileImage || user?.avatar || "";

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white">Codable</span>
          </div>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            <NavItem icon={Home} label="Dashboard" active />
            <NavItem icon={TrendingUp} label="Progress" />
            <NavItem icon={Dumbbell} label="Practice" />
            <NavItem icon={Terminal} label="Compiler" />
            <NavItem icon={User} label="Profile" />
          </div>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:bg-gray-800 rounded-full pr-3 pl-1 py-1 transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profileImage} alt={userName} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <span className="text-gray-300 hidden sm:block">{userName}</span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800">
              <DropdownMenuLabel className="text-gray-300">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />

              <DropdownMenuItem className="text-gray-300 focus:bg-gray-800 focus:text-white">
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-300 focus:bg-gray-800 focus:text-white">
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-300 focus:bg-gray-800 focus:text-white">
                Preferences
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-800" />

              <DropdownMenuItem 
                className="text-red-400 focus:bg-gray-800 focus:text-red-400 cursor-pointer"
                onClick={handleLogout}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

function NavItem({ icon: Icon, label, active = false }) {
  return (
    <button
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-purple-900/50 text-purple-300'
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
