import Sidebar from "@/components/ui/sidebar";
import SurveyAnalytics from "@/components/ui/survey-analytics";

export default function AnalyticsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-grow p-6 bg-[#F8FAFC]">
        <h1 className="text-3xl font-bold text-[#072446]">Survey Analytics</h1>
        <SurveyAnalytics />
      </main>
    </div>
  );
}
