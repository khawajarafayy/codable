import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import SplashScreen from "./components/splashScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RoleSelectionDashboard from "./pages/Dashboard/RoleSelectionDashboard";
import ClassroomComingSoon from "./pages/Classroom/ClassroomComingSoon";
import Workspace from "./pages/Workspace/Workspace";
import LoginPage from "./pages/Auth/Login";
import SignupPage from "./pages/Auth/SignUp";
import StudentLandingPage from "./pages/Student/LandingDashboard/LearningDashboard";
import StudentLearningPage from "./pages/Student/LearningPages/LearningPage";
import ProfileAndAnalytics from "./pages/Student/ProfileAndAnalytics/ProfileAndAnalytics";
import MentorRoot from "./pages/Mentor/MentorLandingDB/MentorRoot";
import Dashboard from "./pages/Mentor/MentorLandingDB/components/Dashboard";
import Classes from "./pages/Mentor/MentorLandingDB/components/Classes";
import ClassDetail from "./pages/Mentor/MentorLandingDB/components/ClassDetail";
import Assignments from "./pages/Mentor/MentorLandingDB/components/Assignments";
import Reports from "./pages/Mentor/MentorLandingDB/components/Reports";
import InstructorProfile from "./pages/Mentor/MentorLandingDB/components/InstructorProfile";

// Root route component - Role selection before login
const RootRoute = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // Navigate to login with role in URL params
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1428] via-[#0F1B2D] to-[#040B1D] opacity-100" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-[128px] animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen items-center justify-center py-12 px-4">
        <div className="max-w-4xl w-full text-center">
          {/* Logo/Title */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
              Welcome to Codable
            </h1>
            <p className="text-xl text-gray-300">
              Who are you?
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Student Card */}
            <button
              onClick={() => handleRoleSelect("student")}
              className="group relative h-64 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-xl" />
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/40 transition-colors">
                  <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v12.5A2.25 2.25 0 003.75 18.5h12.5a2.25 2.25 0 002.25-2.25V9.5M10.5 1.5v6h6M10.5 1.5L16.5 7.5" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Student</h2>
                <p className="text-gray-300 text-sm">
                  Learn to code with interactive lessons, challenges, and personalized feedback
                </p>
              </div>
            </button>

            {/* Instructor Card */}
            <button
              onClick={() => handleRoleSelect("instructor")}
              className="group relative h-64 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 rounded-xl" />
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/40 transition-colors">
                  <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Instructor</h2>
                <p className="text-gray-300 text-sm">
                  Create classes, manage students, assign tasks, and track progress
                </p>
              </div>
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-gray-400 text-sm mt-12">
            Don't have an account? You can sign up on the next page
          </p>
        </div>
      </div>
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRoute />} />

      {/* Auth Routes - Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Student Routes - STUDENT ONLY */}
      {/* Module Selection - Entry point for students after login */}
      <Route path="/student" element={
        <RoleProtectedRoute allowedRoles={["student"]}>
          <RoleSelectionDashboard />
        </RoleProtectedRoute>
      } />

      {/* Learning Module Dashboard */}
      <Route path="/student/dashboard" element={
        <RoleProtectedRoute allowedRoles={["student"]}>
          <StudentLandingPage />
        </RoleProtectedRoute>
      } />

      {/* Learning Page */}
      <Route path="/student/learning" element={
        <RoleProtectedRoute allowedRoles={["student"]}>
          <StudentLearningPage />
        </RoleProtectedRoute>
      } />

      {/* Profile and Analytics */}
      <Route path="/student/profile-and-analytics" element={
        <RoleProtectedRoute allowedRoles={["student"]}>
          <ProfileAndAnalytics />
        </RoleProtectedRoute>
      } />

      {/* Classroom Route - STUDENT ONLY */}
      <Route path="/classroom" element={
        <RoleProtectedRoute allowedRoles={["student"]}>
          <ClassroomComingSoon />
        </RoleProtectedRoute>
      } />

      {/* Workspace Route - STUDENT ONLY */}
      <Route path="/workspace" element={
        <RoleProtectedRoute allowedRoles={["student"]}>
          <Workspace />
        </RoleProtectedRoute>
      } />

      {/* Instructor Routes - INSTRUCTOR ONLY */}
      <Route path="/instructor" element={
        <RoleProtectedRoute allowedRoles={["instructor"]}>
          <MentorRoot />
        </RoleProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<InstructorProfile />} />
        <Route path="classes" element={<Classes />} />
        <Route path="classes/:classId" element={<ClassDetail />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Backward Compatibility Route */}
      <Route path="/mentor" element={
        <RoleProtectedRoute allowedRoles={["instructor"]}>
          <MentorRoot />
        </RoleProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<InstructorProfile />} />
        <Route path="classes" element={<Classes />} />
        <Route path="classes/:classId" element={<ClassDetail />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}

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
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}