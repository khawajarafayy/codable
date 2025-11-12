import { ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import codableLogo from "../../../assets/codable-logo.png";

const IDENavbar = () => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[#141622] border-b border-gray-800 backdrop-blur-sm">
      {/* Left - Back Button */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Center - Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="bg-cyan-500/20 p-2 rounded-lg">
          <img
            src={codableLogo}
            alt="Codable Logo"
            className="w-6 h-6 object-contain"
          />
        </div>
        <h1 className="text-xl font-bold text-white">Codable IDE</h1>
      </div>

      {/* Right - Profile */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
          <User size={18} className="text-white" />
        </div>
      </div>
    </header>
  );
};

export default IDENavbar;