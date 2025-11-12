import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoleSelectionDashboard from "./pages/Dashboard/RoleSelectionDashboard";
import Workspace from "./pages/Workspace/Workspace";
import LoginPage from "./pages/Auth/Login";
import SignupPage from "./pages/Auth/SignUp";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelectionDashboard/>} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </Router>
  );
}

export default App;
