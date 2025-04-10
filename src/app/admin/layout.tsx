"use client";

// import { Sidebar } from "@/components/ui/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* <Sidebar /> */}
      <main className="flex-1 bg-gray-50 p-8 overflow-auto">{children}</main>
    </div>
  );
}
