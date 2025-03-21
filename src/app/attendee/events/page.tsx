import React from "react";
import Sidebar from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const EventsPage = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-[#E1A913] mb-6">Upcoming Events</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-4 shadow-md bg-white">
            <CardHeader>
              <CardTitle>Tech Conference 2025</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Date: March 30, 2025</p>
              <Button variant="outline" className="mt-4 w-full hover:bg-[#E1A913] hover:text-white">
                Register
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EventsPage;
