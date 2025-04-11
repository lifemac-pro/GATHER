"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu, X, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { formatDistanceToNow } from "date-fns";

const SurveysPage = () => {
  const router = useRouter();

  // Fetch available surveys (not yet completed)
  const { data: availableSurveys, isLoading: availableLoading } =
    trpc.survey.getAvailableSurveys.useQuery();

  // Fetch completed surveys
  const { data: completedSurveys, isLoading: completedLoading } =
    trpc.survey.getCompletedSurveys.useQuery();

  // Loading state
  const isLoading = availableLoading || completedLoading;

  const handleTakeSurvey = (id: string) => {
    router.push(`/attendee/surveys/${id}`);
  };

  // Toggle for the mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop Sidebar (Always Visible) */}
      <aside className="sticky top-0 hidden h-screen md:block">
        <Sidebar />
      </aside>

      {/* Mobile Navbar */}
      <nav className="flex items-center justify-between bg-[#072446] p-4 md:hidden">
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
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Surveys
            </h1>
            <p className="mt-2 text-gray-600">
              Complete surveys to help us improve your event experience
            </p>
          </div>

          {/* Available Surveys Section */}
          <div className="mb-8 rounded-lg bg-[#072446] p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-[#E1A913]">
              Available Surveys
            </h2>

            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-gray-400">Loading surveys...</p>
              </div>
            ) : availableSurveys && availableSurveys.length > 0 ? (
              <div className="space-y-4">
                {availableSurveys.map((survey) => {
                  const surveyId =
                    typeof survey._id === "string"
                      ? survey._id
                      : survey._id.toString();

                  return (
                    <div
                      key={surveyId}
                      className="rounded-lg border-l-4 border-[#E1A913] bg-[#072446] p-4 shadow-md"
                    >
                      <div className="flex flex-col justify-between md:flex-row md:items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-[#E1A913]">
                            {survey.title}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {survey.description}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Created{" "}
                            {formatDistanceToNow(
                              new Date(survey.createdAt as string),
                              {
                                addSuffix: true,
                              },
                            )}
                          </p>
                        </div>
                        <div className="mt-4 md:mt-0">
                          <Button
                            onClick={() => handleTakeSurvey(surveyId)}
                            className="flex items-center space-x-2 bg-[#E1A913] text-white hover:bg-[#c6900f]"
                          >
                            <span>Take Survey</span>
                            <ChevronRight size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center space-y-2 rounded-lg border-2 border-dashed border-gray-600 p-4">
                <AlertCircle size={24} className="text-gray-400" />
                <p className="text-center text-gray-400">
                  No surveys available at the moment.
                </p>
              </div>
            )}
          </div>

          {/* Completed Surveys Section */}
          <div className="rounded-lg bg-[#072446] p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-[#E1A913]">
              Completed Surveys
            </h2>

            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-gray-400">Loading surveys...</p>
              </div>
            ) : completedSurveys && completedSurveys.length > 0 ? (
              <div className="space-y-4">
                {completedSurveys.map((survey) => {
                  const surveyId =
                    typeof survey._id === "string"
                      ? survey._id
                      : survey._id.toString();

                  return (
                    <div
                      key={surveyId}
                      className="rounded-lg border-l-4 border-gray-600 bg-[#072446] p-4 shadow-md"
                    >
                      <div className="flex flex-col justify-between md:flex-row md:items-center">
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-lg font-semibold text-[#E1A913]">
                              {survey.title}
                            </h3>
                            <CheckCircle
                              size={16}
                              className="ml-2 text-green-500"
                            />
                          </div>
                          <p className="text-sm text-gray-400">
                            {survey.description}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Completed
                          </p>
                        </div>
                        <div className="mt-4 md:mt-0">
                          <Button
                            variant="outline"
                            onClick={() =>
                              router.push(
                                `/attendee/surveys/${surveyId}/results`,
                              )
                            }
                            className="flex items-center space-x-2 bg-[#E1A913] text-white hover:bg-[#c6900f]"
                          >
                            <span>View Results</span>
                            <ChevronRight size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center space-y-2 rounded-lg border-2 border-dashed border-gray-600 p-4">
                <AlertCircle size={24} className="text-gray-400" />
                <p className="text-center text-gray-400">
                  You haven&apos;t completed any surveys yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SurveysPage;
