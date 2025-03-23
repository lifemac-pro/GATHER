import Sidebar from "@/components/ui/sidebar";
import AdminsTable from "@/components/ui/admins-table";

export default function AdminsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-grow p-6 bg-[#F8FAFC]">
        <h1 className="text-3xl font-bold text-[#072446]">Manage Admins</h1>
        <AdminsTable />
      </main>
    </div>
  );
}
