"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import BulkMessageDialog from "@/components/ui/bulk-message-dialog";
import SendSurveyDialog from "@/components/ui/send-survey-dialog";
import { exportToCSV, exportToPDF } from "@/utils/export-data";

interface Attendee {
  id: number;
  name: string;
  email: string;
  phone: string;
  event: string;
}

// Sample Attendees Data
const attendees: Attendee[] = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", phone: "+123456789", event: "Tech Conference" },
  { id: 2, name: "Michael Smith", email: "michael@example.com", phone: "+987654321", event: "Startup Pitch Night" },
  { id: 3, name: "Sarah Lee", email: "sarah@example.com", phone: "+112233445", event: "Networking Night" },
];

export default function AttendeesTable({ selectedEvent }: { selectedEvent: string }) {
  const [selectedAttendees, setSelectedAttendees] = useState<number[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>(attendees);

  useEffect(() => {
    if (selectedEvent) {
      setFilteredAttendees(attendees.filter((attendee) => attendee.event === selectedEvent));
    } else {
      setFilteredAttendees(attendees);
    }
  }, [selectedEvent]);

  const toggleSelection = (id: number) => {
    setSelectedAttendees((prev) =>
      prev.includes(id) ? prev.filter((attendeeId) => attendeeId !== id) : [...prev, id]
    );
  };

  return (
    <div>
      {/* Export Buttons */}
      <div className="flex space-x-2 mb-4">
        <Button variant="secondary" onClick={() => exportToCSV(filteredAttendees.map(({ id, name, email, phone, event }) => ({ id, name, email, phone, event })), "attendees.csv")}>
          Export CSV
        </Button>
        <Button variant="secondary" onClick={() => exportToPDF(filteredAttendees.map(({ id, name, email, phone, event }) => ({ id, name, email, phone, event })), ["id", "name", "email", "event"], "attendees.pdf")}>
          Export PDF
        </Button>
      </div>

      {/* Bulk Actions with Spacing */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <SendSurveyDialog selectedAttendees={selectedAttendees} attendees={filteredAttendees} />
        <BulkMessageDialog selectedAttendees={selectedAttendees} attendees={filteredAttendees} />
      </div>

      {/* Add Attendee Button
      <Button className="mb-4 bg-[#E1A913] text-[#072446] px-4 py-2">Add New Attendee</Button> */}

      {/* Attendees Table */}
      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={selectedAttendees.length === filteredAttendees.length && filteredAttendees.length > 0}
                onCheckedChange={() =>
                  setSelectedAttendees(
                    selectedAttendees.length === filteredAttendees.length ? [] : filteredAttendees.map((a) => a.id)
                  )
                }
              />
            </TableHead>
            <TableHead>Attendee Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Registered Event</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAttendees.length > 0 ? (
            filteredAttendees.map((attendee) => (
              <TableRow key={attendee.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedAttendees.includes(attendee.id)}
                    onCheckedChange={() => toggleSelection(attendee.id)}
                  />
                </TableCell>
                <TableCell>{attendee.name}</TableCell>
                <TableCell>{attendee.email}</TableCell>
                <TableCell>{attendee.phone}</TableCell>
                <TableCell>{attendee.event}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-4 text-gray-500">
                No attendees found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
