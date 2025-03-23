"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";

// Register required Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Example survey response data
const surveyData = {
  labels: ["Q1: Event Satisfaction", "Q2: Speaker Quality", "Q3: Venue Experience"],
  responses: [85, 70, 90], // Sample responses (out of 100)
  yesNo: { yes: 120, no: 30 }, // Yes/No survey responses
};

export default function SurveyAnalytics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Bar Chart for Question Responses */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Survey Question Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar
            data={{
              labels: surveyData.labels,
              datasets: [
                {
                  label: "Response Score",
                  data: surveyData.responses,
                  backgroundColor: ["#00b0a6", "#E1A913", "#072446"],
                },
              ],
            }}
            options={{ responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }}
          />
        </CardContent>
      </Card>

      {/* Pie Chart for Yes/No Responses */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Yes/No Survey Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <Pie
            data={{
              labels: ["Yes", "No"],
              datasets: [
                {
                  data: [surveyData.yesNo.yes, surveyData.yesNo.no],
                  backgroundColor: ["#00b0a6", "#E1A913"],
                },
              ],
            }}
            options={{ responsive: true }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
