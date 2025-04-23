import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function SignOutSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>

        <h2 className="mt-6 text-3xl font-bold text-gray-900">
          You've been signed out
        </h2>

        <p className="mt-2 text-gray-600">
          Thank you for using GatherEase. You have been successfully signed out
          of your account.
        </p>

        <div className="mt-8 space-y-4">
          <Button asChild className="w-full">
            <Link href="/sign-in">Sign back in</Link>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href="/">Return to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
