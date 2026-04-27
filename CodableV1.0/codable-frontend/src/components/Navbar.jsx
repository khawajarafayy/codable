import codableLogo from "../assets/codable-logo.png"
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-6 py-2 backdrop-blur-md bg-black/30">
      <div className="flex items-center space-x-2">
        <div className="p-2">
          <img
            src={codableLogo}
            alt="Logo"
            className="w-8 h-8 object-contain"
          />
        </div>
        <span className="text-xl font-bold text-white">Codable - Code Learning Platform</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Placeholder for future top-right items */}
      </div>
    </header>
  );
}

export default Navbar;
