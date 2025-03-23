"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function AddAdminDialog() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Admin");

  const handleAddAdmin = async () => {
    console.log("Adding admin:", { email, role });

    // Call API to send invite email
    const response = await fetch("/api/add-admin", {
      method: "POST",
      body: JSON.stringify({ email, role }),
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      alert("Admin added successfully!");
    } else {
      alert("Failed to add admin.");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mt-4 bg-[#00b0a6] text-white">+ Add Admin</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Admin</DialogTitle>
        </DialogHeader>

        {/* Email Input */}
        <Input placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} />

        {/* Select Role */}
        <Select onValueChange={(val) => setRole(val)} defaultValue="Admin">
          <SelectTrigger>
            <SelectValue placeholder="Select Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Super Admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>

        {/* Submit Button */}
        <Button onClick={handleAddAdmin} className="mt-4 bg-[#00b0a6] text-white">
          Add Admin
        </Button>
      </DialogContent>
    </Dialog>
  );
}
