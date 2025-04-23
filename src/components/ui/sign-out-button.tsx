"use client";

import { useClerk } from "@clerk/nextjs";
import { Button, type ButtonProps } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface SignOutButtonProps extends Omit<ButtonProps, "onClick"> {
  showIcon?: boolean;
  text?: string;
}

export function SignOutButton({
  showIcon = true,
  text = "Sign Out",
  className,
  variant = "default",
  size,
  ...props
}: SignOutButtonProps) {
  const { signOut } = useClerk();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      router.push("/sign-out/success");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
      disabled={isLoading}
      {...props}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {isLoading ? "Signing out..." : text}
    </Button>
  );
}
