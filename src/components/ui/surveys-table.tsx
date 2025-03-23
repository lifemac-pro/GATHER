'use client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import CreateSurveyDialog from "@/components/ui/create-survey-dialog";
import { exportToCSV, exportToPDF } from "@/utils/export-data";

const surveys = [
  { id: 1, title: "Tech Conference Feedback", event: "Tech Conference", responses: 120 },
  { id: 2, title: "Startup Pitch Night Survey", event: "Startup Pitch Night", responses: 85 },
];

export default function SurveysTable() {
  return (
    <div>
      {/* Export Buttons */}
      <Button variant="secondary" onClick={() => exportToCSV(surveys, "surveys.csv")}>
        Export CSV
      </Button>
      <Button variant="secondary" onClick={() => exportToPDF(surveys, ["id", "title", "responses"], "surveys.pdf")}>
        Export PDF
      </Button>
      
      {/* Create Survey Button */}
      <CreateSurveyDialog />

      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>Survey Title</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Responses</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {surveys.map((survey) => (
            <TableRow key={survey.id}>
              <TableCell>{survey.title}</TableCell>
              <TableCell>{survey.event}</TableCell>
              <TableCell>{survey.responses}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" className="mr-2">
                  View Responses
                </Button>
                <Button variant="secondary" size="sm">
                  Export CSV
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
