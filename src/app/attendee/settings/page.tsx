"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../../components/ui/sidebar";
import { Menu, X, Save, Loader2 } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const SettingsPage = () => {
  const { isSignedIn } = useAuth();

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

  // Define a type for the user data
  type UserData = {
    _id: string;
    userId: string;
    fullName: string;
    email: string;
    bio?: string;
    organization?: string;
    jobTitle?: string;
    phoneNumber?: string;
    notificationPreferences: {
      email: boolean;
      inApp: boolean;
      eventReminders: boolean;
      surveyNotifications: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
  };

  // Load user data when available
  useEffect(() => {
    if (userData) {
      // Type assertion to tell TypeScript that userData has the expected properties
      const typedUserData = userData as UserData;

      setFullName(typedUserData.fullName || "");
      setEmail(typedUserData.email || "");
      setBio(typedUserData.bio || "");
      setOrganization(typedUserData.organization || "");
      setJobTitle(typedUserData.jobTitle || "");
      setPhoneNumber(typedUserData.phoneNumber || "");

      // Set notification preferences
      if (typedUserData.notificationPreferences) {
        setEmailNotifications(typedUserData.notificationPreferences.email);
        setInAppNotifications(typedUserData.notificationPreferences.inApp);
        setEventReminders(typedUserData.notificationPreferences.eventReminders);
        setSurveyNotifications(
          typedUserData.notificationPreferences.surveyNotifications,
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

    void updateProfile.mutate({
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

    void updateNotificationPreferences.mutate({
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
      <nav className="flex items-center justify-between bg-[#082865] p-4 shadow-md md:hidden">
        <h2 className="text-xl font-bold text-white">GatherEase</h2>
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
          className="fixed inset-0 z-50 bg-black bg-opacity-70 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="fixed left-0 top-0 h-screen w-72 transform bg-gradient-to-b from-[#082865] to-[#004BD9] shadow-lg transition-transform duration-300"
            onClick={(e) => e.stopPropagation()} // Prevent sidebar from closing when clicking inside
          >
            <div className="flex items-center justify-between p-4">
              <button
                className="absolute right-4 top-4 text-white/80 transition hover:text-white"
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
      <main className="flex-1 bg-gradient-to-b from-[#f0f9ff] to-[#e0f2fe] p-6">
        <div className="mb-6 rounded-xl bg-gradient-to-r from-[#082865] to-[#0055FF] p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Settings
          </h1>
          <p className="mt-2 text-white/80">
            Manage your profile and notification preferences
          </p>
        </div>

        {isUserLoading ? (
          <div className="flex h-60 items-center justify-center rounded-xl bg-white p-6 shadow-md">
            <div className="flex items-center">
              <div className="mr-3 h-8 w-8 animate-spin rounded-full border-4 border-[#0055FF] border-t-transparent"></div>
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Section */}
            <section className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-bold text-[#082865]">Profile</h2>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-[#0055FF] focus:ring-[#0055FF]"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Email
                    </label>
                    <input
                      type="email"
                      className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-[#0055FF] focus:ring-[#0055FF]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Bio
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-[#0055FF] focus:ring-[#0055FF]"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Organization
                    </label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-[#0055FF] focus:ring-[#0055FF]"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Your company or organization"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Job Title
                    </label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-[#0055FF] focus:ring-[#0055FF]"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Your job title"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-[#0055FF] focus:ring-[#0055FF]"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleProfileSave}
                  className="rounded-md bg-[#0055FF] px-4 py-2 font-medium text-white shadow-sm transition-all hover:bg-[#004BD9] hover:shadow-md"
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
            <section className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-bold text-[#082865]">
                Notifications
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    id="emailNotifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#0055FF] focus:ring-[#0055FF]"
                    checked={emailNotifications}
                    onChange={() => setEmailNotifications(!emailNotifications)}
                  />
                  <label
                    htmlFor="emailNotifications"
                    className="text-sm text-gray-600"
                  >
                    Receive email notifications
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="inAppNotifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#0055FF] focus:ring-[#0055FF]"
                    checked={inAppNotifications}
                    onChange={() => setInAppNotifications(!inAppNotifications)}
                  />
                  <label
                    htmlFor="inAppNotifications"
                    className="text-sm text-gray-600"
                  >
                    Receive in-app notifications
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="eventReminders"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#0055FF] focus:ring-[#0055FF]"
                    checked={eventReminders}
                    onChange={() => setEventReminders(!eventReminders)}
                  />
                  <label
                    htmlFor="eventReminders"
                    className="text-sm text-gray-600"
                  >
                    Receive event reminders
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="surveyNotifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#0055FF] focus:ring-[#0055FF]"
                    checked={surveyNotifications}
                    onChange={() =>
                      setSurveyNotifications(!surveyNotifications)
                    }
                  />
                  <label
                    htmlFor="surveyNotifications"
                    className="text-sm text-gray-600"
                  >
                    Receive survey notifications
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleNotificationsSave}
                  className="rounded-md bg-[#0055FF] px-4 py-2 font-medium text-white shadow-sm transition-all hover:bg-[#004BD9] hover:shadow-md"
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
            <section className="rounded-lg bg-[#072446] p-6 shadow-md">
              <h2 className="mb-2 text-xl font-semibold text-[#E1A913]">
                Change Password
              </h2>

              <p className="mb-4 text-gray-400">
                Password management is handled by our authentication provider.
                To change your password, please use the authentication
                provider&apos;s settings.
              </p>

              <div className="flex justify-end">
                <Button
                  onClick={() =>
                    window.open(
                      "https://accounts.clerk.dev/user/settings/password",
                      "_blank",
                    )
                  }
                  className="rounded-md bg-[#E1A913] px-4 py-2 font-medium text-white hover:bg-[#c6900f]"
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
