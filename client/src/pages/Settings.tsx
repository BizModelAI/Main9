import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  User,
  Mail,
  Save,
  AlertCircle,
  CheckCircle,
  Bell,
  Trash2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Settings: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get("tab") || "profile";
  });
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
  });
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    marketingEmails: true,
  });
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync form data when user data changes
  useEffect(() => {
    console.log("Settings: User data changed:", user);
    if (user) {
      const newFormData = {
        firstName: user?.name?.split(" ")[0] || "",
        lastName: user?.name?.split(" ").slice(1).join(" ") || "",
        email: user?.email || "",
      };
      console.log("Settings: Setting form data to:", newFormData);
      setFormData(newFormData);
    }
  }, [user]);

  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["profile", "notifications", "account"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "account", label: "Account", icon: Trash2 },
  ];

  const handleProfileSave = async () => {
    // Check if user is authenticated before attempting to save
    if (!user) {
      setSaveStatus("error");
      console.error("Settings: Cannot save - user not authenticated");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return;
    }

    // Basic validation - allow saving even if names are empty (users can set them)
    if (
      !formData.firstName.trim() &&
      !formData.lastName.trim() &&
      !formData.email.trim()
    ) {
      setSaveStatus("error");
      console.error("Settings: At least one field must be provided");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return;
    }

    setSaveStatus("saving");
    try {
      // Create clean server data with only valid User fields
      const firstName = formData.firstName.trim();
      const lastName = formData.lastName.trim();
      const fullName = [firstName, lastName].filter(Boolean).join(" ");

      const serverData = {
        name: fullName,
        email: formData.email.trim(),
      };

      console.log("Settings: Saving profile data:", {
        formData,
        serverData,
        user: user?.id,
      });

      await updateProfile(serverData);
      console.log("Settings: Profile saved successfully");
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Settings: Profile save error:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleNotificationSave = () => {
    setSaveStatus("saving");
    // Simulate API call
    setTimeout(() => {
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }, 1000);
  };

  const handlePasswordChange = async () => {
    // Validation
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return;
    }

    setIsChangingPassword(true);
    setSaveStatus("saving");

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setSaveStatus("success");
        // Clear password fields
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        const data = await response.json();
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/auth/account", {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        // Account deleted successfully, redirect to home
        window.location.href = "/";
      } else {
        const data = await response.json();
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Show login message if user is not authenticated
  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {isLoading ? "Loading..." : "Please Log In"}
          </h1>
          <p className="text-gray-600 mb-6">
            {isLoading
              ? "Checking your authentication status..."
              : "You need to be logged in to access settings."}
          </p>
          {!isLoading && (
            <a
              href="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account preferences and settings
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700 rounded-r-lg"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <tab.icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {/* Save Status */}
              {saveStatus !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-6 p-4 rounded-xl flex items-center ${
                    saveStatus === "success"
                      ? "bg-green-50 border border-green-200"
                      : saveStatus === "error"
                        ? "bg-red-50 border border-red-200"
                        : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  {saveStatus === "success" ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : saveStatus === "error" ? (
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      saveStatus === "success"
                        ? "text-green-700"
                        : saveStatus === "error"
                          ? "text-red-700"
                          : "text-blue-700"
                    }`}
                  >
                    {saveStatus === "success"
                      ? "Settings saved successfully!"
                      : saveStatus === "error"
                        ? "Failed to save settings. Please try again."
                        : "Saving settings..."}
                  </span>
                </motion.div>
              )}

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Profile Information
                  </h2>

                  {/* Form Fields */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <button
                      onClick={handleProfileSave}
                      disabled={isLoading}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Notification Preferences
                  </h2>

                  <div className="space-y-6">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 rounded-xl"
                      >
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {key === "emailUpdates"
                              ? "Email Updates"
                              : "Marketing Emails"}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {key === "emailUpdates"
                              ? "Receive updates about your business recommendations"
                              : "Receive promotional emails and newsletters"}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) =>
                              setNotifications((prev) => ({
                                ...prev,
                                [key]: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}

                    <button
                      onClick={handleNotificationSave}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === "account" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Account Management
                  </h2>

                  {/* Danger Zone */}
                  <div className="border-2 border-red-200 rounded-xl p-6 bg-red-50">
                    <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Danger Zone
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-md font-medium text-red-700 mb-2">
                          Delete Account
                        </h4>
                        <p className="text-sm text-red-600 mb-4">
                          This action cannot be undone. This will permanently
                          delete your account, all quiz attempts, and remove all
                          associated data from our servers.
                        </p>
                      </div>

                      {!showDeleteConfirm ? (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </button>
                      ) : (
                        <div className="space-y-4 p-4 bg-white rounded-lg border border-red-300">
                          <div>
                            <p className="text-sm text-gray-700 mb-3">
                              To confirm account deletion, please type{" "}
                              <strong>DELETE</strong> below:
                            </p>
                            <input
                              type="text"
                              value={deleteConfirmText}
                              onChange={(e) =>
                                setDeleteConfirmText(e.target.value)
                              }
                              placeholder="Type DELETE to confirm"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>

                          <div className="flex space-x-3">
                            <button
                              onClick={handleDeleteAccount}
                              disabled={
                                deleteConfirmText !== "DELETE" || isDeleting
                              }
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              {isDeleting ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Permanently Delete Account
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeleteConfirmText("");
                              }}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
