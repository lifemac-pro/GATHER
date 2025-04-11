"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
// Generate a simple unique ID as a fallback if uuid package is not available
function generateId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Define question types
const QUESTION_TYPES = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TEXT", label: "Text" },
  { value: "RATING", label: "Rating (1-5)" },
  { value: "YES_NO", label: "Yes/No" },
];

export default function CreateSurveyPage() {
  const router = useRouter();
  const { userId, isSignedIn, isLoaded } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<
    Array<{
      id: string;
      text: string;
      type: "MULTIPLE_CHOICE" | "TEXT" | "RATING" | "YES_NO";
      required: boolean;
      options?: string[];
    }>
  >([
    {
      id: generateId(),
      text: "",
      type: "MULTIPLE_CHOICE",
      required: false,
      options: ["", ""],
    },
  ]);

  // Create survey mutation
  const createSurvey = trpc.survey.create.useMutation({
    onSuccess: () => {
      toast.success("Survey created successfully!");
      router.push("/admin/surveys");
    },
    onError: (error) => {
      toast.error(`Failed to create survey: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // Add a new question
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: generateId(),
        text: "",
        type: "MULTIPLE_CHOICE",
        required: false,
        options: ["", ""],
      },
    ]);
  };

  // Remove a question
  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.error("Survey must have at least one question");
      return;
    }

    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  // Update question text
  const updateQuestionText = (index: number, text: string) => {
    const newQuestions = [...questions];
    if (newQuestions[index]) {
      newQuestions[index].text = text;
      setQuestions(newQuestions);
    }
  };

  // Update question type
  const updateQuestionType = (index: number, typeValue: string) => {
    // Validate that the type is one of the allowed values
    const type = typeValue as "MULTIPLE_CHOICE" | "TEXT" | "RATING" | "YES_NO";

    // Ensure the type is valid
    if (!["MULTIPLE_CHOICE", "TEXT", "RATING", "YES_NO"].includes(typeValue)) {
      console.error(`Invalid question type: ${typeValue}`);
      return;
    }
    const newQuestions = [...questions];

    if (newQuestions[index]) {
      newQuestions[index].type = type;

      // Initialize options for multiple choice questions
      if (
        type === "MULTIPLE_CHOICE" &&
        (!newQuestions[index].options ||
          newQuestions[index].options?.length === 0)
      ) {
        newQuestions[index].options = ["", ""];
      }

      setQuestions(newQuestions);
    }
  };

  // Update question required status
  const updateQuestionRequired = (index: number, required: boolean) => {
    const newQuestions = [...questions];
    if (newQuestions[index]) {
      newQuestions[index].required = required;
      setQuestions(newQuestions);
    }
  };

  // Add option to multiple choice question
  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];

    if (question) {
      if (!question.options) {
        question.options = [];
      }

      // Now we know options exists
      question.options.push("");
      setQuestions(newQuestions);
    }
  };

  // Remove option from multiple choice question
  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];

    if (!question) return;

    const options = question.options;

    if (!options || options.length === 2) {
      toast.error("Multiple choice questions must have at least two options");
      return;
    }

    options.splice(optionIndex, 1);
    setQuestions(newQuestions);
  };

  // Update option text
  const updateOptionText = (
    questionIndex: number,
    optionIndex: number,
    text: string,
  ) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];

    if (question && question.options) {
      question.options[optionIndex] = text;
      setQuestions(newQuestions);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn || !userId) {
      toast.error("You must be signed in to create a survey");
      return;
    }

    // Validate form
    if (!title.trim()) {
      toast.error("Please enter a survey title");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a survey description");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question) continue;

      if (!question.text.trim()) {
        toast.error(`Question ${i + 1} is missing text`);
        return;
      }

      if (question.type === "MULTIPLE_CHOICE") {
        if (!question.options || question.options.length < 2) {
          toast.error(`Question ${i + 1} must have at least two options`);
          return;
        }

        for (let j = 0; j < question.options.length; j++) {
          const option = question.options[j];
          if (!option?.trim()) {
            toast.error(`Option ${j + 1} for question ${i + 1} is empty`);
            return;
          }
        }
      }
    }

    setIsSubmitting(true);

    // Ensure questions have the correct type
    const typedQuestions = questions.map((q) => ({
      ...q,
      type: q.type,
    }));

    createSurvey.mutate({
      title,
      description,
      isActive,
      questions: typedQuestions,
      createdBy: userId,
      createdAt: new Date(),
    });
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
          <h1 className="text-3xl font-bold text-[#072446]">Create Survey</h1>
          <Button
            onClick={() => router.push("/admin/surveys")}
            variant="outline"
            className="flex items-center space-x-2 border-[#072446] bg-white text-[#072446]"
          >
            <ArrowLeft size={16} />
            <span>Back to Surveys</span>
          </Button>
        </div>

        {/* Survey Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Survey Details */}
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-2xl font-semibold text-[#072446]">
              Survey Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Survey Title*
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-[#00b0a6] focus:outline-none focus:ring-1 focus:ring-[#00b0a6]"
                  placeholder="Enter survey title"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description*
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-[#00b0a6] focus:outline-none focus:ring-1 focus:ring-[#00b0a6]"
                  placeholder="Enter survey description"
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#00b0a6] focus:ring-[#00b0a6]"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 text-sm text-gray-700"
                >
                  Make survey active (available to attendees)
                </label>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#072446]">
                Questions
              </h2>
              <Button
                type="button"
                onClick={addQuestion}
                className="flex items-center space-x-2 bg-[#00b0a6] text-white hover:bg-[#009991]"
              >
                <Plus size={16} />
                <span>Add Question</span>
              </Button>
            </div>

            <div className="space-y-8">
              {questions.map((question, questionIndex) => (
                <div
                  key={question.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <GripVertical className="mr-2 text-gray-400" />
                      <h3 className="font-medium text-[#072446]">
                        Question {questionIndex + 1}
                      </h3>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() => removeQuestion(questionIndex)}
                    >
                      <Trash2 size={16} />
                      <span className="ml-1">Remove</span>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Question Text*
                      </label>
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) =>
                          updateQuestionText(questionIndex, e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 p-2 focus:border-[#00b0a6] focus:outline-none focus:ring-1 focus:ring-[#00b0a6]"
                        placeholder="Enter question text"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Question Type*
                        </label>
                        <select
                          value={question.type}
                          onChange={(e) =>
                            updateQuestionType(questionIndex, e.target.value)
                          }
                          className="w-full rounded-md border border-gray-300 p-2 focus:border-[#00b0a6] focus:outline-none focus:ring-1 focus:ring-[#00b0a6]"
                        >
                          {QUESTION_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`required-${question.id}`}
                          checked={question.required}
                          onChange={(e) =>
                            updateQuestionRequired(
                              questionIndex,
                              e.target.checked,
                            )
                          }
                          className="h-4 w-4 rounded border-gray-300 text-[#00b0a6] focus:ring-[#00b0a6]"
                        />
                        <label
                          htmlFor={`required-${question.id}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          Required question
                        </label>
                      </div>
                    </div>

                    {/* Multiple Choice Options */}
                    {question.type === "MULTIPLE_CHOICE" && (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">
                            Options*
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-[#00b0a6] text-[#00b0a6] hover:bg-[#00b0a6] hover:text-white"
                            onClick={() => addOption(questionIndex)}
                          >
                            <Plus size={14} />
                            <span className="ml-1">Add Option</span>
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {question.options?.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="text"
                                value={option}
                                onChange={(e) =>
                                  updateOptionText(
                                    questionIndex,
                                    optionIndex,
                                    e.target.value,
                                  )
                                }
                                className="flex-1 rounded-md border border-gray-300 p-2 focus:border-[#00b0a6] focus:outline-none focus:ring-1 focus:ring-[#00b0a6]"
                                placeholder={`Option ${optionIndex + 1}`}
                                required
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                onClick={() =>
                                  removeOption(questionIndex, optionIndex)
                                }
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-[#00b0a6] text-white hover:bg-[#009991]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Survey..." : "Create Survey"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
