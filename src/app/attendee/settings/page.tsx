import React from "react";
import Sidebar from "../../../components/ui/sidebar";

const SettingsPage = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-[#E1A913] mb-6">Settings</h1>
        <div className="bg-white shadow-md p-6 rounded-lg">
          <p className="text-gray-600">Update your account preferences here.</p>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
