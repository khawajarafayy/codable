import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleProtectedRoute = ({ children, allowedRoles = [], redirectIfUnauthorized = null }) => {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const location = useLocation();

  // Debug logging
  console.log("RoleProtectedRoute Debug:", {
    path: location.pathname,
    isAuthenticated,
    isLoading,
    userRole,
    allowedRoles,
    hasAccess: allowedRoles.length === 0 || allowedRoles.includes(userRole)
  });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1428]">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.warn("Access Denied - User role mismatch:", { userRole, allowedRoles, redirectTo: redirectIfUnauthorized });
    
    // If a redirect path is provided for unauthorized users, use it
    if (redirectIfUnauthorized) {
      return <Navigate to={redirectIfUnauthorized} replace />;
    }

    // Otherwise show access denied message
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1428]">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page</p>
          <p className="text-gray-500 text-sm mt-2">Your role: <span className="text-cyan-400">{userRole || 'undefined'}</span></p>
          <p className="text-gray-500 text-sm">Required role: <span className="text-cyan-400">{allowedRoles.join(', ')}</span></p>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleProtectedRoute;
