"use client";

import React, { useState } from "react";
import Sidebar from "../../../components/ui/sidebar";
import { Menu, X } from "lucide-react";

const SettingsPage = () => {
  // State for settings
  const [fullName, setFullName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [notifications, setNotifications] = useState(true);
  const [newPassword, setNewPassword] = useState("");

  // Toggle for the mobile sidebar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSave = () => {
    // TODO: Handle saving these settings (e.g., call an API)
    alert("Settings saved successfully!");
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Desktop Sidebar (Always Visible) */}
      <aside className="hidden md:block sticky top-0">
        <Sidebar />
      </aside>

      {/* Mobile Navbar */}
      <nav className="md:hidden flex items-center justify-between bg-[#072446] p-4">
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
            className="fixed top-0 left-0 h-screen w-64 bg-[#072446] text-[#B0B8C5] shadow-lg transform transition-transform duration-300"
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
        <h1 className="mb-6 text-2xl md:text-3xl font-bold text-gray-800">
          Settings
        </h1>

        <div className="space-y-6">
          {/* Profile Section */}
          <section className="rounded-lg bg-[#072446] p-6 shadow-md">
            <h2 className="mb-2 text-xl font-semibold text-[#E1A913]">Profile</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400">
                Full Name
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-[#E1A913] focus:ring-[#E1A913]"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
              />
            </div>
          </section>

          {/* Notifications Section */}
          <section className="rounded-lg bg-[#072446] p-6 shadow-md">
            <h2 className="mb-2 text-xl font-semibold text-[#E1A913]">
              Notifications
            </h2>
            <div className="flex items-center gap-2">
              <input
                id="notifications"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-[#E1A913] focus:ring-[#E1A913]"
                checked={notifications}
                onChange={() => setNotifications(!notifications)}
              />
              <label htmlFor="notifications" className="text-sm text-gray-400">
                Receive email notifications
              </label>
            </div>
          </section>

          {/* Change Password Section */}
          <section className="rounded-lg bg-[#072446] p-6 shadow-md">
            <h2 className="mb-2 text-xl font-semibold text-[#E1A913]">
              Change Password
            </h2>
            <label className="block text-sm font-medium text-gray-400">
              New Password
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-[#E1A913] focus:ring-[#E1A913]"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </section>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="rounded-md bg-[#E1A913] px-4 py-2 font-medium text-white hover:bg-[#c6900f]"
          >
            Save Changes
          </button>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
