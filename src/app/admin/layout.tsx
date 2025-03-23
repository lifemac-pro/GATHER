import ThemeToggle from "@/components/ui/theme-toggle";
// import Sidebar from "@/components/ui/sidebar";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      
      <div className="hidden md:block">
      
      </div>
      <ThemeToggle />
      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
