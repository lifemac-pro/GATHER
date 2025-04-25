"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowLeft, CheckCircle } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

// Define types for survey and question
type SurveyQuestion = {
  id?: string;
  text: string;
  type: "MULTIPLE_CHOICE" | "TEXT" | "RATING" | "YES_NO";
  required: boolean;
  options?: string[];
};

type Survey = {
  _id: string;
  title: string;
  description?: string;
  isActive?: boolean;
  questions: SurveyQuestion[];
  responses?: Array<{
    _id: string;
    surveyId: string;
    userId: string;
    answers: Array<{
      questionId: string;
      answer: string | number | string[];
    }>;
    createdAt: string;
  }>;
};

export default function SurveyResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Use React.use() to unwrap params
  const { id: surveyId } = React.use(params);

  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch survey data
  const {
    data: survey,
    isLoading: surveyLoading,
    error: surveyError,
  } = trpc.survey.getById.useQuery(
    { id: surveyId },
    {
      enabled: !!surveyId,
      retry: 1,
    },
  );

  // Check if user has responded to this survey
  const {
    data: hasResponded,
    isLoading: checkingResponse,
    error: responseError,
  } = trpc.survey.hasResponded.useQuery(
    { surveyId },
    {
      enabled: !!surveyId,
      retry: 1,
    },
  );

  // Handle survey data and errors with useEffect
  useEffect(() => {
    if (surveyError) {
      toast.error(`Error loading survey: ${surveyError.message}`);
      router.push("/attendee/surveys");
    }
  }, [surveyError, router]);

  // Handle response check errors
  useEffect(() => {
    if (responseError) {
      toast.error(`Error checking response: ${responseError.message}`);
    }
  }, [responseError]);

  // Loading state
  const isLoading = surveyLoading || checkingResponse;

  // Type assertion for survey data
  const typedSurvey = survey as unknown as Survey;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop Sidebar */}
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
            onClick={(e) => e.stopPropagation()}
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
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 rounded-xl bg-gradient-to-r from-[#082865] to-[#0055FF] p-6 shadow-lg">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                {isLoading
                  ? "Loading Results..."
                  : `${typedSurvey?.title || "Survey"} Results`}
              </h1>
              <Button
                onClick={() => router.push("/attendee/surveys")}
                className="rounded-lg bg-white/10 px-4 py-2 text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <ArrowLeft size={16} className="mr-2" />
                <span>Back to Surveys</span>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-60 items-center justify-center rounded-xl bg-white p-8 shadow-md">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0055FF] border-t-transparent"></div>
            </div>
          ) : typedSurvey ? (
            <div className="rounded-xl bg-white p-8 shadow-md">
              {hasResponded ? (
                <>
                  <div className="mb-6 flex items-center space-x-3 rounded-lg bg-green-50 p-4 text-green-700">
                    <CheckCircle size={20} className="text-green-500" />
                    <p>
                      You have successfully completed this survey. Thank you for
                      your feedback!
                    </p>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-[#E1A913]">
                      Survey Summary
                    </h2>
                    <p className="mt-2 text-gray-400">
                      {typedSurvey.description}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-lg border border-gray-600 p-4">
                      <h3 className="text-lg font-medium text-[#E1A913]">
                        Thank You!
                      </h3>
                      <p className="mt-2 text-gray-400">
                        Your feedback is valuable to us and helps us improve our
                        events.
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-600 p-4">
                      <h3 className="text-lg font-medium text-[#E1A913]">
                        What&apos;s Next?
                      </h3>
                      <p className="mt-2 text-gray-400">
                        Your responses have been recorded. The event organizers
                        will review all feedback to make future events even
                        better.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
                  <p className="text-gray-400">
                    You haven&apos;t completed this survey yet.
                  </p>
                  <Button
                    onClick={() => router.push(`/attendee/surveys/${surveyId}`)}
                    className="mt-4 bg-[#E1A913] text-white hover:bg-[#c6900f]"
                  >
                    Take Survey
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center space-y-4 rounded-lg bg-white p-6 shadow-lg">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  Survey Not Found
                </h2>
                <p className="mt-2 text-gray-600">
                  The survey you&apos;re looking for could not be found or has
                  been removed.
                </p>
              </div>
              <Button
                onClick={() => router.push("/attendee/surveys")}
                className="mt-4 bg-[#00b0a6] text-white hover:bg-[#009991]"
              >
                Return to Surveys
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
