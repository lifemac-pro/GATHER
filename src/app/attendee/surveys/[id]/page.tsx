"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

export default function SurveyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const surveyId = unwrappedParams.id;
  
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch survey data
  const { data: survey, isLoading: surveyLoading } = trpc.survey.getById.useQuery(
    { id: surveyId },
    {
      enabled: !!surveyId,
      retry: 1,
      onError: (error) => {
        toast.error(`Error loading survey: ${error.message}`);
        router.push("/attendee/surveys");
      },
    }
  );
  
  // Check if user has already responded
  const { data: hasResponded, isLoading: checkingResponse } = trpc.survey.hasResponded.useQuery(
    { surveyId },
    {
      enabled: !!surveyId,
      retry: 1,
      onSuccess: (data) => {
        if (data) {
          toast.info("You have already completed this survey");
          router.push("/attendee/surveys");
        }
      },
    }
  );
  
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
  const handleAnswerChange = (questionId: string, value: any) => {
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
      .filter((q) => !answers[q.id || ""] && answers[q.id || ""] !== 0);
    
    if (unansweredRequired.length > 0) {
      toast.error(`Please answer all required questions`);
      return;
    }
    
    setIsSubmitting(true);
    
    // Format answers for submission
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));
    
    submitResponse.mutate({
      surveyId,
      userId: "", // This will be set by the server
      answers: formattedAnswers,
    });
  };
  
  // Render question based on type
  const renderQuestion = (question: any, index: number) => {
    const questionId = question.id || "";
    
    switch (question.type) {
      case "MULTIPLE_CHOICE":
        return (
          <div className="mb-6">
            <label className="mb-2 block font-medium text-[#072446]">
              {index + 1}. {question.text}
              {question.required && <span className="ml-1 text-red-500">*</span>}
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
                    className="h-4 w-4 text-[#00b0a6] focus:ring-[#00b0a6]"
                    required={question.required}
                  />
                  <label
                    htmlFor={`${questionId}-${i}`}
                    className="ml-2 text-gray-700"
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
              className="mb-2 block font-medium text-[#072446]"
            >
              {index + 1}. {question.text}
              {question.required && <span className="ml-1 text-red-500">*</span>}
            </label>
            <textarea
              id={questionId}
              value={answers[questionId] || ""}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-[#00b0a6] focus:outline-none focus:ring-1 focus:ring-[#00b0a6]"
              rows={4}
              required={question.required}
            />
          </div>
        );
      
      case "RATING":
        return (
          <div className="mb-6">
            <label className="mb-2 block font-medium text-[#072446]">
              {index + 1}. {question.text}
              {question.required && <span className="ml-1 text-red-500">*</span>}
            </label>
            <div className="flex space-x-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <div key={rating} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => handleAnswerChange(questionId, rating)}
                    className={`h-10 w-10 rounded-full ${
                      answers[questionId] === rating
                        ? "bg-[#00b0a6] text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {rating}
                  </button>
                  <span className="mt-1 text-xs text-gray-500">
                    {rating === 1
                      ? "Poor"
                      : rating === 5
                      ? "Excellent"
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      
      case "YES_NO":
        return (
          <div className="mb-6">
            <label className="mb-2 block font-medium text-[#072446]">
              {index + 1}. {question.text}
              {question.required && <span className="ml-1 text-red-500">*</span>}
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
                  className="h-4 w-4 text-[#00b0a6] focus:ring-[#00b0a6]"
                  required={question.required}
                />
                <label
                  htmlFor={`${questionId}-yes`}
                  className="ml-2 text-gray-700"
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
                  className="h-4 w-4 text-[#00b0a6] focus:ring-[#00b0a6]"
                  required={question.required}
                />
                <label
                  htmlFor={`${questionId}-no`}
                  className="ml-2 text-gray-700"
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
            onClick={(e) => e.stopPropagation()}
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
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              {isLoading ? "Loading Survey..." : survey?.title || "Survey"}
            </h1>
            <Button
              onClick={() => router.push("/attendee/surveys")}
              variant="outline"
              className="flex items-center space-x-2 border-[#072446] bg-white text-[#072446]"
            >
              <ArrowLeft size={16} />
              <span>Back to Surveys</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex h-60 items-center justify-center rounded-lg bg-white p-6 shadow-lg">
              <p className="text-gray-500">Loading survey questions...</p>
            </div>
          ) : survey ? (
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <p className="mb-6 text-gray-600">{survey.description}</p>
              
              <form onSubmit={handleSubmit}>
                {survey.questions.map((question, index) => (
                  <div key={question.id || index}>
                    {renderQuestion(question, index)}
                  </div>
                ))}
                
                <div className="mt-8 flex justify-end">
                  <Button
                    type="submit"
                    className="bg-[#00b0a6] text-white hover:bg-[#009991]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Survey"}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center space-y-4 rounded-lg bg-white p-6 shadow-lg">
              <AlertCircle size={32} className="text-red-500" />
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800">Survey Not Found</h2>
                <p className="mt-2 text-gray-600">
                  The survey you're looking for could not be found or has been removed.
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
