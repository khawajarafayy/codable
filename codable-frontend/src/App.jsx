import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SplashScreen from "./components/splashScreen";
import RoleSelectionDashboard from "./pages/Dashboard/RoleSelectionDashboard";
import Workspace from "./pages/Workspace/Workspace";
import LoginPage from "./pages/Auth/Login";
import SignupPage from "./pages/Auth/SignUp";
import StudentLandingPage from "./pages/Student/LandingDashboard/LearningDashboard";
import StudentLearningPage from "./pages/Student/LearningPages/LearningPage";
import ProfileAndAnalytics from "./pages/Student/ProfileAndAnalytics/ProfileAndAnalytics";
import MentorDashboard from "./pages/Mentor/MentorLandingDB/MentorDashboard";

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    return !hasSeenSplash;
  });

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('hasSeenSplash', 'true');
      }, 10000); 

      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelectionDashboard />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/student" element={<StudentLandingPage />} />
        <Route path="/student/learning" element={<StudentLearningPage />} />
        <Route path="/student/profile-and-analytics" element={<ProfileAndAnalytics />} />
        <Route path="/mentor" element={<MentorDashboard />} />
      </Routes>
    </Router>
  );
}