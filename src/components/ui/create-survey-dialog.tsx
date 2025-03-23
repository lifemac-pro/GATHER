"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const events = ["Tech Conference", "Startup Pitch Night", "Networking Night"];

export default function CreateSurveyDialog() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");

  const handleCreateSurvey = () => {
    console.log("Creating survey:", { title, description, event: selectedEvent });
    alert("Survey Created Successfully!");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mt-4 bg-[#00b0a6] text-white">+ Create Survey</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Survey</DialogTitle>
        </DialogHeader>

        {/* Survey Title */}
        <Input placeholder="Survey Title" value={title} onChange={(e) => setTitle(e.target.value)} />

        {/* Survey Description */}
        <Textarea placeholder="Survey Description" value={description} onChange={(e) => setDescription(e.target.value)} />

        {/* Select Event */}
        <Select onValueChange={(val) => setSelectedEvent(val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Event" />
          </SelectTrigger>
          <SelectContent>
            {events.map((event, index) => (
              <SelectItem key={index} value={event}>
                {event}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Submit Button */}
        <Button onClick={handleCreateSurvey} className="mt-4 bg-[#00b0a6] text-white">
          Create Survey
        </Button>
      </DialogContent>
    </Dialog>
  );
}
