"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

//import CreateSurveyForm from "@/components/ui/CreateSurveyForm";

const events = [
  { id: "1", name: "Tech Conference" },
  { id: "2", name: "Startup Pitch Night" },
  { id: "3", name: "Networking Night" },
];

const questionTypes = [
  { id: "short", label: "Short Answer" },
  { id: "mcq", label: "Multiple Choice" },
  { id: "checkbox", label: "Checkbox" },
];

export default function CreateSurveyPage() {
  const router = useRouter();
  const [surveyTitle, setSurveyTitle] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(events[0]?.id || "");
  const [questions, setQuestions] = useState<{ text: string; type: string; options: string[] }[]>([
    { text: "", type: "short", options: [] },
  ]);

  // Function to add a new question
  const addQuestion = () => {
    setQuestions([...questions, { text: "", type: "short", options: [] }]);
  };

  // Function to update question text
  const updateQuestionText = (index: number, value: string) => {
    setQuestions((prevQuestions) => {
      const updated = [...prevQuestions];
      if (!updated[index]) updated[index] = { text: "", type: "short", options: [] };
      updated[index].text = value;
      return updated;
    });
  };

  // Function to change question type
  const updateQuestionType = (index: number, value: string) => {
    setQuestions((prevQuestions) => {
      const updated = [...prevQuestions];

      if (!updated[index]) updated[index] = { text: "", type: "short", options: [] };

      updated[index].type = value;
      updated[index].options = value === "mcq" || value === "checkbox" ? [""] : [];

      return updated;
    });
  };

  // Function to update options for MCQ/Checkbox
  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions((prevQuestions) => {
      const updated = [...prevQuestions];

      if (!updated[qIndex]) updated[qIndex] = { text: "", type: "short", options: [] };

      if (!updated[qIndex].options) updated[qIndex].options = [];

      updated[qIndex].options[oIndex] = value;
      return updated;
    });
  };

  // Function to add an option for MCQ/Checkbox
  const addOption = (index: number) => {
    setQuestions((prevQuestions) => {
      const updated = [...prevQuestions];

      if (!updated[index]) updated[index] = { text: "", type: "short", options: [] };

      updated[index].options = updated[index].options ?? [];

      updated[index].options.push("");
      return updated;
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const surveyData = { title: surveyTitle, eventId: selectedEvent, questions };

    // Send survey data to your backend
    await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(surveyData),
    });

    alert("Survey Created!");
    router.refresh(); // Refresh page after survey is created
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-md max-w-3xl mx-auto">
      {/* Survey Form
      <div className="mt-6">
        <CreateSurveyForm events={events} />
      </div> */}

      <h1 className="text-2xl font-bold mb-4">Create Survey</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Survey Title */}
        <Input value={surveyTitle} onChange={(e) => setSurveyTitle(e.target.value)} placeholder="Survey Title" required />

        {/* Select Event */}
        <Select onValueChange={setSelectedEvent} defaultValue={selectedEvent}>
          <SelectTrigger>
            <SelectValue placeholder="Select Event" />
          </SelectTrigger>
          <SelectContent>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Questions Section */}
        {questions.map((q, index) => (
          <div key={index} className="border p-4 rounded-md shadow-sm">
            {/* Question Text */}
            <Input value={q.text} onChange={(e) => updateQuestionText(index, e.target.value)} placeholder={`Question ${index + 1}`} required />

            {/* Select Question Type */}
            <Select onValueChange={(value) => updateQuestionType(index, value)} defaultValue={q.type}>
              <SelectTrigger>
                <SelectValue placeholder="Select Question Type" />
              </SelectTrigger>
              <SelectContent>
                {questionTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* MCQ / Checkbox Options */}
            {(q.type === "mcq" || q.type === "checkbox") && (
              <div className="mt-2">
                {q.options?.map((option, oIndex) => (
                  <Input
                    key={oIndex}
                    value={option}
                    onChange={(e) => updateOption(index, oIndex, e.target.value)}
                    placeholder={`Option ${oIndex + 1}`}
                    required
                  />
                ))}
                <Button type="button" onClick={() => addOption(index)} className="mt-2 bg-blue-500 text-white">
                  + Add Option
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Add New Question */}
        <Button type="button" onClick={addQuestion} className="bg-gray-600 text-white">
          + Add Question
        </Button>

        {/* Submit Survey */}
        <Button type="submit" className="bg-green-500 text-white w-full">
          Create Survey
        </Button>
      </form>
    </div>
  );
}
