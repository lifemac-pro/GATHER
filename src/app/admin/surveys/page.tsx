"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
// import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { ArrowLeft, Plus, Edit, Trash2, ClipboardList } from "lucide-react";

export default function AdminSurveysPage() {
  const router = useRouter();
  const { /* userId, */ isSignedIn, isLoaded } = useAuth();
  const [deletingSurveyId, setDeletingSurveyId] = useState<string | null>(null);

  // Fetch all surveys
  const { data: surveys, isLoading, refetch } = trpc.survey.getAll.useQuery();

  // Delete survey mutation
  const deleteSurvey = trpc.survey.delete.useMutation({
    onSuccess: () => {
      toast.success("Survey deleted successfully!");
      void refetch();
      setDeletingSurveyId(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete survey: ${error.message}`);
      setDeletingSurveyId(null);
    },
  });

  // Handle delete survey
  const handleDeleteSurvey = (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this survey? This action cannot be undone.",
      )
    ) {
      setDeletingSurveyId(id);
      deleteSurvey.mutate({ id });
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
          <h1 className="text-3xl font-bold text-[#072446]">Surveys</h1>
          <div className="flex space-x-4">
            <Button
              onClick={() => router.push("/admin")}
              variant="outline"
              className="flex items-center space-x-2 border-[#072446] bg-white text-[#072446]"
            >
              <ArrowLeft size={16} />
              <span>Back to Admin</span>
            </Button>
            <Button
              onClick={() => router.push("/admin/surveys/create")}
              className="flex items-center space-x-2 bg-[#00b0a6] text-white hover:bg-[#009991]"
            >
              <Plus size={16} />
              <span>Create Survey</span>
            </Button>
          </div>
        </div>

        {/* Surveys List */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-[#072446]">
            All Surveys
          </h2>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-gray-500">Loading surveys...</p>
            </div>
          ) : surveys && surveys.length > 0 ? (
            <div className="space-y-4">
              {surveys.map((survey) => {
                const surveyId =
                  typeof survey._id === "string"
                    ? survey._id
                    : survey._id.toString();

                const isDeleting = deletingSurveyId === surveyId;

                return (
                  <div
                    key={surveyId}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <h3 className="font-medium text-[#072446]">
                          {survey.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {survey.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center text-xs text-gray-500">
                          <span className="mr-4">
                            Questions:{" "}
                            {Array.isArray(survey.questions)
                              ? survey.questions.length
                              : 0}
                          </span>
                          <span className="mr-4">
                            Created:{" "}
                            {new Date(
                              survey.createdAt as string | number | Date,
                            ).toLocaleDateString()}
                          </span>
                          <span
                            className={`font-medium ${survey.isActive ? "text-green-600" : "text-red-600"}`}
                          >
                            {survey.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#00b0a6] text-[#00b0a6] hover:bg-[#00b0a6] hover:text-white"
                          onClick={() =>
                            router.push(`/admin/surveys/${surveyId}/responses`)
                          }
                        >
                          <ClipboardList size={16} />
                          <span className="ml-1">Responses</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                          onClick={() =>
                            router.push(`/admin/surveys/edit/${surveyId}`)
                          }
                        >
                          <Edit size={16} />
                          <span className="ml-1">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          onClick={() => handleDeleteSurvey(surveyId)}
                          disabled={isDeleting}
                        >
                          <Trash2 size={16} />
                          <span className="ml-1">
                            {isDeleting ? "Deleting..." : "Delete"}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">No surveys created yet.</p>
              <Button
                onClick={() => router.push("/admin/surveys/create")}
                className="flex items-center space-x-2 bg-[#00b0a6] text-white hover:bg-[#009991]"
              >
                <Plus size={16} />
                <span>Create Your First Survey</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
