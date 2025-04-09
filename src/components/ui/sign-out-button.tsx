"use client";

import { useState, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

type SignOutButtonProps = {
  redirectUrl?: string;
  className?: string;
  children: React.ReactNode;
};

export function SignOutButton({
  redirectUrl = "/",
  className,
  children,
}: SignOutButtonProps) {
  const { signOut } = useClerk();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // This effect runs only on the client after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    // Only execute client-side logic after component is mounted
    if (!mounted) return;

    try {
      await signOut();
      // Use window.location for a full page reload
      window.location.href = redirectUrl;
    } catch (error) {
      // If there's an error signing out, just redirect anyway
      console.error("Error signing out, redirecting anyway:", error);
      window.location.href = redirectUrl;
    }
  };

  // During server rendering or before hydration, render a button with the same appearance
  // but without any client-side behavior
  if (!mounted) {
    return <button className={className}>{children}</button>;
  }

  // After hydration, render the fully functional button
  return (
    <button className={className} onClick={handleSignOut}>
      {children}
    </button>
  );
}
