"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation"; 

export default function CreateSurveyForm({ events }: { events: { id: string; name: string }[] }) {
  const router = useRouter();
  const [surveyTitle, setSurveyTitle] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(events[0]?.id || "");
  const [questions, setQuestions] = useState([""]);

  const addQuestion = () => setQuestions([...questions, ""]);
  const updateQuestion = (index: number, value: string) => {
    const updated = [...questions];
    updated[index] = value;
    setQuestions(updated);
  };

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
    <div className="bg-white p-6 shadow-md rounded-md">
      <h2 className="text-xl font-bold mb-4">Create Survey</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Survey Title */}
        <Input value={surveyTitle} onChange={(e) => setSurveyTitle(e.target.value)} placeholder="Survey Title" required />

        {/* Select Event */}
        <select className="p-2 border rounded-md w-full" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
          {events.map((event) => (
            <option key={event.id} value={event.id}>{event.name}</option>
          ))}
        </select>

        {/* Questions */}
        {questions.map((q, index) => (
          <Textarea key={index} value={q} onChange={(e) => updateQuestion(index, e.target.value)} placeholder={`Question ${index + 1}`} required />
        ))}

        {/* Add More Questions */}
        <Button type="button" onClick={addQuestion} className="bg-blue-500 text-white">+ Add Question</Button>

        {/* Submit Button */}
        <Button type="submit" className="bg-green-500 text-white w-full">Create Survey</Button>
      </form>
    </div>
  );
}
