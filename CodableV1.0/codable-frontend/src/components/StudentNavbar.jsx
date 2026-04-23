import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Users, Code, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CodableLogo from '../assets/codable-logo.png';

const StudentNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const modules = [
    { name: 'Modules', path: '/', icon: BookOpen },
    { name: 'Learning', path: '/student/dashboard', icon: BookOpen },
    { name: 'Classroom', path: '/classroom', icon: Users },
    { name: 'Workspace', path: '/workspace', icon: Code },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#141622]/60 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="p-1">
              <img src={CodableLogo} alt="Codable" className="w-6 h-8 object-contain" />
            </div>
            <span className="text-sm font-semibold text-white hidden sm:inline">Codable</span>
          </button>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {modules.map((module) => {
              const isActive = location.pathname === module.path;
              return (
                <button
                  key={module.path}
                  onClick={() => navigate(module.path)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {module.name}
                </button>
              );
            })}
          </div>

          {/* Mobile Menu (simplified) */}
          <div className="md:hidden flex items-center gap-2">
            <div className="flex gap-1">
              {modules.slice(1).map((module) => {
                const isActive = location.pathname === module.path;
                const Icon = module.icon;
                return (
                  <button
                    key={module.path}
                    onClick={() => navigate(module.path)}
                    className={`p-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title={module.name}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default StudentNavbar;
