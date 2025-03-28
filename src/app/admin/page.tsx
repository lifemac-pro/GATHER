"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Calendar, Users, ClipboardList, Timer } from "lucide-react";
//import Navbar from "../../components/ui/navbar";
import AttendeesChart from "@/components/ui/AttendeesChart"; 

import {api} from "@/server/"

const stats = [
  { title: "Total Events", value: "12", icon: <Calendar size={28} />, color: "bg-blue-500" },
  { title: "Total Attendees", value: "230", icon: <Users size={28} />, color: "bg-green-500" },
  { title: "Surveys Completed", value: "98", icon: <ClipboardList size={28} />, color: "bg-yellow-500" },
  { title: "Next Event In", value: "2d 5h", icon: <Timer size={28} />, color: "bg-purple-500" },
];

export default function AdminDashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar
      <Navbar /> */}

      <div className="flex flex-col flex-grow pt-[70px] p-6 bg-[#F8FAFC] overflow-y-auto">
        {/* Main Content */}
        <main className="flex-grow p-4 sm:p-6 bg-[#F8FAFC] w-full transition-all">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className="shadow-lg w-full min-h-[140px] flex flex-col justify-between bg-[#072446] text-white p-4 rounded-lg"
              >
                <CardHeader className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full text-white ${stat.color} flex items-center justify-center`}>
                    {stat.icon}
                  </div>
                  <CardTitle className="text-white text-sm sm:text-lg">{stat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Analytics Chart */}
          <div className="mt-6">
            <AttendeesChart />
          </div>
        </main>
      </div>
    </div>
  );
}
