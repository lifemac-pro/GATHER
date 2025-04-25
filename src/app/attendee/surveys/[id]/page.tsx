"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowLeft, AlertCircle } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

// Define types for survey questions
type SurveyQuestion = {
  id: string;
  text: string;
  type: "MULTIPLE_CHOICE" | "TEXT" | "RATING" | "CHECKBOX" | string;
  required: boolean;
  options: string[];
};

// Define type for survey
type Survey = {
  _id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  createdAt: string;
  updatedAt: string;
};

export default function SurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Use React.use() to unwrap params
  const { id: surveyId } = React.use(params);

  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Define a more specific type for answers - exclude null to match API expectations
  type SurveyAnswer = string | number | string[];
  const [answers, setAnswers] = useState<Record<string, SurveyAnswer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch survey data
  const {
    data: survey,
    isLoading: surveyLoading,
  }: { data: Survey | undefined; isLoading: boolean } =
    trpc.survey.getById.useQuery(
      { id: surveyId },
      {
        enabled: !!surveyId,
        retry: 1,
        // onError callback removed as it's not supported in the type
      },
    );

  // Check if user has already responded
  const { data: hasResponded, isLoading: checkingResponse } =
    trpc.survey.hasResponded.useQuery(
      { surveyId },
      {
        enabled: !!surveyId,
        retry: 1,
        // onSuccess callback removed as it's not supported in the type
      },
    );

  // Effect to handle hasResponded data
  useEffect(() => {
    if (hasResponded) {
      toast.info("You have already completed this survey");
      router.push("/attendee/surveys");
    }
  }, [hasResponded, router]);

  // Submit survey response
  const submitResponse = trpc.survey.submitResponse.useMutation({
    onSuccess: () => {
      toast.success("Survey submitted successfully!");
      router.push("/attendee/surveys");
    },
    onError: (error) => {
      toast.error(`Error submitting survey: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // Handle answer change
  const handleAnswerChange = (questionId: string, value: SurveyAnswer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!survey) return;

    // Check if all required questions are answered
    const unansweredRequired = survey.questions
      .filter((q) => q.required)
      .filter((q) => !answers[q.id] && answers[q.id] !== 0);

    if (unansweredRequired.length > 0) {
      toast.error(`Please answer all required questions`);
      return;
    }

    setIsSubmitting(true);

    // Format answers for submission
    const formattedAnswers = Object.entries(answers).map(
      ([questionId, answer]) => ({
        questionId,
        answer,
      }),
    );

    submitResponse.mutate({
      surveyId,
      userId: "", // This will be set by the server
      answers: formattedAnswers,
    });
  };

  // Render question based on type
  const renderQuestion = (question: SurveyQuestion, index: number) => {
    const questionId = question.id;

    switch (question.type) {
      case "MULTIPLE_CHOICE":
        return (
          <div className="mb-6">
            <label className="mb-3 block text-lg font-medium text-[#082865]">
              {index + 1}. {question.text}
              {question.required && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </label>
            <div className="space-y-2">
              {question.options?.map((option: string, i: number) => (
                <div key={i} className="flex items-center">
                  <input
                    type="radio"
                    id={`${questionId}-${i}`}
                    name={questionId}
                    value={option}
                    checked={answers[questionId] === option}
                    onChange={() => handleAnswerChange(questionId, option)}
                    className="h-4 w-4 text-[#0055FF] focus:ring-[#0055FF]"
                    required={question.required}
                  />
                  <label
                    htmlFor={`${questionId}-${i}`}
                    className="ml-2 text-gray-600"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case "TEXT":
        return (
          <div className="mb-6">
            <label
              htmlFor={questionId}
              className="mb-3 block text-lg font-medium text-[#082865]"
            >
              {index + 1}. {question.text}
              {question.required && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </label>
            <textarea
              id={questionId}
              value={answers[questionId] ?? ""}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white p-3 text-gray-700 shadow-sm focus:border-[#0055FF] focus:outline-none focus:ring-1 focus:ring-[#0055FF]"
              rows={4}
              required={question.required}
            />
          </div>
        );

      case "RATING":
        return (
          <div className="mb-6">
            <label className="mb-3 block text-lg font-medium text-[#082865]">
              {index + 1}. {question.text}
              {question.required && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </label>
            <div className="flex space-x-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <div key={rating} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => handleAnswerChange(questionId, rating)}
                    className={`h-10 w-10 rounded-full ${
                      answers[questionId] === rating
                        ? "bg-[#0055FF] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {rating}
                  </button>
                  <span className="mt-1 text-xs font-medium text-gray-500">
                    {rating === 1 ? "Poor" : rating === 5 ? "Excellent" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case "YES_NO":
        return (
          <div className="mb-6">
            <label className="mb-3 block text-lg font-medium text-[#082865]">
              {index + 1}. {question.text}
              {question.required && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id={`${questionId}-yes`}
                  name={questionId}
                  value="Yes"
                  checked={answers[questionId] === "Yes"}
                  onChange={() => handleAnswerChange(questionId, "Yes")}
                  className="h-4 w-4 text-[#0055FF] focus:ring-[#0055FF]"
                  required={question.required}
                />
                <label
                  htmlFor={`${questionId}-yes`}
                  className="ml-2 text-gray-600"
                >
                  Yes
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id={`${questionId}-no`}
                  name={questionId}
                  value="No"
                  checked={answers[questionId] === "No"}
                  onChange={() => handleAnswerChange(questionId, "No")}
                  className="h-4 w-4 text-[#0055FF] focus:ring-[#0055FF]"
                  required={question.required}
                />
                <label
                  htmlFor={`${questionId}-no`}
                  className="ml-2 text-gray-600"
                >
                  No
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Loading state
  const isLoading = surveyLoading || checkingResponse;

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
                {isLoading ? "Loading Survey..." : (survey?.title ?? "Survey")}
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
          ) : survey ? (
            <div className="rounded-xl bg-white p-8 shadow-md">
              <p className="mb-8 leading-relaxed text-gray-600">
                {survey.description}
              </p>

              <form onSubmit={handleSubmit}>
                {survey.questions.map((question, index) => (
                  <div key={question.id}>{renderQuestion(question, index)}</div>
                ))}

                <div className="mt-8 flex justify-end">
                  <Button
                    type="submit"
                    className="rounded-lg bg-[#0055FF] px-6 py-2 font-medium text-white shadow-sm transition-all hover:bg-[#004BD9] hover:shadow-md"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Survey"}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center space-y-4 rounded-xl bg-white p-8 shadow-md">
              <div className="rounded-full bg-red-50 p-3">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-[#082865]">
                  Survey Not Found
                </h2>
                <p className="mt-2 text-gray-600">
                  The survey you&apos;re looking for could not be found or has
                  been removed.
                </p>
              </div>
              <Button
                onClick={() => router.push("/attendee/surveys")}
                className="mt-4 bg-[#0055FF] text-white hover:bg-[#004BD9]"
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
