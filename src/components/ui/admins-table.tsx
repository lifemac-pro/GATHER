'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AddAdminDialog from "@/components/ui/add-admin-dialog";

const admins = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Super Admin", dateAdded: "2024-03-01" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Admin", dateAdded: "2024-03-05" },
];

export default function AdminsTable() {
  const [] = useState(null);

  return (
    <div>
      {/* Add Admin Button */}
      <AddAdminDialog />

      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>Admin Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Date Added</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell>{admin.name}</TableCell>
              <TableCell>{admin.email}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-md ${admin.role === "Super Admin" ? "bg-red-200 text-red-800" : "bg-blue-200 text-blue-800"}`}>
                  {admin.role}
                </span>
              </TableCell>
              <TableCell>{admin.dateAdded}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" className="mr-2">
                  Resend Verification
                </Button>
                <Button variant="destructive" size="sm">
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
