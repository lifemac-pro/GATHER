import React from "react";
import Sidebar from "../../../components/ui/sidebar";

const SurveysPage = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-[#E1A913] mb-6">Surveys</h1>
        <div className="flex flex-col items-center justify-center h-64 bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-500">No surveys available at the moment.</p>
        </div>
      </main>
    </div>
  );
};

export default SurveysPage;
