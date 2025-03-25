"use client";

import React, { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

type Survey = {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
};

const SurveysPage = () => {
  // Example surveys data
  const [surveys, setSurveys] = useState<Survey[]>([
    {
      id: 1,
      title: "Post-Event Feedback",
      description: "Tell us how we did!",
      isCompleted: false,
    },
    {
      id: 2,
      title: "Speaker Rating",
      description: "Rate the speaker's presentation",
      isCompleted: true,
    },
  ]);

  const handleTakeSurvey = (id: number) => {
    // TODO: Navigate to a survey form or open a modal
    alert(`Opening survey with ID: ${id}`);
  };

  // Toggle for the mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:block sticky top-0">
        <Sidebar />
      </aside>

      {/* Mobile Navbar (visible on small screens) */}
      <nav className="md:hidden flex items-center justify-between bg-[#072446] p-4">
        <h2 className="text-xl font-bold text-[#E1A913]">GatherEase</h2>
        <button
          className="text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu size={24} />
        </button>
      </nav>

      {/* Mobile Sidebar (slides in/out) */}
      {mobileMenuOpen && (
        <aside className="absolute z-50 top-16 left-0 w-60 bg-[#072446] text-[#B0B8C5] p-5 h-full shadow-lg md:hidden">
          <Sidebar />
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-100">
        <h1 className="mb-6 text-2xl md:text-3xl font-bold text-[#E1A913]">
          Surveys
        </h1>

        {/* Surveys List */}
        <div className="space-y-4">
          {surveys.map((survey) => (
            <div
              key={survey.id}
              className="flex items-center justify-between rounded-lg bg-white p-4 shadow-md"
            >
              <div>
                <h2 className="text-xl font-semibold text-[#E1A913]">
                  {survey.title}
                </h2>
                <p className="text-gray-600">{survey.description}</p>
                {survey.isCompleted && (
                  <span className="mt-2 inline-block rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                    Completed
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                className="ml-4"
                onClick={() => handleTakeSurvey(survey.id)}
                disabled={survey.isCompleted}
              >
                {survey.isCompleted ? "View Survey" : "Take Survey"}
              </Button>
            </div>
          ))}

          {/* Example: If no surveys available */}
          {surveys.length === 0 && (
            <div className="rounded-lg bg-white p-4 shadow-md">
              <p className="text-gray-500">No surveys available at the moment.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SurveysPage;
