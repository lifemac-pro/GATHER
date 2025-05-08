"use client";

import { useState, useEffect } from "react";
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
        // Show success message
        setError(null);

        // Force a hard reload to ensure the middleware picks up the new role
        const redirectUrl = selectedRole === "admin"
          ? "/admin/dashboard"
          : "/attendee/dashboard";
        console.log("Redirecting to:", redirectUrl);

        // Add a small delay before redirecting
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);
      } else {
        setError("Failed to set role. Please try again.");
        setIsSubmitting(false);
      }
    },
    onError: (error) => {
      console.error("Error setting role:", error);

      // If role is already set, show a different message and redirect
      if (error.message && error.message.includes("Role has already been set")) {
        setError("Your role is already set. Redirecting to your dashboard...");

        // Just redirect to the role selection page which will handle the redirection
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
        return;
      }

      setError(error.message || "An error occurred. Please try again.");
      setIsSubmitting(false);
    },
  });

  const handleRoleSelect = (role: "admin" | "user") => {
    setSelectedRole(role);
    setError(null);
  };

  // Check if user already has a role when the component loads
  useEffect(() => {
    if (user && isLoaded) {
      const checkExistingRole = async () => {
        console.log("Checking if user already has a role");
        setError("Checking your role...");

        try {
          // Use the query directly
          const role = await api.user.getRole.query();

          console.log("User role check result:", role);

          if (role) {
            setError(`You already have the role: ${role}. Redirecting to your dashboard...`);

            // Redirect to appropriate dashboard
            const redirectUrl = role === "admin" ? "/admin/dashboard" : "/attendee/dashboard";
            console.log("Redirecting to:", redirectUrl);

            // Add a small delay before redirecting
            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 1500);
          } else {
            setError(null);
          }
        } catch (error) {
          console.error("Error checking existing role:", error);
          setError(null);
        }
      };

      checkExistingRole();
    }
  }, [user, isLoaded]);

  const handleContinue = async () => {
    if (!selectedRole || !user) {
      setError("Please select a role");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log("Setting role:", selectedRole);

      // Show a success message while processing
      setError("Setting your role... Please wait.");

      const result = await setRoleMutation.mutateAsync({
        role: selectedRole,
      });

      console.log("Role update result:", result);

      // Success message is handled in the mutation's onSuccess callback
    } catch (error) {
      console.error("Error in handleContinue:", error);
      // Error is already handled in the mutation's onError callback
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
    // If user is not signed in, redirect to sign-in page
    console.log("User not signed in, redirecting to sign-in page");

    // Use useEffect to handle the redirect
    useEffect(() => {
      // Add a small delay before redirecting
      const timer = setTimeout(() => {
        window.location.href = "/sign-in";
      }, 1000);

      // Clean up the timer
      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Please sign in to continue..." />
      </div>
    );
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
