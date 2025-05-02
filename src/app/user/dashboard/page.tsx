"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { api } from "@/trpc/react";

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // Get user role
  const { data: userRole, isLoading: isLoadingRole } = api.user.getRole.useQuery();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || isLoadingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Welcome to Your Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Add your dashboard content here */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Your Profile</h2>
          <p>Name: {user.firstName} {user.lastName}</p>
          <p>Email: {user.emailAddresses[0]?.emailAddress}</p>
          <p>Role: {userRole}</p>
        </div>
      </div>
    </div>
  );
} 