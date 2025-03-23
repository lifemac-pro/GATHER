import Sidebar from "@/components/ui/sidebar";
import EventsTable from "@/components/ui/events_table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EventsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-grow p-6 bg-[#F8FAFC]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#072446]">Manage Events</h1>
          <Link href="/admin/events/create">
            <Button className="bg-[#00b0a6] text-white">+ Create Event</Button>
          </Link>
        </div>
        <EventsTable />
      </main>
    </div>
  );
}
