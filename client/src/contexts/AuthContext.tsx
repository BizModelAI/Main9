import React, { createContext, useContext, useState, useEffect } from "react";
import { QuizData } from "../types";

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  isTemporary?: boolean;
  name?: string; // Add name property for display
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    quizData?: any,
  ) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  getLatestQuizData: () => Promise<QuizData | null>;
  hasValidSession: () => boolean;
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

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = "Incorrect username or password";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, use the response status text or default message
          errorMessage = response.statusText || errorMessage;
        }
        const error = new Error(errorMessage) as any;
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      setUser({
        ...data,
        name: data.firstName || data.lastName
          ? `${data.firstName || ''} ${data.lastName || ''}`.trim()
          : data.username || data.email,
      });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    quizData?: any,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password, firstName, lastName, quizData }),
      });

      if (!response.ok) {
        let errorMessage = "Signup failed";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
          console.log("AuthContext signup error response:", {
            status: response.status,
            data,
            errorMessage,
          }); // Debug log
        } catch (parseError) {
          // If JSON parsing fails, use the response status text or default message
          errorMessage = response.statusText || errorMessage;
          console.log("AuthContext signup error (JSON parse failed):", {
            status: response.status,
            errorMessage,
            parseError,
          }); // Debug log
        }

        // Ensure the exact error message is preserved for frontend handling
        const error = new Error(errorMessage) as any;
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      setUser({
        ...data,
        name: data.firstName || data.lastName
          ? `${data.firstName || ''} ${data.lastName || ''}`.trim()
          : data.username || data.email,
      });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  };

  const forceLogout = () => {
    console.log("ForceLogout: Clearing user state due to session mismatch");
    setUser(null);
  };

  const deleteAccount = async (): Promise<void> => {
    if (!user) {
      throw new Error("No user logged in");
    }

    try {
      const response = await fetch("/api/auth/account", {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = "Account deletion failed";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Clear user state after successful deletion
      setUser(null);
    } catch (error) {
      // Handle network errors gracefully (common during page unload)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.debug("Account deletion skipped due to network unavailability");
        // Still clear local state since temporary accounts expire automatically
        setUser(null);
        return;
      }
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) {
      console.log("updateProfile: No user found, aborting");
      throw new Error("No user logged in");
    }

    console.log("updateProfile: Starting with data:", updates);
    console.log("updateProfile: Current user:", {
      id: user.id,
      name: user.name,
      email: user.email,
    });

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        let errorMessage = "Profile update failed";
        let responseText = "";

        try {
          responseText = await response.text();
          console.log("updateProfile: Raw response text:", responseText);

          if (responseText) {
            try {
              const data = JSON.parse(responseText);
              errorMessage = data.error || errorMessage;
              console.error("updateProfile: Server error response:", {
                status: response.status,
                statusText: response.statusText,
                data: data,
                updates: updates,
              });
            } catch (jsonError) {
              console.error("updateProfile: Response is not valid JSON:", {
                status: response.status,
                statusText: response.statusText,
                responseText: responseText,
                jsonError: jsonError,
                updates: updates,
              });
              errorMessage =
                responseText || response.statusText || errorMessage;
            }
          } else {
            console.error("updateProfile: Empty response:", {
              status: response.status,
              statusText: response.statusText,
              updates: updates,
            });
            errorMessage = response.statusText || errorMessage;
          }
        } catch (readError) {
          console.error("updateProfile: Failed to read response:", {
            status: response.status,
            statusText: response.statusText,
            readError: readError,
            updates: updates,
          });
          // Provide more specific error message for common cases
          if (response.status === 401) {
            console.log("updateProfile: 401 error, session expired");
            errorMessage =
              "Your session has expired. Please log in and try again.";
          } else if (response.status === 403) {
            errorMessage = "Permission denied.";
          } else if (response.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          } else {
            errorMessage = response.statusText || errorMessage;
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      setUser({
        ...data,
        name: data.firstName || data.lastName
          ? `${data.firstName || ''} ${data.lastName || ''}`.trim()
          : data.username || data.email,
      });
    } catch (error) {
      // Handle network errors and other fetch failures
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error("updateProfile: Network error:", error);
        throw new Error(
          "Network error. Please check your connection and try again.",
        );
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getLatestQuizData = async (): Promise<QuizData | null> => {
    if (!user) {
      console.log("getLatestQuizData: No user available");
      return null;
    }

    // Don't try to fetch quiz data for temporary users via API
    if (String(user.id).startsWith("temp_")) {
      console.log(
        "getLatestQuizData: Temporary user detected, skipping API call",
      );
      return null;
    }

    // First verify the session is valid by checking auth status using XMLHttpRequest
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", "/api/auth/me?t=" + Date.now(), true);
      xhr.withCredentials = true;
      xhr.setRequestHeader("Content-Type", "application/json");

      const authCheck = await new Promise<{ ok: boolean; status: number }>(
        (resolve, reject) => {
          xhr.onload = () => {
            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
            });
          };
          xhr.onerror = () =>
            reject(new Error("Auth check XMLHttpRequest failed"));
          xhr.timeout = 5000; // 5 second timeout for auth check
          xhr.ontimeout = () => reject(new Error("Auth check timeout"));
          xhr.send();
        },
      );

      if (!authCheck.ok) {
        console.log(
          "getLatestQuizData: Session not valid, user not authenticated",
        );
        return null;
      }
    } catch (error) {
      console.log("getLatestQuizData: Auth check failed:", error);
      return null;
    }

    try {
      const url = "/api/auth/latest-quiz-data";
      console.log("getLatestQuizData: Making request to:", url);
      console.log("getLatestQuizData: Current user:", {
        id: user.id,
        email: user.email,
      });

      let response: Response;

      // Always use XMLHttpRequest to avoid FullStory interference
      try {
        console.log(
          "getLatestQuizData: Using XMLHttpRequest to avoid FullStory issues",
        );

        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.withCredentials = true;
        xhr.setRequestHeader("Content-Type", "application/json");

        response = await Promise.race([
          new Promise<Response>((resolve, reject) => {
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
                url: url,
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
          }),
          // Additional timeout safety net
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Request timeout after 15 seconds")),
              15000,
            ),
          ),
        ]);
      } catch (xhrError) {
        console.log(
          "getLatestQuizData: XMLHttpRequest failed, trying fetch as last resort",
        );

        // Try fetch as last resort
        try {
          response = await fetch(url, {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });
        } catch (fetchError) {
          console.error(
            "getLatestQuizData: Both XMLHttpRequest and fetch failed:",
            {
              xhrError,
              fetchError,
            },
          );
          throw new Error("All request methods failed");
        }
      }

      console.log("getLatestQuizData: Response status:", response.status);
      console.log(
        "getLatestQuizData: Response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      if (response.ok) {
        const quizData = await response.json();
        console.log(
          "getLatestQuizData: Success, quiz data:",
          quizData ? "Found" : "None",
        );
        return quizData;
      } else {
        // For error responses, safely read the body once
        let errorMessage = `HTTP ${response.status} ${response.statusText}`;
        try {
          const responseText = await response.text();
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // If not JSON, use the text as is
            errorMessage = responseText || errorMessage;
          }
        } catch {
          // If can't read body, use status text
        }
        console.error(
          "getLatestQuizData: Request failed:",
          `Status: ${response.status}, StatusText: ${response.statusText}, Error: ${errorMessage}`,
        );
      }
    } catch (error) {
      console.error("getLatestQuizData: Network error:", error);
    }

    return null;
  };

  const hasValidSession = (): boolean => {
    return !!user;
  };

  const verifyAndRefreshAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        console.log("verifyAndRefreshAuth: Session valid, user refreshed");
        return true;
      } else {
        console.log("verifyAndRefreshAuth: Session invalid");
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("verifyAndRefreshAuth: Error:", error);
      setUser(null);
      return false;
    }
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    deleteAccount,
    updateProfile,
    getLatestQuizData,
    hasValidSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
