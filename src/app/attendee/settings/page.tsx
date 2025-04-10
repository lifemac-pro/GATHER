"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../../components/ui/sidebar";
import { Menu, X, Save, User, Bell, Lock, Loader2 } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const SettingsPage = () => {
  const { userId, isSignedIn, isLoaded } = useAuth();

  // State for settings
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [organization, setOrganization] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [surveyNotifications, setSurveyNotifications] = useState(true);

  // Loading states
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isNotificationsSaving, setIsNotificationsSaving] = useState(false);

  // Toggle for the mobile sidebar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get user data
  const {
    data: userData,
    isLoading: isUserLoading,
    refetch,
  } = trpc.user.getCurrentUser.useQuery();

  // Update profile mutation
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      setIsProfileSaving(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
      setIsProfileSaving(false);
    },
  });

  // Update notification preferences mutation
  const updateNotificationPreferences =
    trpc.user.updateNotificationPreferences.useMutation({
      onSuccess: () => {
        toast.success("Notification preferences updated successfully");
        setIsNotificationsSaving(false);
        refetch();
      },
      onError: (error) => {
        toast.error(
          `Failed to update notification preferences: ${error.message}`,
        );
        setIsNotificationsSaving(false);
      },
    });

  // Load user data when available
  useEffect(() => {
    if (userData) {
      setFullName(userData.fullName || "");
      setEmail(userData.email || "");
      setBio(userData.bio || "");
      setOrganization(userData.organization || "");
      setJobTitle(userData.jobTitle || "");
      setPhoneNumber(userData.phoneNumber || "");

      // Set notification preferences
      if (userData.notificationPreferences) {
        setEmailNotifications(userData.notificationPreferences.email);
        setInAppNotifications(userData.notificationPreferences.inApp);
        setEventReminders(userData.notificationPreferences.eventReminders);
        setSurveyNotifications(
          userData.notificationPreferences.surveyNotifications,
        );
      }
    }
  }, [userData]);

  // Handle profile save
  const handleProfileSave = () => {
    if (!isSignedIn) {
      toast.error("You must be signed in to update your profile");
      return;
    }

    // Validate inputs
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsProfileSaving(true);

    updateProfile.mutate({
      fullName,
      email,
      bio,
      organization,
      jobTitle,
      phoneNumber,
    });
  };

  // Handle notification preferences save
  const handleNotificationsSave = () => {
    if (!isSignedIn) {
      toast.error(
        "You must be signed in to update your notification preferences",
      );
      return;
    }

    setIsNotificationsSaving(true);

    updateNotificationPreferences.mutate({
      email: emailNotifications,
      inApp: inAppNotifications,
      eventReminders,
      surveyNotifications,
    });
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop Sidebar (Always Visible) */}
      <aside className="sticky top-0 hidden md:block">
        <Sidebar />
      </aside>

      {/* Mobile Navbar */}
      <nav className="flex items-center justify-between bg-[#072446] p-4 md:hidden">
        <h2 className="text-xl font-bold text-[#E1A913]">GatherEase</h2>
        <button
          className="text-white"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>
      </nav>

      {/* Mobile Sidebar (Overlay) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="fixed left-0 top-0 h-screen w-64 transform bg-[#072446] text-[#B0B8C5] shadow-lg transition-transform duration-300"
            onClick={(e) => e.stopPropagation()} // Prevent sidebar from closing when clicking inside
          >
            <div className="flex items-center justify-between p-4">
              {/* <h2 className="text-xl font-bold text-[#E1A913]">GatherEase</h2> */}
              <button
                className="text-white"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Menu"
              >
                <X size={24} />
              </button>
            </div>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 bg-[#6fc3f7] p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-800 md:text-3xl">
          Settings
        </h1>

        {isUserLoading ? (
          <div className="flex h-60 items-center justify-center rounded-lg bg-white p-6 shadow-lg">
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-[#00b0a6]" />
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Section */}
            <section className="rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center">
                <User className="mr-2 h-5 w-5 text-[#00b0a6]" />
                <h2 className="text-xl font-semibold text-[#072446]">
                  Profile Information
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name*
                    </label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-[#00b0a6] focus:outline-none focus:ring-1 focus:ring-[#00b0a6]"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email*
                    </label>
                    <input
                      type="email"
                      className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-[#00b0a6] focus:outline-none focus:ring-1 focus:ring-[#00b0a6]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-[#00b0a6] focus:outline-none focus:ring-1 focus:ring-[#00b0a6]"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Organization
                    </label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-[#00b0a6] focus:outline-none focus:ring-1 focus:ring-[#00b0a6]"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Your company or organization"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Job Title
                    </label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-[#00b0a6] focus:outline-none focus:ring-1 focus:ring-[#00b0a6]"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Your job title"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-[#00b0a6] focus:outline-none focus:ring-1 focus:ring-[#00b0a6]"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleProfileSave}
                  className="flex items-center space-x-2 bg-[#00b0a6] text-white hover:bg-[#009991]"
                  disabled={isProfileSaving}
                >
                  {isProfileSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      <span>Save Profile</span>
                    </>
                  )}
                </Button>
              </div>
            </section>

            {/* Notifications Section */}
            <section className="rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center">
                <Bell className="mr-2 h-5 w-5 text-[#E1A913]" />
                <h2 className="text-xl font-semibold text-[#072446]">
                  Notification Preferences
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    id="emailNotifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#00b0a6] focus:ring-[#00b0a6]"
                    checked={emailNotifications}
                    onChange={() => setEmailNotifications(!emailNotifications)}
                  />
                  <label
                    htmlFor="emailNotifications"
                    className="text-sm text-gray-700"
                  >
                    Receive email notifications
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="inAppNotifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#00b0a6] focus:ring-[#00b0a6]"
                    checked={inAppNotifications}
                    onChange={() => setInAppNotifications(!inAppNotifications)}
                  />
                  <label
                    htmlFor="inAppNotifications"
                    className="text-sm text-gray-700"
                  >
                    Receive in-app notifications
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="eventReminders"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#00b0a6] focus:ring-[#00b0a6]"
                    checked={eventReminders}
                    onChange={() => setEventReminders(!eventReminders)}
                  />
                  <label
                    htmlFor="eventReminders"
                    className="text-sm text-gray-700"
                  >
                    Receive event reminders
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="surveyNotifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#00b0a6] focus:ring-[#00b0a6]"
                    checked={surveyNotifications}
                    onChange={() =>
                      setSurveyNotifications(!surveyNotifications)
                    }
                  />
                  <label
                    htmlFor="surveyNotifications"
                    className="text-sm text-gray-700"
                  >
                    Receive survey notifications
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleNotificationsSave}
                  className="flex items-center space-x-2 bg-[#00b0a6] text-white hover:bg-[#009991]"
                  disabled={isNotificationsSaving}
                >
                  {isNotificationsSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      <span>Save Preferences</span>
                    </>
                  )}
                </Button>
              </div>
            </section>

            {/* Password Section */}
            <section className="rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center">
                <Lock className="mr-2 h-5 w-5 text-[#072446]" />
                <h2 className="text-xl font-semibold text-[#072446]">
                  Password Management
                </h2>
              </div>

              <p className="mb-4 text-gray-600">
                Password management is handled by our authentication provider.
                To change your password, please use the authentication
                provider's settings.
              </p>

              <div className="flex justify-end">
                <Button
                  onClick={() =>
                    window.open(
                      "https://accounts.clerk.dev/user/settings/password",
                      "_blank",
                    )
                  }
                  variant="outline"
                  className="border-[#072446] text-[#072446] hover:bg-[#072446] hover:text-white"
                >
                  Manage Password
                </Button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default SettingsPage;
