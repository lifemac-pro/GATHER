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
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 rounded-xl bg-gradient-to-r from-[#082865] to-[#0055FF] p-6 shadow-lg">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-white md:text-3xl">
                  Surveys
                </h1>
                <p className="mt-2 text-white/80">
                  Complete surveys to help us improve your event experience
                </p>
              </div>
            </div>
          </div>

          {/* Available Surveys Section */}
          <div className="mb-8 rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-6 text-xl font-bold text-[#082865]">
              Available Surveys
            </h2>

            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0055FF] border-t-transparent"></div>
              </div>
            ) : availableSurveys && availableSurveys.length > 0 ? (
              <div className="space-y-6">
                {availableSurveys.map((survey) => {
                  const surveyId =
                    typeof survey._id === "string"
                      ? survey._id
                      : survey._id.toString();

                  return (
                    <div
                      key={surveyId}
                      className="group overflow-hidden rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-[#0055FF]/20 hover:shadow-md"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                          <h3 className="text-lg font-bold text-[#082865]">
                            {survey.title}
                          </h3>
                          <p className="mt-1 text-gray-600">
                            {survey.description}
                          </p>
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <span className="rounded-full bg-gray-100 px-2 py-1 font-medium">
                              Created{" "}
                              {formatDistanceToNow(
                                new Date(survey.createdAt as string),
                                {
                                  addSuffix: true,
                                },
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0">
                          <Button
                            onClick={() => handleTakeSurvey(surveyId)}
                            className="flex items-center space-x-2 bg-[#0055FF] text-white shadow-sm transition-all hover:bg-[#004BD9] hover:shadow-md"
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
              <div className="flex h-40 flex-col items-center justify-center space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-6">
                <div className="rounded-full bg-gray-100 p-3">
                  <AlertCircle size={24} className="text-gray-400" />
                </div>
                <p className="text-center text-gray-500">
                  No surveys available at the moment.
                </p>
              </div>
            )}
          </div>

          {/* Completed Surveys Section */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-6 text-xl font-bold text-[#082865]">
              Completed Surveys
            </h2>

            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0055FF] border-t-transparent"></div>
              </div>
            ) : completedSurveys && completedSurveys.length > 0 ? (
              <div className="space-y-6">
                {completedSurveys.map((survey) => {
                  const surveyId =
                    typeof survey._id === "string"
                      ? survey._id
                      : survey._id.toString();

                  return (
                    <div
                      key={surveyId}
                      className="group overflow-hidden rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-green-500/20 hover:shadow-md"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-[#082865]">
                              {survey.title}
                            </h3>
                            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              <CheckCircle size={12} /> Completed
                            </span>
                          </div>
                          <p className="mt-1 text-gray-600">
                            {survey.description}
                          </p>
                        </div>
                        <div className="mt-4 md:mt-0">
                          <Button
                            onClick={() =>
                              router.push(
                                `/attendee/surveys/${surveyId}/results`,
                              )
                            }
                            className="flex items-center space-x-2 bg-[#0055FF] text-white shadow-sm transition-all hover:bg-[#004BD9] hover:shadow-md"
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
              <div className="flex h-40 flex-col items-center justify-center space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-6">
                <div className="rounded-full bg-gray-100 p-3">
                  <AlertCircle size={24} className="text-gray-400" />
                </div>
                <p className="text-center text-gray-500">
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
