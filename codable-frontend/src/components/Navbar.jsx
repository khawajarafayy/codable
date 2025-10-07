import codableLogo from "../assets/codable-logo.png"

function Navbar() {
  return (
    <header className="flex items-center justify-between px-6 py-2 backdrop-blur-md bg-black/30">
      <div className="flex items-center space-x-2">
        <div className="bg-primary p-2 rounded-full">
          <img
          src={codableLogo}
          alt="Logo"
          className="w-8 h-8 object-contain"
          />
        </div>
        <span className="text-xl font-bold text-white">Codable - Code Learning Platform</span>
      </div>

      {/* Profile */}
      <img
        src="https://i.pravatar.cc/90"
        alt="Profile"
        className="w-10 h-10 rounded-full border-2 border-white"
      />
    </header>
  );
}

export default Navbar;
