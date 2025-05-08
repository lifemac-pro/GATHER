"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserRound, Users, ChevronRight } from "lucide-react";
import { api } from "@/trpc/react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";

export function RoleSelection() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "user" | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { isSignedIn } = useUser();

  const updateRole = api.user.updateRole.useMutation({
    onSuccess: (data) => {
      console.log("Role update response:", data);
      try {
        // Handle the case where data might be undefined or null
        if (!data) {
          console.error("Role update response is undefined or null");
          toast({
            title: "Success",
            description: "Role set successfully. Redirecting to dashboard...",
          });

          // Default to attendee dashboard if we don't know the role
          setTimeout(() => {
            window.location.href = "/attendee/dashboard";
          }, 1000);
          return;
        }

        if (data.success) {
          // Show success toast
          toast({
            title: "Success",
            description: "Role set successfully. Redirecting...",
          });

          // Force a hard reload to ensure the middleware picks up the new role
          const role = data.role || selectedRole || "user";
          const redirectUrl = (role === "admin" || role === "super_admin")
            ? "/admin/dashboard"
            : "/attendee/dashboard";
          console.log("Role updated successfully, redirecting to:", redirectUrl);

          // Add a small delay before redirecting
          setTimeout(() => {
            window.location.href = redirectUrl; // Use window.location.href for a full page reload
          }, 1000);
        } else {
          toast({
            title: "Error",
            description: "Failed to set role. Please try again.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Error processing success response:", err);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Error setting role:", error);

      try {
        // If there's no error message, provide a default
        if (!error || !error.message) {
          console.error("Error object is undefined or has no message");
          toast({
            title: "Error",
            description: "Failed to set role. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // If role is already set, show a different message and redirect
        if (error.message.includes("Role has already been set")) {
          toast({
            title: "Already Set",
            description: "Your role is already set. Redirecting to your dashboard...",
          });

          // Close the dialog
          setIsOpen(false);

          // Redirect to role selection page which will then redirect to the appropriate dashboard
          setTimeout(() => {
            window.location.href = "/role-selection";
          }, 1000);
          return;
        }

        // For validation errors
        if (error.message.includes("invalid_type") || error.message.includes("Required")) {
          console.error("Validation error:", error.message);
          toast({
            title: "Error",
            description: "Invalid role selection. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // For other errors
        toast({
          title: "Error",
          description: error.message || "Failed to set role. Please try again.",
          variant: "destructive",
        });
      } catch (err) {
        console.error("Error handling error response:", err);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
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

    // Check if user is signed in
    if (!isSignedIn) {
      // If not signed in, redirect to sign-in page
      console.log("User not signed in, redirecting to sign-in page");
      toast({
        title: "Sign in required",
        description: "Please sign in to continue",
      });

      // Close the dialog
      setIsOpen(false);

      // Redirect to sign-in page
      setTimeout(() => {
        window.location.href = "/sign-in";
      }, 1000);
      return;
    }

    console.log("Submitting role update:", selectedRole);
    try {
      // Show a loading toast
      toast({
        title: "Setting role...",
        description: "Please wait while we set your role",
      });

      try {
        // Make sure selectedRole is not null before sending
        if (!selectedRole) {
          console.error("Selected role is null, using default 'user' role");
          const result = await updateRole.mutateAsync({
            role: "user",
          });
          console.log("Role update result (default):", result);
        } else {
          const result = await updateRole.mutateAsync({
            role: selectedRole,
          });
          console.log("Role update result:", result);
        }
      } catch (mutationError) {
        console.error("Error in mutation:", mutationError);
        // The error is handled in the mutation's onError callback
        // But we'll add an extra toast here just in case
        toast({
          title: "Error",
          description: "Failed to set role. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in handleContinue:", error);
      // Show a generic error message
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to handle the Get Started button click
  const handleGetStarted = () => {
    // If user is not signed in, redirect to sign-in page
    if (!isSignedIn) {
      console.log("User not signed in, redirecting to sign-in page");
      toast({
        title: "Sign in required",
        description: "Please sign in to continue",
      });

      // Redirect to sign-in page
      setTimeout(() => {
        window.location.href = "/sign-in";
      }, 1000);
      return;
    }

    // If user is signed in, open the dialog
    setIsOpen(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        className="bg-white text-primary transition-all duration-200 hover:bg-white/90 hover:shadow-lg"
        size="lg"
        onClick={handleGetStarted}
      >
        Get Started
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
