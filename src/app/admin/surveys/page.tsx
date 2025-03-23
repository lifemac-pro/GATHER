import Sidebar from "@/components/ui/sidebar";
import SurveysTable from "@/components/ui/surveys-table";

export default function SurveysPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-grow p-6 bg-[#F8FAFC]">
        <h1 className="text-3xl font-bold text-[#072446]">Manage Surveys</h1>
        <SurveysTable />
      </main>
    </div>
  );
}
