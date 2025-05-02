"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRound, Users } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { api } from "@/trpc/react";

export default function RoleSelectionPage() {
  const { user, isLoaded } = useUser();
  const [selectedRole, setSelectedRole] = useState<"admin" | "user" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setRoleMutation = api.user.setRole.useMutation({
    onSuccess: async (data) => {
      console.log("Role set successfully:", data);
      if (data.success) {
        // Force a hard reload to ensure the middleware picks up the new role
        const redirectUrl = selectedRole === "admin" 
          ? "/admin/dashboard" 
          : "/attendee/dashboard";
        console.log("Redirecting to:", redirectUrl);
        window.location.href = redirectUrl;
      } else {
        setError("Failed to set role. Please try again.");
        setIsSubmitting(false);
      }
    },
    onError: (error) => {
      console.error("Error setting role:", error);
      setError(error.message || "An error occurred. Please try again.");
      setIsSubmitting(false);
    },
  });

  const handleRoleSelect = (role: "admin" | "user") => {
    setSelectedRole(role);
    setError(null);
  };

  const handleContinue = async () => {
    if (!selectedRole || !user) {
      setError("Please select a role");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("Setting role:", selectedRole);
      await setRoleMutation.mutateAsync({
        role: selectedRole,
      });
    } catch (error) {
      console.error("Error in handleContinue:", error);
      setError("Failed to set role. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to GatherEase</h1>
          <p className="mt-2 text-gray-600">
            Please select how you want to use the platform
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedRole === "admin" ? "border-primary ring-2 ring-primary" : ""
            }`}
            onClick={() => handleRoleSelect("admin")}
          >
            <CardHeader className="pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <UserRound className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="pt-2 text-center">Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Create and manage events, surveys, and registrations
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedRole === "user" ? "border-primary ring-2 ring-primary" : ""
            }`}
            onClick={() => handleRoleSelect("user")}
          >
            <CardHeader className="pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="pt-2 text-center">Attendee</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Register for events, complete surveys, and manage your tickets
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Button
          className="w-full"
          disabled={!selectedRole || isSubmitting}
          onClick={handleContinue}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Setting up your account...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
