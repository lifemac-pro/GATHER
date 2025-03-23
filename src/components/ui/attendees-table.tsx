'use client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import BulkMessageDialog from "@/components/ui/bulk-message-dialog";
import SendSurveyDialog from "@/components/ui/send-survey-dialog";
import { exportToCSV, exportToPDF } from "@/utils/export-data";

const attendees = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", phone: "+123456789", event: "Tech Conference" },
  { id: 2, name: "Michael Smith", email: "michael@example.com", phone: "+987654321", event: "Startup Pitch Night" },
  { id: 3, name: "Sarah Lee", email: "sarah@example.com", phone: "+112233445", event: "Networking Night" },
];



export default function AttendeesTable() {
  // State for keeping track of which attendees are selected
  const [selectedAttendees, setSelectedAttendees] = useState<number[]>([]);

  // Toggles the selection of an attendee, either adding or removing them from the list
  const toggleSelection = (id: number) => {
    setSelectedAttendees((prev) =>
      // If the attendee is already selected, filter them out of the list
      prev.includes(id) ? prev.filter((attendeeId) => attendeeId !== id) : 
      // Otherwise, add them to the list
      [...prev, id]
    );
  };

  return (
    <div>

 {/* Export Buttons */}
 <Button variant="secondary" onClick={() => exportToCSV(attendees, "attendees.csv")}>
          Export CSV
        </Button>
        <Button variant="secondary" onClick={() => exportToPDF(attendees, ["id", "name", "email", "event"], "attendees.pdf")}>
          Export PDF
        </Button>



      {/* Send Survey Button */}
      <SendSurveyDialog selectedAttendees={selectedAttendees} attendees={attendees} />
      {/* 
        Button for sending a bulk message to selected attendees 
        Dialog component is defined below
      */}
      <BulkMessageDialog selectedAttendees={selectedAttendees} attendees={attendees} />
      

      <Button className="mb-4 bg-[#E1A913] text-[#072446] px-4 py-2">Add New Attendee</Button>
      
      {/* 
        Table component from the Radix UI library
        It expects a header and body, and handles layout and styling
      */}
      <Table className="mt-6">
        {/* 
          Table header component
          expects a single TableRow component
        */}
        <TableHeader>
          <TableRow>
            {/* 
              Checkbox component that toggles the selection of all attendees
              If all attendees are selected, it will be checked
              If no attendees are selected, it will be unchecked
            */}
            <TableHead>
              <Checkbox
                // Conditionally render the checkbox as checked or unchecked
                checked={selectedAttendees.length === attendees.length}
                // Toggle the selection of all attendees when the checkbox is clicked
                onCheckedChange={() =>
                  setSelectedAttendees(
                    // If all attendees are selected, set the list to empty
                    selectedAttendees.length === attendees.length ? [] : 
                    // Otherwise, set the list to all attendee IDs
                    attendees.map((a) => a.id)
                  )
                }
              />
            </TableHead>
            {/* 
              Table header cells
              These are the column headers
            */}
            <TableHead>Attendee Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Registered Event</TableHead>
          </TableRow>
        </TableHeader>
        {/* 
          Table body component
          expects one or more TableRow components
        */}
        <TableBody>
          {/* 
            Map over the list of attendees and render a TableRow for each
          */}
          {attendees.map((attendee) => (
            <TableRow key={attendee.id}>
              {/* 
                Checkbox component that toggles the selection of an individual attendee
              */}
              <TableCell>
                <Checkbox 
                  // Conditionally render the checkbox as checked or unchecked
                  checked={selectedAttendees.includes(attendee.id)} 
                  // Toggle the selection of the attendee when the checkbox is clicked
                  onCheckedChange={() => toggleSelection(attendee.id)} 
                />
              </TableCell>
              {/* 
                Table cells for the attendee's information
              */}
              <TableCell>{attendee.name}</TableCell>
              <TableCell>{attendee.email}</TableCell>
              <TableCell>{attendee.phone}</TableCell>
              <TableCell>{attendee.event}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
