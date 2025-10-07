import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoleSelectionDashboard from "./pages/Dashboard/RoleSelectionDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelectionDashboard/>} />
      </Routes>
    </Router>
  );
}

export default App;
