"use client";

import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

// Register necessary chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Dummy data for chart (Replace with real data if needed)
const chartData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Total Attendees",
      data: [30, 45, 60, 75, 90, 120], // Update this with real data
      backgroundColor: "#343434",
    },
    {
      label: "Total Events",
      data: [5, 8, 6, 10, 12, 15], // Update this with real data
      backgroundColor: "#A0A0A0",
    },
  ],
};

// Chart options
const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },  
  },
};

export default function AttendeesChart() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-bold text-[#072446] mb-4">Attendee & Event Analytics</h2>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}
