import React from "react";
import Sidebar from "../../../components/ui/sidebar";
import EventCard from "../../../components/ui/featured-events";
import {Button} from "../../../components/ui/button";

const Dashboard = () => {
  const handleRegister = (eventTitle: string) => {
    alert(`You have registered for ${eventTitle}!`);
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-white">
        <h1 className="text-3xl font-bold text-[#E1A913]">Welcome, User!</h1>
        <p className="text-[#B0B8C5]">Manage your event registrations and feedback.</p>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold text-[#E1A913]">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <EventCard 
              title="Tech Conference 2025" 
              date="March 30, 2025" 
              status="Not Registered"
              actionButton={
                <Button variant="outline" onClick={() => handleRegister("Tech Conference 2025")}>
                  Register
                </Button>
              }
            />

            <EventCard 
              title="AI & Web3 Summit" 
              date="May 15, 2025" 
              status="Not Registered"
              actionButton={
                <Button variant="outline" onClick={() => handleRegister("AI & Web3 Summit")}>
                  Register
                </Button>
              }
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
