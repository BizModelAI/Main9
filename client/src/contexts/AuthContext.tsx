import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_ROUTES, apiGet, apiPost, apiPut, apiDelete, ApiError } from '../utils/apiClient';
import { QuizData } from "../types";

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  isTemporary?: boolean;
  isPaid?: boolean;
  name?: string; // Add name property for display
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    quizData?: any,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  getLatestQuizData: () => Promise<QuizData | null>;
  hasValidSession: () => boolean;
  verifyAndRefreshAuth: () => Promise<boolean>;
  forceLogout: () => void;
  isRealUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkExistingSession = async () => {
      try {
        let response: Response;

        // Use XMLHttpRequest first to avoid FullStory interference
        try {
          console.log(
            "Session check: Using XMLHttpRequest to avoid FullStory issues",
          );

          const xhr = new XMLHttpRequest();
          console.log("Making XMLHttpRequest to /api/auth/me");
          xhr.open("GET", "/api/auth/me?t=" + Date.now(), true);
          xhr.withCredentials = true;
          xhr.setRequestHeader("Content-Type", "application/json");

          response = await new Promise<Response>((resolve, reject) => {
            xhr.onload = () => {
              const responseText = xhr.responseText;
              console.log("Auth API response:", xhr.status, responseText);
              resolve({
                ok: xhr.status >= 200 && xhr.status < 300,
                status: xhr.status,
                statusText: xhr.statusText,
                json: () => {
                  try {
                    return Promise.resolve(JSON.parse(responseText));
                  } catch (e) {
                    return Promise.reject(new Error("Invalid JSON response"));
                  }
                },
                text: () => Promise.resolve(responseText),
                headers: new Headers(),
                url: "/api/auth/me",
                redirected: false,
                type: "basic",
                clone: () => response,
                body: null,
                bodyUsed: false,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
                blob: () => Promise.resolve(new Blob()),
                formData: () => Promise.resolve(new FormData()),
              } as Response);
            };
            xhr.onerror = () =>
              reject(new Error("XMLHttpRequest network error"));
            xhr.ontimeout = () => reject(new Error("XMLHttpRequest timeout"));
            xhr.timeout = 10000; // 10 second timeout
            xhr.send();
          });
        } catch (xhrError) {
          console.log(
            "Session check: XMLHttpRequest failed, trying fetch fallback",
          );

          // Fallback to fetch
          try {
            response = await fetch("/api/auth/me", {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            });
          } catch (fetchError) {
            console.error(
              "Session check: Both XMLHttpRequest and fetch failed:",
              {
                xhrError,
                fetchError,
              },
            );
            throw new Error("All request methods failed");
          }
        }

        if (!isMounted) return; // Component unmounted, don't update state

        if (response.ok) {
          const userData = await response.json();
          setUser({
            ...userData,
            name: userData.firstName || userData.lastName
              ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
              : userData.username || userData.email,
          });
        } else if (response.status === 401) {
          // Not authenticated - this is expected, not an error
          setUser(null);
        } else {
          console.warn(`Session check returned ${response.status}`);
        }
      } catch (error) {
        if (!isMounted) return; // Component unmounted, don't update state
        console.error("Error checking session:", error);
        // Don't throw the error, just log it and continue
        setUser(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Check for existing session on mount
    checkExistingSession();

    return () => {
      isMounted = false; // Cleanup function to prevent state updates after unmount
    };
  }, []);

  const checkSession = async (): Promise<boolean> => {
    try {
      // Try XMLHttpRequest first for better error handling
      const xhr = new XMLHttpRequest();
      xhr.open('GET', API_ROUTES.AUTH_ME, false); // Synchronous for session check
      xhr.withCredentials = true;
      xhr.send();

      if (xhr.status === 200) {
        try {
          const userData = JSON.parse(xhr.responseText);
          setUser(userData);
          setIsAuthenticated(true);
          return true;
        } catch (parseError) {
          console.error("Error parsing user data:", parseError);
          return false;
        }
      } else {
        // If XHR fails, try fetch as fallback
        try {
          const response = await apiGet(API_ROUTES.AUTH_ME);
          setUser(response);
          setIsAuthenticated(true);
          return true;
        } catch (fetchError) {
          console.error("Error checking session:", fetchError);
          return false;
        }
      }
    } catch (xhrError) {
      // Fallback to fetch if XHR fails
      try {
        const response = await apiGet(API_ROUTES.AUTH_ME);
        setUser(response);
        setIsAuthenticated(true);
        return true;
      } catch (fetchError) {
        console.error("Error checking session:", fetchError);
        return false;
      }
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiPost(API_ROUTES.AUTH_LOGIN, { email, password });
      // The backend returns user data directly, not wrapped in a user object
      setUser(response);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message || "Login failed" };
    }
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiPost(API_ROUTES.AUTH_SIGNUP, {
        email,
        password,
        firstName,
        lastName,
      });
      // The backend returns user data directly, not wrapped in a user object
      setUser(response);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error: any) {
      console.error("Signup error:", error);
      return { success: false, error: error.message || "Signup failed" };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiPost(API_ROUTES.AUTH_LOGOUT, {});
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const forceLogout = () => {
    console.log("ForceLogout: Clearing user state due to session mismatch");
    setUser(null);
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiDelete(API_ROUTES.AUTH_ACCOUNT);
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (parseError) {
      console.error("Error parsing delete account response:", parseError);
      return { success: false, error: "Invalid response format" };
    }
  };

  const updateProfile = async (updates: { firstName?: string; lastName?: string; email?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiPut(API_ROUTES.AUTH_PROFILE, updates);
      // The backend returns user data directly, not wrapped in a user object
      setUser(response);
      return { success: true };
    } catch (error: any) {
      console.error("Profile update error:", error);
      return { success: false, error: error.message || "Profile update failed" };
    }
  };

  const getLatestQuizData = async (): Promise<any> => {
    try {
      const response = await apiGet(API_ROUTES.AUTH_LATEST_QUIZ_DATA);
      return response;
    } catch (error) {
      console.error("getLatestQuizData: Network error:", error);
      throw error;
    }
  };

  const hasValidSession = (): boolean => {
    return !!user;
  };

  const verifyAndRefreshAuth = async (): Promise<boolean> => {
    try {
      const response = await apiGet(API_ROUTES.AUTH_ME);
      setUser(response);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("verifyAndRefreshAuth: Error:", error);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  };

  const isRealUser = !!user && !user.isTemporary;

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    deleteAccount,
    updateProfile,
    getLatestQuizData,
    hasValidSession,
    verifyAndRefreshAuth,
    forceLogout,
    isRealUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
