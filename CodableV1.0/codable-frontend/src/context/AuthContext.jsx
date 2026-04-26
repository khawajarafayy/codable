import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/apiClient';
import { extractProfileImageFromStudentProfileResponse } from '../utils/profileImage';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const persistUser = (nextUser) => {
    if (!nextUser) {
      localStorage.removeItem('user');
      return;
    }

    const { token, ...userWithoutToken } = nextUser;
    localStorage.setItem('user', JSON.stringify(userWithoutToken));
  };

  const patchUser = (partialUser) => {
    setUser((prevUser) => {
      const merged = { ...(prevUser || {}), ...partialUser };
      persistUser(merged);
      return merged;
    });
  };

  const setProfileImage = (profileImage) => {
    patchUser({
      profileImage: profileImage || '',
      avatar: profileImage || ''
    });
  };

  const refreshStudentProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const profileResponse = await api.getStudentProfile();
      const profileImage = extractProfileImageFromStudentProfileResponse(profileResponse);
      if (profileImage) {
        setProfileImage(profileImage);
      }
    } catch {
      // Profile endpoint can fail for non-student routes; ignore safely.
    }
  };

  // Check for existing token and user data on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token) {
      setIsAuthenticated(true);
      try {
        const userData = storedUser ? JSON.parse(storedUser) : { token };
        setUser({ ...userData, token });
        setUserRole(userData?.role || "student"); // Default to student if role missing
      } catch {
        setUser({ token });
        setUserRole("student");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshStudentProfile();
  }, [isAuthenticated]);

  const login = (token, userData = {}) => {
    const role = userData?.role || "student"; // Default to student if not provided
    localStorage.setItem('token', token);
    const normalizedUser = {
      ...userData,
      profileImage: userData?.profileImage || userData?.avatar || ''
    };
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser({ token, ...normalizedUser });
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUserRole(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    userRole,
    isAuthenticated,
    isLoading,
    login,
    logout,
    patchUser,
    setProfileImage,
    refreshStudentProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
