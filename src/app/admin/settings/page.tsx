"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
export default function SettingsPage() {
  const [username, setUsername] = useState("Admin");
  const [password, setPassword] = useState("");

  const handleUpdateSettings = () => {
    alert("Settings updated!");
  };

  return (
    <div>
      <Sidebar/>
      <h1 className="text-3xl font-bold text-[#072446]">Admin Settings</h1>

      <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-4" />
      <Input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-4" />

      <Button onClick={handleUpdateSettings} className="mt-4 bg-[#00b0a6] text-white">
        Update Settings
      </Button>
    </div>
  );
}
