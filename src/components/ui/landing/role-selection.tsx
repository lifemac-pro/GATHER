"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserRound, Users, ChevronRight } from "lucide-react";
import { api } from "@/trpc/react";
import { useToast } from "@/hooks/use-toast";

export function RoleSelection() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "user" | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  
  const updateRole = api.user.updateRole.useMutation({
    onSuccess: (data) => {
      console.log("Role update response:", data);
      if (data.success) {
        // Force a hard reload to ensure the middleware picks up the new role
        const redirectUrl = selectedRole === "admin" ? "/admin/dashboard" : "/attendee/dashboard";
        console.log("Role updated successfully, redirecting to:", redirectUrl);
        window.location.href = redirectUrl; // Use window.location.href for a full page reload
      } else {
        toast({
          title: "Error",
          description: "Failed to set role. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Error setting role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to set role",
        variant: "destructive",
      });
      // If role is already set, close the dialog
      if (error.message.includes("Role has already been set")) {
        setIsOpen(false);
      }
    },
  });

  const handleRoleSelect = (role: "admin" | "user") => {
    console.log("Selected role:", role);
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Submitting role update:", selectedRole);
    try {
      await updateRole.mutateAsync({
        role: selectedRole,
      });
    } catch (error) {
      console.error("Error in handleContinue:", error);
      toast({
        title: "Error",
        description: "Failed to set role. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className="bg-white text-primary transition-all duration-200 hover:bg-white/90 hover:shadow-lg"
            size="lg"
          >
            Get Started
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Choose Your Role</DialogTitle>
            <DialogDescription className="text-center">
              Select how you want to use GatherEase. This choice cannot be changed later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${selectedRole === "admin" ? "border-primary ring-2 ring-primary" : ""}`}
              onClick={() => handleRoleSelect("admin")}
            >
              <CardHeader className="pb-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <UserRound className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="pt-2 text-center">Event Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Create and manage events, surveys, and registrations
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${selectedRole === "user" ? "border-primary ring-2 ring-primary" : ""}`}
              onClick={() => handleRoleSelect("user")}
            >
              <CardHeader className="pb-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="pt-2 text-center">Event Attendee</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Register for events, complete surveys, and manage your tickets
                </CardDescription>
              </CardContent>
            </Card>
          </div>
          
          <CardFooter className="flex justify-center">
            <Button 
              className="w-full" 
              disabled={!selectedRole || updateRole.isLoading}
              onClick={handleContinue}
            >
              {updateRole.isLoading ? (
                "Updating..."
              ) : (
                <>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
