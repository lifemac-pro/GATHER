"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

// Define types for survey questions and answers
type SurveyQuestion = {
  id: string;
  text: string;
  type: string;
  options?: string[];
  required?: boolean;
};

type SurveyAnswer = {
  questionId: string;
  answer: string | string[] | number | boolean | Record<string, unknown>;
};

type Survey = {
  _id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type SurveyResponse = {
  _id: string;
  surveyId: string;
  userId: string;
  answers: SurveyAnswer[];
  submittedAt: string;
};
import { ArrowLeft, Download, User, Calendar } from "lucide-react";

export default function SurveyResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Use React.use() to unwrap params
  const { id: surveyId } = React.use(params);

  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  // Fetch survey data
  const {
    data: survey,
    isLoading: surveyLoading,
  }: { data: Survey | undefined; isLoading: boolean } =
    trpc.survey.getById.useQuery(
      { id: surveyId },
      {
        enabled: !!surveyId && isSignedIn,
        retry: 1,
        // onError callback removed as it's not supported in the type
      },
    );

  // Fetch survey responses
  const {
    data: responses,
    isLoading: responsesLoading,
  }: { data: SurveyResponse[] | undefined; isLoading: boolean } =
    trpc.survey.getResponses.useQuery(
      { surveyId },
      {
        enabled: !!surveyId && isSignedIn,
        retry: 1,
        // onError callback removed as it's not supported in the type
      },
    );

  // Loading state
  const isLoading = surveyLoading || responsesLoading;

  // Export responses to CSV
  const exportToCSV = () => {
    if (!survey || !responses || responses.length === 0) {
      toast.error("No responses to export");
      return;
    }

    try {
      // Create CSV header
      let csvContent = "User ID,Submission Date";

      // Add question headers
      survey.questions.forEach((question) => {
        csvContent += `,${question.text.replace(/,/g, " ")}`;
      });

      csvContent += "\\n";

      // Add response data
      responses.forEach((response) => {
        const submittedDate = new Date(
          response.submittedAt,
        ).toLocaleDateString();
        csvContent += `${response.userId},${submittedDate}`;

        // Add answers for each question
        survey.questions.forEach((question) => {
          const answer = response.answers.find(
            (a) => a.questionId === question.id,
          );
          let answerText = "";

          if (answer) {
            if (Array.isArray(answer.answer)) {
              answerText = answer.answer.join("; ");
            } else if (typeof answer.answer === "object") {
              answerText = JSON.stringify(answer.answer);
            } else {
              answerText = String(answer.answer);
            }
          }

          // Escape commas and quotes
          answerText = answerText.replace(/,/g, " ").replace(/"/g, '""');
          csvContent += `,${answerText}`;
        });

        csvContent += "\\n";
      });

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${survey.title.replace(/\\s+/g, "_")}_responses.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Responses exported successfully");
    } catch (error) {
      console.error("Error exporting responses:", error);
      toast.error("Error exporting responses");
    }
  };

  // If not loaded yet, show loading state
  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  // If not signed in, show sign-in message
  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#6fc3f7] p-8">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-6 text-2xl font-bold text-[#072446]">
            Admin Access Required
          </h1>
          <p className="mb-4 text-gray-600">
            You need to sign in to access the admin panel.
          </p>
          <Button
            onClick={() => router.push("/sign-in")}
            className="w-full bg-[#072446] text-white hover:bg-[#0a3060]"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#6fc3f7] p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#072446]">
            {isLoading
              ? "Loading..."
              : `${survey?.title ?? "Survey"} Responses`}
          </h1>
          <div className="flex space-x-4">
            <Button
              onClick={() => router.push("/admin/surveys")}
              variant="outline"
              className="flex items-center space-x-2 border-[#072446] bg-white text-[#072446]"
            >
              <ArrowLeft size={16} />
              <span>Back to Surveys</span>
            </Button>
            {responses && responses.length > 0 && (
              <Button
                onClick={exportToCSV}
                className="flex items-center space-x-2 bg-[#00b0a6] text-white hover:bg-[#009991]"
              >
                <Download size={16} />
                <span>Export CSV</span>
              </Button>
            )}
          </div>
        </div>

        {/* Survey Info */}
        {!isLoading && survey && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-[#072446]">
              Survey Information
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-gray-700">{survey.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-gray-700">
                  {new Date(survey.createdAt as string).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p
                  className={`font-medium ${survey.isActive ? "text-green-600" : "text-red-600"}`}
                >
                  {survey.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Questions</p>
                <p className="text-gray-700">{survey.questions.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Responses */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#072446]">Responses</h2>
            {!isLoading && responses && (
              <p className="text-gray-500">
                {responses.length}{" "}
                {responses.length === 1 ? "response" : "responses"}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-gray-500">Loading responses...</p>
            </div>
          ) : responses && responses.length > 0 ? (
            <div className="space-y-6">
              {responses.map((response, index) => (
                <div
                  key={response._id?.toString() || index}
                  className="rounded-lg border border-gray-200 p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-700">
                        {response.userId.substring(0, 8)}...
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {new Date(
                          response.submittedAt as string,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {survey?.questions.map((question, qIndex: number) => {
                      const answer = response.answers.find(
                        (a) => a.questionId === question.id,
                      );
                      let displayAnswer = "No answer";

                      if (answer) {
                        if (Array.isArray(answer.answer)) {
                          displayAnswer = answer.answer.join(", ");
                        } else if (typeof answer.answer === "object") {
                          displayAnswer = JSON.stringify(answer.answer);
                        } else {
                          displayAnswer = String(answer.answer);
                        }
                      }

                      return (
                        <div
                          key={qIndex}
                          className="border-t border-gray-100 pt-3"
                        >
                          <p className="text-sm font-medium text-gray-700">
                            {qIndex + 1}. {question.text}
                          </p>
                          <p className="mt-1 text-gray-600">{displayAnswer}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center space-y-2 rounded-lg border-2 border-dashed border-gray-300 p-4">
              <p className="text-center text-gray-500">No responses yet.</p>
              <p className="text-sm text-gray-400">
                Responses will appear here once attendees complete the survey.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
