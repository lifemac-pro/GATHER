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
          <div className="flex h-60 items-center justify-center rounded-lg bg-[#072446] p-6 shadow-md">
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-[#E1A913]" />
            <p className="text-gray-400">Loading your profile...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Section */}
            <section className="rounded-lg bg-[#072446] p-6 shadow-md">
              <h2 className="mb-2 text-xl font-semibold text-[#E1A913]">
                Profile
              </h2>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-400">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-[#E1A913] focus:ring-[#E1A913]"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">
                      Email
                    </label>
                    <input
                      type="email"
                      className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-[#E1A913] focus:ring-[#E1A913]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400">
                    Bio
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-[#E1A913] focus:ring-[#E1A913]"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-400">
                      Organization
                    </label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-[#E1A913] focus:ring-[#E1A913]"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Your company or organization"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">
                      Job Title
                    </label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-[#E1A913] focus:ring-[#E1A913]"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Your job title"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-[#E1A913] focus:ring-[#E1A913]"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleProfileSave}
                  className="rounded-md bg-[#E1A913] px-4 py-2 font-medium text-white hover:bg-[#c6900f]"
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
            <section className="rounded-lg bg-[#072446] p-6 shadow-md">
              <h2 className="mb-2 text-xl font-semibold text-[#E1A913]">
                Notifications
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    id="emailNotifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#E1A913] focus:ring-[#E1A913]"
                    checked={emailNotifications}
                    onChange={() => setEmailNotifications(!emailNotifications)}
                  />
                  <label
                    htmlFor="emailNotifications"
                    className="text-sm text-gray-400"
                  >
                    Receive email notifications
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="inAppNotifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#E1A913] focus:ring-[#E1A913]"
                    checked={inAppNotifications}
                    onChange={() => setInAppNotifications(!inAppNotifications)}
                  />
                  <label
                    htmlFor="inAppNotifications"
                    className="text-sm text-gray-400"
                  >
                    Receive in-app notifications
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="eventReminders"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#E1A913] focus:ring-[#E1A913]"
                    checked={eventReminders}
                    onChange={() => setEventReminders(!eventReminders)}
                  />
                  <label
                    htmlFor="eventReminders"
                    className="text-sm text-gray-400"
                  >
                    Receive event reminders
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="surveyNotifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#E1A913] focus:ring-[#E1A913]"
                    checked={surveyNotifications}
                    onChange={() =>
                      setSurveyNotifications(!surveyNotifications)
                    }
                  />
                  <label
                    htmlFor="surveyNotifications"
                    className="text-sm text-gray-400"
                  >
                    Receive survey notifications
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleNotificationsSave}
                  className="rounded-md bg-[#E1A913] px-4 py-2 font-medium text-white hover:bg-[#c6900f]"
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
