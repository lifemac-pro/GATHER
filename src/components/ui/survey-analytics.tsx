"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function SurveyAnalytics() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");

  const [surveyData, setSurveyData] = useState<{
    labels: string[];
    responses: number[];
    yesNo: { yes: number; no: number };
  }>({
    labels: [],
    responses: [],
    yesNo: { yes: 0, no: 0 },
  });

  useEffect(() => {
    if (!eventId) return;

    async function fetchSurveyData() {
      try {
        console.log("Fetching data for event ID:", eventId);
        const response = await fetch(`/api/surveys?eventId=${eventId}`);
        const data: { questions: { text: string; score: number }[]; yesNo?: { yes: number; no: number } } = await response.json();
        console.log("Fetched Data:", data);

        if (!data || !data.questions) {
          console.error("Invalid data format:", data);
          return;
        }

        setSurveyData({
          labels: data.questions.map((q) => q.text),
          responses: data.questions.map((q) => q.score),
          yesNo: { yes: data.yesNo?.yes ?? 0, no: data.yesNo?.no ?? 0 },
        });
      } catch (error) {
        console.error("Error fetching survey data:", error);
      }
    }

    fetchSurveyData();
  }, [eventId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* ✅ Bar Chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Survey Question Responses</CardTitle>
        </CardHeader>
        <CardContent>
          {surveyData.responses.length > 0 ? (
            <Bar
              key={JSON.stringify(surveyData.responses)} // 🔑 Force re-render
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
          ) : (
            <p className="text-gray-500">No survey responses available.</p>
          )}
        </CardContent>
      </Card>

      {/* ✅ Pie Chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Yes/No Survey Responses</CardTitle>
        </CardHeader>
        <CardContent>
          {surveyData.yesNo.yes > 0 || surveyData.yesNo.no > 0 ? (
            <Pie
              key={JSON.stringify(surveyData.yesNo)}
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
          ) : (
            <p className="text-gray-500">No Yes/No responses available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
