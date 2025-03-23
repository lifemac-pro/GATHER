import Sidebar from "@/components/ui/sidebar";
import AttendeesTable from "@/components/ui/attendees-table";

export default function AttendeesPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-grow p-6 bg-[#F8FAFC]">
        <h1 className="text-3xl font-bold text-[#072446]">Manage Attendees</h1>
        <AttendeesTable />
      </main>
    </div>
  );
}
